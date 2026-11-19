<?php

namespace Tests\Feature;

use App\Enums\Peran;
use App\Models\Category;
use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;
use Tests\TestCase;

/** FR-19/20, NFR-05: OCR di server, yang dikirim ke AI hanya teks, lewat endpoint ZDR. Gagal = isi manual. */
class BacaAiTest extends TestCase
{
    use RefreshDatabase;

    private User $karyawan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->karyawan = User::factory()->peran(Peran::Karyawan, Division::factory()->create())->create();
        config(['services.openrouter.key' => 'kunci-uji', 'services.gemini.key' => null, 'services.ninerouter.key' => null]);
        Process::fake(['*' => Process::result('SURAT KEPUTUSAN NOMOR 12/SK/PTGM/2026 tentang Tim Pengadaan, ditetapkan 3 Maret 2026')]);
    }

    private function kirim()
    {
        return $this->actingAs($this->karyawan)->postJson('/ai/baca', [
            'berkas' => UploadedFile::fake()->create('surat.pdf', 100, 'application/pdf'),
        ]);
    }

    public function test_mengisi_metadata_dari_teks_dan_hanya_mengirim_teks_lewat_zdr(): void
    {
        $sk = Category::factory()->create(['nama' => 'SK']);
        Http::fake(['openrouter.ai/*' => Http::response(['choices' => [['message' => ['content' => json_encode([
            'judul' => ' Tim Pengadaan ', 'nomor' => '12/SK/PTGM/2026', 'kategori' => 'sk',
            'tanggal_surat' => '2026-03-03', 'tanggal_berlaku' => 'bukan tanggal', 'tanggal_berakhir' => null,
            'abstrak' => 'Pembentukan tim.',
        ])]]]])]);

        $this->kirim()->assertOk()->assertExactJson(['data' => [
            'judul' => 'Tim Pengadaan', 'nomor' => '12/SK/PTGM/2026', 'category_id' => $sk->id,
            'tanggal_surat' => '2026-03-03', 'tanggal_berlaku' => null, 'tanggal_berakhir' => null,
            'abstrak' => 'Pembentukan tim.',
        ]]);

        Http::assertSent(function (Request $r) {
            $isi = json_encode($r->data());

            return $r['provider']['zdr'] === true
                && str_contains($isi, 'NOMOR 12\/SK\/PTGM\/2026')
                && ! str_contains($isi, 'base64');
        });
    }

    public function test_tanpa_kunci_api_memberi_pesan_isi_manual(): void
    {
        config(['services.openrouter.key' => null]);
        Http::fake();

        $this->kirim()->assertStatus(422)->assertJsonPath('message', 'Baca otomatis belum dikonfigurasi. Silakan isi manual.');
        Http::assertNothingSent();
    }

    public function test_layanan_ai_galat_memberi_pesan_ramah(): void
    {
        Http::fake(['openrouter.ai/*' => Http::response('down', 503)]);

        $this->kirim()->assertStatus(422)->assertJsonPath('message', 'Layanan AI sedang sibuk. Coba lagi sebentar, atau isi manual.');
    }

    public function test_scan_tanpa_teks_terbaca_tidak_dikirim_ke_ai(): void
    {
        Process::fake(['*' => Process::result('   ')]);
        Http::fake();

        $this->kirim()->assertStatus(422);
        Http::assertNothingSent();
    }

    public function test_kunci_habis_pindah_ke_kunci_berikutnya_lalu_ke_gemini(): void
    {
        config(['services.openrouter.key' => 'or-1, or-2', 'services.gemini.key' => 'gm-1']);
        $isi = ['choices' => [['message' => ['content' => json_encode(['judul' => 'Dari Gemini'] + array_fill_keys(
            ['nomor', 'kategori', 'tanggal_surat', 'tanggal_berlaku', 'tanggal_berakhir', 'abstrak'], null))]]]];
        Http::fake(fn (Request $r) => match ($r->header('Authorization')[0]) {
            'Bearer or-1' => Http::response('kuota', 429),
            'Bearer or-2' => Http::response('kunci salah', 401),
            'Bearer gm-1' => Http::response($isi),
        });

        $this->kirim()->assertOk()->assertJsonPath('data.judul', 'Dari Gemini');

        Http::assertSentCount(3);
        Http::assertSent(fn (Request $r) => str_starts_with($r->url(), 'https://generativelanguage.googleapis.com/')
            && ! isset($r['provider']) && $r['model'] === config('services.gemini.model'));
    }

    public function test_9router_dipakai_lebih_dulu_dengan_endpoint_dan_model_dari_env(): void
    {
        config(['services.ninerouter' => ['key' => 'nr-1', 'url' => 'http://9router.uji:28417/v1', 'model' => 'testing']]);
        Http::fake(['9router.uji:28417/*' => Http::response(['choices' => [['message' => ['content' => json_encode(['judul' => 'Dari 9router'] + array_fill_keys(
            ['nomor', 'kategori', 'tanggal_surat', 'tanggal_berlaku', 'tanggal_berakhir', 'abstrak'], null))]]]])]);

        $this->kirim()->assertOk()->assertJsonPath('data.judul', 'Dari 9router');

        Http::assertSentCount(1);
        Http::assertSent(fn (Request $r) => $r->url() === 'http://9router.uji:28417/v1/chat/completions'
            && $r['model'] === 'testing' && ! isset($r['provider']) && $r->header('Authorization')[0] === 'Bearer nr-1');
    }

    public function test_jawaban_bukan_json_pindah_ke_penyedia_berikutnya_dan_blok_kode_diterima(): void
    {
        config(['services.openrouter.key' => 'or-1, or-2', 'services.gemini.key' => null]);
        $json = json_encode(['judul' => 'Dari or-2'] + array_fill_keys(['nomor', 'kategori', 'tanggal_surat', 'tanggal_berlaku', 'tanggal_berakhir', 'abstrak'], null));
        Http::fake(fn (Request $r) => Http::response(['choices' => [['message' => ['content' => match ($r->header('Authorization')[0]) {
            'Bearer or-1' => 'Maaf, saya tidak bisa.',
            'Bearer or-2' => "```json
{$json}
```",
        }]]]]));

        $this->kirim()->assertOk()->assertJsonPath('data.judul', 'Dari or-2');
    }
}
