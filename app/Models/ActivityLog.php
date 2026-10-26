<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Log aktivitas untuk Admin (FR-27): login, approval, perubahan akun, unduhan internal, cadangan. */
#[Fillable(['user_id', 'aksi', 'keterangan', 'ip'])]
class ActivityLog extends Model
{
    const UPDATED_AT = null;

    public static function catat(string $aksi, string $keterangan, ?User $user = null): void
    {
        static::create([
            'user_id' => ($user ?? auth()->user())?->id,
            'aksi' => $aksi,
            'keterangan' => str($keterangan)->limit(250)->value(),
            'ip' => request()->ip(),
        ]);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
