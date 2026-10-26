<?php

namespace Tests\Feature;

use App\Enums\Peran;
use App\Enums\Sifat;
use App\Enums\Status;
use App\Exceptions\TransisiTidakSah;
use App\Models\Division;
use App\Models\Document;
use App\Models\User;
use App\Services\DocumentWorkflow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Modul I: Draf → Approval 1 → Approval 2 → TTD → Selesai, dengan Revisi dan Ditolak. */
class AlurPengajuanTest extends TestCase
{
    use RefreshDatabase;

    private DocumentWorkflow $alur;

    private Division $divisi;

    private User $karyawan;

    private User $manajer;

    private User $gm;

    protected function setUp(): void
    {
        parent::setUp();
        $this->alur = app(DocumentWorkflow::class);
        $this->divisi = Division::factory()->create();
        $this->karyawan = User::factory()->peran(Peran::Karyawan, $this->divisi)->create();
        $this->manajer = User::factory()->peran(Peran::Manajer, $this->divisi)->create();
        $this->gm = User::factory()->peran(Peran::Gm)->create();
    }

    private function draf(): Document
    {
        return Document::factory()->create(['division_id' => $this->divisi->id, 'submitted_by' => $this->karyawan->id]);
    }

    public function test_jalur_lengkap_sampai_selesai_dengan_keputusan_sifat_dari_gm(): void
    {
        $dok = $this->draf();

        $this->alur->ajukan($dok, $this->karyawan);
        $this->assertSame(Status::MenungguManajer, $dok->status);
        $this->assertCount(1, $this->manajer->notifications);

        $this->alur->setujui($dok, $this->manajer);
        $this->assertSame(Status::MenungguGm, $dok->status);
        $this->assertCount(1, $this->gm->notifications);

        $this->alur->setujui($dok, $this->gm, Sifat::Internal);
        $this->assertSame(Status::MenungguTtd, $dok->status);
        $this->assertSame(Sifat::Internal, $dok->sifat);

        $this->alur->selesaikan($dok, $this->karyawan, ['berkas_final' => 'dokumen/ttd.pdf', 'nomor' => '01/SK/2026']);
        $this->assertSame(Status::Selesai, $dok->status);
        $this->assertNotNull($dok->selesai_pada);
        $this->assertSame(['ajukan', 'setujui', 'setujui', 'selesai'], $dok->logs()->pluck('aksi')->all());
    }

    public function test_tolak_wajib_komentar_lalu_kembali_ke_revisi_dan_bisa_diajukan_ulang(): void
    {
        $dok = $this->draf();
        $this->alur->ajukan($dok, $this->karyawan);

        try {
            $this->alur->tolak($dok, $this->manajer, '  ');
            $this->fail('Penolakan tanpa komentar harus gagal.');
        } catch (TransisiTidakSah) {
        }

        $this->alur->tolak($dok, $this->manajer, 'Perbaiki tanggal.');
        $this->assertSame(Status::Revisi, $dok->status);
        $this->assertSame('Perbaiki tanggal.', $dok->logs->last()->catatan);
        $this->assertCount(1, $this->karyawan->notifications);

        $this->alur->ajukan($dok, $this->karyawan);
        $this->assertSame(Status::MenungguManajer, $dok->status);
    }

    public function test_hanya_pemutus_yang_berwenang(): void
    {
        $dok = $this->draf();
        $this->alur->ajukan($dok, $this->karyawan);

        $manajerLain = User::factory()->peran(Peran::Manajer, Division::factory()->create())->create();
        foreach ([$manajerLain, $this->gm, $this->karyawan] as $bukan) {
            try {
                $this->alur->setujui($dok, $bukan);
                $this->fail("{$bukan->peran->value} tidak boleh menyetujui tahap 1.");
            } catch (TransisiTidakSah) {
            }
        }
        $this->assertSame(Status::MenungguManajer, $dok->fresh()->status);
    }

    public function test_tidak_bisa_diajukan_bila_divisi_belum_punya_manajer(): void
    {
        $this->manajer->update(['peran' => Peran::Karyawan]);

        $this->expectException(TransisiTidakSah::class);
        $this->alur->ajukan($this->draf(), $this->karyawan);
    }

    public function test_pengaju_bisa_membatalkan_sebelum_approval_2(): void
    {
        $dok = $this->draf();
        $this->alur->ajukan($dok, $this->karyawan);

        $this->alur->batalkan($dok, $this->karyawan);
        $this->assertSame(Status::Ditolak, $dok->status);
    }

    public function test_tidak_bisa_selesai_sebelum_approval_gm(): void
    {
        $dok = $this->draf();
        $this->alur->ajukan($dok, $this->karyawan);

        $this->expectException(TransisiTidakSah::class);
        $this->alur->selesaikan($dok, $this->karyawan, ['berkas_final' => 'x.pdf']);
    }
}
