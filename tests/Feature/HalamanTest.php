<?php

namespace Tests\Feature;

use App\Enums\Status;
use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** Setiap halaman terbuka untuk peran yang berhak dan tertutup untuk yang tidak (NFR-02), memakai data demo. */
class HalamanTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->withoutVite();
        $this->seed();
    }

    private function akun(string $email): User
    {
        return User::where('email', $email)->firstOrFail();
    }

    public function test_halaman_publik_terbuka_tanpa_login(): void
    {
        $publik = Document::visibleTo(null)->first();

        foreach (['/', '/dokumen', '/dokumen?q=gas&kategori=1&tahun=2026&masa=berlaku&urut=populer', "/dokumen/{$publik->id}", '/profil', '/login'] as $url) {
            $this->get($url)->assertOk();
        }
        $this->get("/dokumen/{$publik->id}/berkas")->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_setiap_peran_membuka_halamannya_sendiri(): void
    {
        $dok = Document::where('status', Status::MenungguManajer)->first();
        $halaman = [
            'karyawan.legal@ptgm.test' => ['/dashboard', '/pengajuan', '/pengajuan?status=perlu_tindakan', '/pengajuan/baru', '/eksisting', '/arsip', '/akan-berakhir', '/akun', "/arsip/{$dok->id}"],
            'manajer.legal@ptgm.test' => ['/dashboard', '/approval', '/approval?riwayat=1', '/arsip', '/akan-berakhir?masa=semua', "/arsip/{$dok->id}"],
            'gm@ptgm.test' => ['/dashboard', '/approval', '/arsip?sifat=internal&divisi=1', '/akan-berakhir'],
            'admin@ptgm.test' => ['/dashboard', '/admin/akun', '/admin/master', '/admin/cadangan', '/admin/log', '/akan-berakhir'],
        ];

        foreach ($halaman as $email => $daftar) {
            $this->actingAs($this->akun($email));
            foreach ($daftar as $url) {
                $this->get($url)->assertOk();
            }
        }
    }

    public function test_peran_lain_ditolak(): void
    {
        $this->actingAs($this->akun('karyawan.legal@ptgm.test'))->get('/approval')->assertForbidden();
        $this->actingAs($this->akun('karyawan.sdm@ptgm.test'))->get('/eksisting')->assertForbidden();
        $this->actingAs($this->akun('admin@ptgm.test'))->get('/arsip')->assertForbidden();
        $this->actingAs($this->akun('manajer.legal@ptgm.test'))->get('/admin/akun')->assertForbidden();
        $this->actingAs($this->akun('manajer.sdm@ptgm.test'))
            ->get('/arsip/'.Document::where('status', Status::MenungguManajer)->value('id'))->assertForbidden();
    }

    public function test_login_mengarah_ke_dashboard_dan_akun_nonaktif_ditolak(): void
    {
        $this->post('/login', ['email' => 'gm@ptgm.test', 'password' => 'password'])->assertRedirect('/dashboard');
        $this->post('/logout');

        $this->akun('karyawan.sdm@ptgm.test')->update(['aktif' => false]);
        $this->post('/login', ['email' => 'karyawan.sdm@ptgm.test', 'password' => 'password'])->assertSessionHasErrors('email');
        $this->assertGuest();
    }
}
