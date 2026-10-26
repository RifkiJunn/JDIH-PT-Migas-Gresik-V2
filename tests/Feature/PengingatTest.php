<?php

namespace Tests\Feature;

use App\Enums\Peran;
use App\Enums\Sifat;
use App\Models\Division;
use App\Models\Document;
use App\Models\User;
use App\Notifications\Pemberitahuan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/** TB-03, FR-24: pengingat saat sisa masa berlaku 30 hari atau kurang, ke divisi pemilik dan GM, lewat email juga. */
class PengingatTest extends TestCase
{
    use RefreshDatabase;

    public function test_mengingatkan_divisi_dan_gm_saat_masuk_30_hari_terakhir(): void
    {
        Notification::fake();
        $divisi = Division::factory()->create();
        $karyawan = User::factory()->peran(Peran::Karyawan, $divisi)->create();
        $gm = User::factory()->peran(Peran::Gm)->create();
        $lain = User::factory()->peran(Peran::Karyawan, Division::factory()->create())->create();
        $nonaktif = User::factory()->peran(Peran::Manajer, $divisi)->create(['aktif' => false]);

        $kena = Document::factory()->selesai(Sifat::Internal)->create(['division_id' => $divisi->id, 'submitted_by' => $karyawan->id, 'tanggal_berakhir' => today()->addDays(30)]);
        Document::factory()->selesai()->create(['division_id' => $divisi->id, 'submitted_by' => $karyawan->id, 'tanggal_berakhir' => today()->addDays(31)]);

        $this->artisan('dokumen:pengingat')->assertSuccessful();

        Notification::assertSentTo([$karyawan, $gm], Pemberitahuan::class, fn (Pemberitahuan $n, array $via) => str_contains($n->pesan, $kena->judul) && in_array('mail', $via));
        Notification::assertCount(2);
        Notification::assertNotSentTo([$lain, $nonaktif], Pemberitahuan::class);
    }
}
