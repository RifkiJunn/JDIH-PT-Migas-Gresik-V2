<?php

namespace App\Services;

use App\Enums\Peran;
use App\Enums\Sifat;
use App\Enums\Status;
use App\Exceptions\TransisiTidakSah;
use App\Models\ActivityLog;
use App\Models\Document;
use App\Models\User;
use App\Notifications\Pemberitahuan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/** Satu-satunya tempat status pengajuan berpindah (BRD bagian 4, Modul I). */
class DocumentWorkflow
{
    public function ajukan(Document $document, User $user): void
    {
        $this->terkunci($document, function (Document $dok) use ($user) {
            if ($user->cannot('update', $dok)) {
                throw new TransisiTidakSah('Dokumen ini tidak bisa diajukan.');
            }

            $manajer = $this->manajer($dok);
            if ($manajer->isEmpty()) {
                throw new TransisiTidakSah('Divisi Anda belum memiliki Manajer. Hubungi Admin.');
            }

            $dok->update(['status' => Status::MenungguManajer]);
            $this->catat($dok, $user, 'ajukan');
            Notification::send($manajer, new Pemberitahuan("Pengajuan baru menunggu approval Anda: {$dok->judul}", $this->url($dok)));
        });
    }

    /** GM wajib memutuskan sifat final; Manajer tidak mengubahnya. */
    public function setujui(Document $document, User $user, ?Sifat $sifat = null): void
    {
        $this->terkunci($document, function (Document $dok) use ($user, $sifat) {
            $this->bolehMemutus($dok, $user);

            if ($dok->status === Status::MenungguManajer) {
                $dok->update(['status' => Status::MenungguGm]);
                Notification::send(User::where('peran', Peran::Gm)->where('aktif', true)->get(),
                    new Pemberitahuan("Pengajuan menunggu approval final: {$dok->judul}", $this->url($dok)));
                $pesan = "Approval 1 disetujui: {$dok->judul}";
            } else {
                $dok->update(['status' => Status::MenungguTtd, 'sifat' => $sifat ?? $dok->sifat]);
                $pesan = "Disetujui GM, silakan TTD basah lalu upload scan-nya: {$dok->judul}";
            }

            $this->catat($dok, $user, 'setujui');
            $dok->pengaju->notify(new Pemberitahuan($pesan, $this->url($dok)));
        });
    }

    public function tolak(Document $document, User $user, string $catatan): void
    {
        if (trim($catatan) === '') {
            throw new TransisiTidakSah('Komentar penolakan wajib diisi.');
        }

        $this->terkunci($document, function (Document $dok) use ($user, $catatan) {
            $this->bolehMemutus($dok, $user);

            $dok->update(['status' => Status::Revisi]);
            $this->catat($dok, $user, 'tolak', trim($catatan));
            $dok->pengaju->notify(new Pemberitahuan("Pengajuan perlu direvisi: {$dok->judul}", $this->url($dok)));
        });
    }

    public function batalkan(Document $document, User $user): void
    {
        $this->terkunci($document, function (Document $dok) use ($user) {
            if ($user->cannot('cancel', $dok)) {
                throw new TransisiTidakSah('Pengajuan ini tidak bisa dibatalkan.');
            }

            $dok->update(['status' => Status::Ditolak]);
            $this->catat($dok, $user, 'batalkan');
        });
    }

    /** Ubah isi pengajuan; dicek ulang di bawah kunci supaya tidak menimpa pengajuan yang baru saja dikirim dari tab lain. */
    public function ubah(Document $document, User $user, array $data): void
    {
        $this->terkunci($document, function (Document $dok) use ($user, $data) {
            if ($user->cannot('update', $dok)) {
                throw new TransisiTidakSah('Pengajuan ini sudah dikirim dan tidak bisa diubah lagi.');
            }

            $dok->update($data);
        });
    }

    /** @param  array<string, mixed>  $data  berkas_final dan metadata final yang sudah divalidasi. */
    public function selesaikan(Document $document, User $user, array $data): void
    {
        $this->terkunci($document, function (Document $dok) use ($user, $data) {
            if ($user->cannot('finalize', $dok)) {
                throw new TransisiTidakSah('Dokumen ini belum bisa diselesaikan.');
            }

            $dok->update([...$data, 'status' => Status::Selesai, 'selesai_pada' => now()]);
            $this->catat($dok, $user, 'selesai');
        });
    }

    /** Membaca ulang dengan kunci baris, supaya keputusan ganda dari dua tab atau dua orang tidak lolos. */
    private function terkunci(Document $document, callable $aksi): void
    {
        DB::transaction(fn () => $aksi(Document::whereKey($document->id)->lockForUpdate()->firstOrFail()));

        $document->refresh();
    }

    private function bolehMemutus(Document $dok, User $user): void
    {
        if ($user->cannot('decide', $dok)) {
            throw new TransisiTidakSah('Pengajuan ini sudah diputuskan atau bukan wewenang Anda.');
        }
    }

    private function manajer(Document $dok)
    {
        return User::where('peran', Peran::Manajer)->where('division_id', $dok->division_id)->where('aktif', true)->get();
    }

    private function catat(Document $dok, User $user, string $aksi, ?string $catatan = null): void
    {
        $dok->logs()->create(['user_id' => $user->id, 'aksi' => $aksi, 'catatan' => $catatan]);

        if (in_array($aksi, ['setujui', 'tolak'], true)) {
            ActivityLog::catat($aksi === 'setujui' ? 'approval' : 'penolakan', ucfirst($aksi)." \"{$dok->judul}\"", $user);
        }
    }

    private function url(Document $dok): string
    {
        return "/arsip/{$dok->id}";
    }
}
