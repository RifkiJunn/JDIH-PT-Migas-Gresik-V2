<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\User;
use App\Services\Cadangan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use ZipArchive;

/** FR-26, NFR-06: cadangan bisa dipulihkan utuh, data dan berkas. */
class CadanganTest extends TestCase
{
    use RefreshDatabase;

    public function test_pulihkan_mengembalikan_data_dan_berkas_persis(): void
    {
        Storage::fake('local');
        $cadangan = app(Cadangan::class);

        $dok = Document::factory()->selesai()->create(['berkas_final' => 'dokumen/a.pdf']);
        Storage::put('dokumen/a.pdf', 'isi-asli');
        $sebelum = [User::orderBy('id')->get()->toArray(), Document::orderBy('id')->get()->toArray()];

        $nama = $cadangan->buat();

        $dok->delete();
        User::factory()->create();
        Storage::delete('dokumen/a.pdf');

        $cadangan->pulihkan($cadangan->path($nama));

        $this->assertSame($sebelum, [User::orderBy('id')->get()->toArray(), Document::orderBy('id')->get()->toArray()]);
        $this->assertSame('isi-asli', Storage::get('dokumen/a.pdf'));

        // Id baru tetap bisa dibuat setelah pulih (urutan id tidak bertabrakan).
        $this->assertGreaterThan($dok->id, Document::factory()->create()->id);
    }

    public function test_gagal_membuat_zip_tidak_dilaporkan_sebagai_berhasil(): void
    {
        Storage::fake('local');
        // Berkas bernama "cadangan" menghalangi folder cadangan dibuat.
        Storage::put('cadangan', 'menghalangi');

        $this->expectException(\RuntimeException::class);
        app(Cadangan::class)->buat();
    }

    public function test_unduhan_cadangan_tercatat_di_log(): void
    {
        Storage::fake('local');
        $admin = User::factory()->peran(\App\Enums\Peran::Admin)->create();
        $nama = app(Cadangan::class)->buat();

        $this->actingAs($admin)->get("/admin/cadangan/{$nama}")->assertOk();
        $this->assertDatabaseHas('activity_logs', ['aksi' => 'unduh_cadangan', 'user_id' => $admin->id]);
    }

    public function test_menolak_zip_dengan_path_di_luar_folder_dokumen(): void
    {
        Storage::fake('local');
        $cadangan = app(Cadangan::class);
        $nama = $cadangan->buat();
        $zip = new ZipArchive;
        $zip->open($cadangan->path($nama));
        $zip->addFromString('dokumen/../../jahat.php', '<?php');
        $zip->close();

        $jumlahUser = User::count();
        try {
            $cadangan->pulihkan($cadangan->path($nama));
            $this->fail('Zip berbahaya harus ditolak.');
        } catch (\RuntimeException) {
        }

        $this->assertSame($jumlahUser, User::count());
        $this->assertFalse(Storage::exists('jahat.php'));
    }
}
