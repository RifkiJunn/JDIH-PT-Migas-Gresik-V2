<?php

namespace Tests\Feature;

use App\Enums\Peran;
use App\Enums\Sifat;
use App\Enums\Status;
use App\Models\Division;
use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

/** Siapa melihat apa (TB-05, FR-21, NFR-02). Policy dan scope harus sama persis. */
class VisibilitasTest extends TestCase
{
    use RefreshDatabase;

    private const SEMUA = ['draf', 'menunggu_manajer', 'revisi', 'menunggu_gm', 'menunggu_ttd', 'selesai_internal', 'selesai_eksternal', 'ditolak'];

    public function test_matriks_lihat_dan_unduh(): void
    {
        $a = Division::factory()->create();
        $b = Division::factory()->create();
        $pemilik = User::factory()->peran(Peran::Karyawan, $a)->create();

        $dok = [];
        foreach (self::SEMUA as $kunci) {
            [$status, $sifat] = match ($kunci) {
                'selesai_internal' => [Status::Selesai, Sifat::Internal],
                'selesai_eksternal' => [Status::Selesai, Sifat::Eksternal],
                default => [Status::from($kunci), Sifat::Eksternal],
            };
            $dok[$kunci] = Document::factory()->create([
                'status' => $status, 'sifat' => $sifat, 'division_id' => $a->id, 'submitted_by' => $pemilik->id,
            ]);
        }

        $pengguna = [
            'tamu' => null,
            'pemilik' => $pemilik,
            'karyawan_a' => User::factory()->peran(Peran::Karyawan, $a)->create(),
            'karyawan_b' => User::factory()->peran(Peran::Karyawan, $b)->create(),
            'manajer_a' => User::factory()->peran(Peran::Manajer, $a)->create(),
            'manajer_b' => User::factory()->peran(Peran::Manajer, $b)->create(),
            'gm' => User::factory()->peran(Peran::Gm)->create(),
            'admin' => User::factory()->peran(Peran::Admin)->create(),
        ];

        $lihat = [
            'tamu' => ['selesai_eksternal'],
            'pemilik' => self::SEMUA,
            'karyawan_a' => ['selesai_internal', 'selesai_eksternal'],
            'karyawan_b' => ['selesai_eksternal'],
            'manajer_a' => ['menunggu_manajer', 'menunggu_gm', 'menunggu_ttd', 'selesai_internal', 'selesai_eksternal'],
            'manajer_b' => ['selesai_eksternal'],
            'gm' => ['menunggu_gm', 'menunggu_ttd', 'selesai_internal', 'selesai_eksternal'],
            'admin' => ['selesai_internal', 'selesai_eksternal'],
        ];
        $unduh = ['admin' => ['selesai_eksternal']] + $lihat;

        foreach ($pengguna as $nama => $user) {
            $harap = collect($lihat[$nama])->map(fn ($k) => $dok[$k]->id)->sort()->values()->all();

            $this->assertSame($harap, Document::visibleTo($user)->orderBy('id')->pluck('id')->all(), "scope: $nama");

            foreach ($dok as $kunci => $d) {
                $gate = Gate::forUser($user);
                $this->assertSame(in_array($kunci, $lihat[$nama]), $gate->allows('view', $d), "view: $nama / $kunci");
                $this->assertSame(in_array($kunci, $unduh[$nama]), $gate->allows('download', $d), "download: $nama / $kunci");
            }
        }
    }

    public function test_dokumen_internal_tidak_bisa_dibuka_lewat_url_tanpa_login(): void
    {
        $internal = Document::factory()->selesai(Sifat::Internal)->create();
        $publik = Document::factory()->selesai()->create();

        $this->get("/dokumen/{$internal->id}")->assertForbidden();
        $this->get("/dokumen/{$internal->id}/berkas")->assertForbidden();
        $this->get("/dokumen/{$publik->id}")->assertOk();
    }
}
