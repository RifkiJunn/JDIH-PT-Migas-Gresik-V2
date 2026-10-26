<?php

use App\Enums\Peran;
use App\Models\Document;
use App\Models\User;
use App\Notifications\Pemberitahuan;
use App\Services\Cadangan;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schedule;

// FR-24: sekali per dokumen, untuk semua yang masuk masa "akan berakhir" dan belum diingatkan,
// supaya hari yang terlewat (cron mati, dokumen baru selesai dengan sisa < 30 hari) tetap terkirim.
Artisan::command('dokumen:pengingat', function () {
    $dokumen = Document::akanBerakhir()->whereNull('diingatkan_pada')->get();

    foreach ($dokumen as $dok) {
        $penerima = User::where('aktif', true)
            ->where(fn ($q) => $q->where('peran', Peran::Gm)
                ->orWhere(fn ($q) => $q->where('division_id', $dok->division_id)->whereIn('peran', [Peran::Karyawan, Peran::Manajer])))
            ->get();

        try {
            Notification::send($penerima, new Pemberitahuan(
                "Dokumen \"{$dok->judul}\" berakhir pada {$dok->tanggal_berakhir->translatedFormat('j F Y')}. Segera proses perpanjangan bila diperlukan.",
                "/arsip/{$dok->id}",
                email: true,
            ));
            $dok->updateQuietly(['diingatkan_pada' => now()]);
        } catch (Throwable $e) {
            // Satu email gagal tidak menghentikan dokumen lain; dicoba lagi besok.
            report($e);
        }
    }

    $this->info("{$dokumen->count()} dokumen diingatkan.");
})->purpose('Kirim pengingat dokumen yang akan berakhir');

Artisan::command('cadangan:buat', fn (Cadangan $c) => $this->info('Cadangan dibuat: '.$c->buat()))
    ->purpose('Buat cadangan data dan berkas');

// Jalankan `php artisan schedule:work` (lokal) atau cron `schedule:run` tiap menit (server).
Schedule::command('dokumen:pengingat')->dailyAt('07:00');
Schedule::command('cadangan:buat')->dailyAt('01:00');
