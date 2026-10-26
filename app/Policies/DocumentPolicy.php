<?php

namespace App\Policies;

use App\Enums\Peran;
use App\Enums\Sifat;
use App\Enums\Status;
use App\Models\Document;
use App\Models\User;

/**
 * Siapa melihat apa, untuk satu dokumen. Padanan query-nya Document::visibleTo;
 * VisibilitasTest menjaga keduanya tetap sama.
 */
class DocumentPolicy
{
    public function view(?User $user, Document $doc): bool
    {
        if ($doc->status === Status::Selesai && $doc->sifat === Sifat::Eksternal) {
            return true;
        }

        if (! $user) {
            return false;
        }

        if ($doc->submitted_by === $user->id) {
            return true;
        }

        // Yang pernah memutus tetap bisa membuka riwayatnya, termasuk setelah dikembalikan untuk revisi (FR-16).
        if ($doc->logs()->where('user_id', $user->id)->exists()) {
            return true;
        }

        $sedivisi = $user->division_id !== null && $user->division_id === $doc->division_id;

        return match ($user->peran) {
            Peran::Karyawan => $sedivisi && $doc->status === Status::Selesai,
            Peran::Manajer => $sedivisi && in_array($doc->status, [Status::MenungguManajer, Status::MenungguGm, Status::MenungguTtd, Status::Selesai], true),
            Peran::Gm => in_array($doc->status, [Status::MenungguGm, Status::MenungguTtd, Status::Selesai], true),
            Peran::Admin => $doc->status === Status::Selesai,
        };
    }

    /** Admin hanya melihat metadata dokumen internal, tidak berkasnya. */
    public function download(?User $user, Document $doc): bool
    {
        if ($user?->peran === Peran::Admin && $doc->sifat === Sifat::Internal) {
            return false;
        }

        return $this->view($user, $doc);
    }

    /** Ubah isi dan ajukan (ulang): hanya pengaju, selama Draf atau Revisi. */
    public function update(User $user, Document $doc): bool
    {
        return $doc->submitted_by === $user->id && $doc->status->bisaDiubah();
    }

    /** Batalkan: pengaju, selama belum masuk tahap GM. */
    public function cancel(User $user, Document $doc): bool
    {
        return $doc->submitted_by === $user->id
            && in_array($doc->status, [Status::Draf, Status::Revisi, Status::MenungguManajer], true);
    }

    public function decide(User $user, Document $doc): bool
    {
        if ($doc->submitted_by === $user->id) {
            return false;
        }

        return match ($doc->status) {
            Status::MenungguManajer => $user->peran === Peran::Manajer && $user->division_id === $doc->division_id,
            Status::MenungguGm => $user->peran === Peran::Gm,
            default => false,
        };
    }

    /** Upload scan ber-TTD dan lengkapi metadata final. */
    public function finalize(User $user, Document $doc): bool
    {
        return $doc->submitted_by === $user->id && $doc->status === Status::MenungguTtd;
    }
}
