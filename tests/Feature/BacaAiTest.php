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
        config(['services.openrouter.key' => 'kunci-uji']);
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
}
