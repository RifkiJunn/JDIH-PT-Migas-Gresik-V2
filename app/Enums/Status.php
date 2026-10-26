<?php

namespace App\Enums;

/** Status pengajuan Modul I (BRD bagian 4). Dokumen Modul II langsung Selesai. */
enum Status: string
{
    case Draf = 'draf';
    case MenungguManajer = 'menunggu_manajer';
    case Revisi = 'revisi';
    case MenungguGm = 'menunggu_gm';
    case MenungguTtd = 'menunggu_ttd';
    case Selesai = 'selesai';
    case Ditolak = 'ditolak';

    public function label(): string
    {
        return match ($this) {
            self::Draf => 'Draf',
            self::MenungguManajer => 'Menunggu Approval 1',
            self::Revisi => 'Revisi',
            self::MenungguGm => 'Menunggu Approval 2',
            self::MenungguTtd => 'Menunggu TTD',
            self::Selesai => 'Selesai',
            self::Ditolak => 'Ditolak',
        };
    }

    /** Pengaju boleh mengubah isi dan mengajukan (ulang). */
    public function bisaDiubah(): bool
    {
        return $this === self::Draf || $this === self::Revisi;
    }
}
