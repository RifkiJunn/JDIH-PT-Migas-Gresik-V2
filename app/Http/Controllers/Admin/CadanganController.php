<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Services\Cadangan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use RuntimeException;

/** FR-26: backup dan restore. Cadangan otomatis juga dibuat tiap malam (routes/console.php). */
class CadanganController extends Controller
{
    public function __construct(private Cadangan $cadangan) {}

    public function index()
    {
        return Inertia::render('admin/cadangan', ['cadangan' => $this->cadangan->daftar()]);
    }

    public function store()
    {
        $nama = $this->cadangan->buat();
        ActivityLog::catat('cadangan', "Membuat cadangan {$nama}");

        return back()->with('sukses', "Cadangan {$nama} dibuat.");
    }

    public function unduh(string $nama)
    {
        abort_unless(is_file($path = $this->cadangan->path($nama)), 404);
        // Cadangan berisi semua berkas, termasuk dokumen internal: setiap unduhan tercatat.
        ActivityLog::catat('unduh_cadangan', "Mengunduh cadangan {$nama}");

        return response()->download($path);
    }

    public function pulihkan(Request $request)
    {
        $request->validate([
            'berkas' => ['required', 'file', 'mimes:zip', 'max:1048576'],
            'konfirmasi' => ['required', 'in:PULIHKAN'],
        ], ['konfirmasi.in' => 'Ketik PULIHKAN untuk mengonfirmasi.']);

        // Simpan keadaan sekarang dulu, supaya pemulihan yang keliru masih bisa dibatalkan.
        $pengaman = $this->cadangan->buat();
        $admin = $request->user();

        try {
            $this->cadangan->pulihkan($request->file('berkas')->getRealPath());
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        // Akun admin ini belum tentu ada di data hasil pulih.
        ActivityLog::create([
            'user_id' => $admin->fresh()?->id,
            'aksi' => 'pulihkan',
            'keterangan' => str("Memulihkan data dari {$request->file('berkas')->getClientOriginalName()} (pengaman: {$pengaman})")->limit(250)->value(),
            'ip' => $request->ip(),
        ]);

        return back()->with('sukses', "Data dipulihkan. Keadaan sebelumnya disimpan sebagai {$pengaman}.");
    }
}
