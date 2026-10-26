<?php

namespace Tests\Feature;

use App\Enums\Peran;
use App\Enums\Sifat;
use App\Enums\Status;
use App\Exceptions\TransisiTidakSah;
use App\Models\Division;
use App\Models\Document;
use App\Models\User;
use App\Notifications\Pemberitahuan;
use App\Services\DocumentWorkflow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** Temuan review akhir: tiap tes gagal sebelum perbaikannya. */
class TemuanReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_akun_nonaktif_tidak_bisa_mengambil_berkas_internal_meski_sesi_masih_hidup(): void
    {
        Storage::fake('local');
        $dok = Document::factory()->selesai(Sifat::Internal)->create();
        Storage::put($dok->berkas_final, '%PDF');
        $user = User::factory()->peran(Peran::Karyawan, $dok->division)->create(['aktif' => false]);

        $this->actingAs($user)->get("/dokumen/{$dok->id}/berkas")->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_berkas_internal_tidak_disimpan_di_cache_peramban(): void
    {
        Storage::fake('local');
        $dok = Document::factory()->selesai(Sifat::Internal)->create();
        Storage::put($dok->berkas_final, '%PDF');

        $this->actingAs($dok->pengaju)->get("/dokumen/{$dok->id}/berkas")
            ->assertOk()->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_pemutus_tetap_bisa_membuka_dokumen_yang_ia_tolak(): void
    {
        $divisi = Division::factory()->create();
        $karyawan = User::factory()->peran(Peran::Karyawan, $divisi)->create();
        $manajer = User::factory()->peran(Peran::Manajer, $divisi)->create();
        $gm = User::factory()->peran(Peran::Gm)->create();
        $dok = Document::factory()->create(['division_id' => $divisi->id, 'submitted_by' => $karyawan->id]);
        $alur = app(DocumentWorkflow::class);
        $alur->ajukan($dok, $karyawan);
        $alur->setujui($dok, $manajer);
        $alur->tolak($dok, $gm, 'Perbaiki.');

        foreach ([$manajer, $gm] as $u) {
            $this->assertTrue($u->can('view', $dok), $u->peran->value);
            $this->assertTrue(Document::visibleTo($u)->whereKey($dok->id)->exists(), $u->peran->value);
        }
        $this->assertFalse(User::factory()->peran(Peran::Gm)->create()->can('view', $dok));
    }

    public function test_manajer_tidak_bisa_memutus_pengajuannya_sendiri(): void
    {
        $divisi = Division::factory()->create();
        $manajer = User::factory()->peran(Peran::Manajer, $divisi)->create();
        $dok = Document::factory()->create(['division_id' => $divisi->id, 'submitted_by' => $manajer->id, 'status' => Status::MenungguManajer]);

        $this->assertFalse($manajer->can('decide', $dok));
    }

    public function test_akan_berakhir_karyawan_hanya_divisinya(): void
    {
        $divisi = Division::factory()->create();
        $karyawan = User::factory()->peran(Peran::Karyawan, $divisi)->create();
        Document::factory()->selesai()->create(['tanggal_berakhir' => today()->addDays(5)]);
        $milik = Document::factory()->selesai()->create(['division_id' => $divisi->id, 'tanggal_berakhir' => today()->addDays(5)]);

        $this->withoutVite()->actingAs($karyawan)->get('/akan-berakhir')
            ->assertInertia(fn ($p) => $p->where('dokumen.total', 1)->where('dokumen.data.0.id', $milik->id));
        $this->actingAs($karyawan)->get('/dashboard')
            ->assertInertia(fn ($p) => $p->where('kartu.3.nilai', 1));
    }

    public function test_pengingat_tidak_terlewat_dan_tidak_terkirim_dua_kali(): void
    {
        Notification::fake();
        $divisi = Division::factory()->create();
        $karyawan = User::factory()->peran(Peran::Karyawan, $divisi)->create();
        // Selesai saat sisa masa berlakunya sudah kurang dari 30 hari.
        Document::factory()->selesai()->create(['division_id' => $divisi->id, 'submitted_by' => $karyawan->id, 'tanggal_berakhir' => today()->addDays(10)]);

        $this->artisan('dokumen:pengingat')->assertSuccessful();
        $this->artisan('dokumen:pengingat')->assertSuccessful();

        Notification::assertSentToTimes($karyawan, Pemberitahuan::class, 1);
    }

    public function test_upload_ttd_yang_gagal_tidak_meninggalkan_berkas_yatim(): void
    {
        Storage::fake('local');
        $dok = Document::factory()->create(['status' => Status::MenungguTtd]);
        $this->mock(DocumentWorkflow::class)->shouldReceive('selesaikan')->andThrow(new TransisiTidakSah('Sudah diselesaikan di tab lain.'));

        $this->actingAs($dok->pengaju)->post("/pengajuan/{$dok->id}/selesaikan", [
            'judul' => 'X', 'category_id' => $dok->category_id, 'nomor' => '1', 'abstrak' => 'a', 'tanggal_surat' => '2026-01-01',
            'berkas' => UploadedFile::fake()->create('ttd.pdf', 10, 'application/pdf'),
        ])->assertSessionHas('error');

        $this->assertSame([], Storage::allFiles('dokumen'));
    }
}
