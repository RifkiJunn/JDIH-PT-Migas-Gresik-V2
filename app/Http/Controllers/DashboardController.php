<?php

namespace App\Http\Controllers;

use App\Enums\Peran;
use App\Enums\Sifat;
use App\Enums\Status;
use App\Models\ActivityLog;
use App\Models\Document;
use App\Models\DocumentLog;
use App\Models\User;
use App\Services\Cadangan;
use Illuminate\Http\Request;
use Inertia\Inertia;

/** Kartu statistik per peran (BRD 8b) dan dua panel: aktivitas terbaru, dokumen akan berakhir. */
class DashboardController extends Controller
{
    public function __invoke(Request $request, Cadangan $cadangan)
    {
        $user = $request->user();
        $milik = fn () => Document::where('submitted_by', $user->id);
        $keputusan = fn (string $aksi) => DocumentLog::where('user_id', $user->id)->where('aksi', $aksi)
            ->where('created_at', '>=', now()->startOfMonth())->count();
        $akanBerakhir = Document::arsipUntuk($user)->akanBerakhir()->count();

        $kartu = match ($user->peran) {
            Peran::Karyawan => [
                $this->kartu('Pengajuan saya', $milik()->count(), 'Semua status', '/pengajuan', 'file-text'),
                $this->kartu('Menunggu approval', $milik()->whereIn('status', [Status::MenungguManajer, Status::MenungguGm])->count(), 'Di Manajer atau GM', '/pengajuan?status=menunggu_manajer', 'hourglass'),
                $this->kartu('Perlu tindakan', $n = $milik()->whereIn('status', [Status::Revisi, Status::MenungguTtd])->count(), 'Revisi atau upload scan TTD', '/pengajuan?status=perlu_tindakan', 'pen-line', $n > 0),
                $this->kartu('Akan berakhir', $akanBerakhir, 'Dokumen divisi, 30 hari ke depan', '/akan-berakhir', 'calendar-clock', $akanBerakhir > 0),
            ],
            Peran::Manajer => [
                $this->kartu('Menunggu approval saya', $n = Document::antrean($user)->count(), 'Pengajuan divisi', '/approval', 'inbox', $n > 0),
                $this->kartu('Disetujui bulan ini', $keputusan('setujui'), now()->translatedFormat('F Y'), '/approval?riwayat=1', 'circle-check'),
                $this->kartu('Ditolak bulan ini', $keputusan('tolak'), 'Dikembalikan untuk revisi', '/approval?riwayat=1', 'circle-x'),
                $this->kartu('Akan berakhir', $akanBerakhir, 'Dokumen divisi, 30 hari ke depan', '/akan-berakhir', 'calendar-clock', $akanBerakhir > 0),
            ],
            Peran::Gm => [
                $this->kartu('Menunggu approval final', $n = Document::antrean($user)->count(), 'Semua divisi', '/approval', 'inbox', $n > 0),
                $this->kartu('Terbit ke publik', Document::where('status', Status::Selesai)->where('sifat', Sifat::Eksternal)->count(), 'Tampil di portal JDIH', '/arsip?sifat=eksternal', 'globe'),
                $this->kartu('Diarsipkan internal', Document::where('status', Status::Selesai)->where('sifat', Sifat::Internal)->count(), 'Hanya divisi pemilik', '/arsip?sifat=internal', 'lock'),
                $this->kartu('Akan berakhir', $akanBerakhir, 'Semua divisi, 30 hari ke depan', '/akan-berakhir', 'calendar-clock', $akanBerakhir > 0),
            ],
            Peran::Admin => [
                $this->kartu('Akun aktif', User::where('aktif', true)->count(), 'Dari '.User::count().' akun', '/admin/akun', 'users'),
                $this->kartu('Total dokumen', Document::where('status', Status::Selesai)->count(), 'Sudah selesai', '/akan-berakhir?masa=semua', 'files'),
                $this->kartu('Cadangan terakhir', $terakhir = $cadangan->daftar()->first()['waktu'] ?? null, $terakhir ? 'Otomatis tiap hari 01.00' : 'Belum ada cadangan', '/admin/cadangan', 'database-backup', ! $terakhir, 'tanggal'),
                $this->kartu('Aktivitas hari ini', ActivityLog::where('created_at', '>=', today())->count(), 'Login, approval, unduhan', '/admin/log', 'activity'),
            ],
        };

        $aktivitas = $user->peran === Peran::Admin
            ? ActivityLog::with('user')->latest('id')->limit(6)->get()->map(fn (ActivityLog $l) => [
                'id' => $l->id, 'judul' => $l->keterangan, 'oleh' => $l->user?->name ?? 'Sistem', 'aksi' => $l->aksi,
                'waktu' => $l->created_at->toIso8601String(), 'url' => null,
            ])
            : DocumentLog::with('user', 'document')->whereHas('document', fn ($q) => $q->visibleTo($user))
                ->latest('id')->limit(6)->get()->map(fn (DocumentLog $l) => [
                    'id' => $l->id, 'judul' => $l->document->judul, 'oleh' => $l->user->name, 'aksi' => $l->aksi,
                    'waktu' => $l->created_at->toIso8601String(), 'url' => "/arsip/{$l->document_id}",
                ]);

        return Inertia::render('dashboard', [
            'kartu' => $kartu,
            'aktivitas' => $aktivitas,
            'berakhir' => Document::arsipUntuk($user)->akanBerakhir()->with('category', 'division', 'pengaju')
                ->orderBy('tanggal_berakhir')->limit(6)->get()->map->ringkas(),
        ]);
    }

    private function kartu(string $label, $nilai, string $ket, string $url, string $ikon, bool $perhatian = false, string $jenis = 'angka'): array
    {
        return compact('label', 'nilai', 'ket', 'url', 'ikon', 'perhatian', 'jenis');
    }
}
