<?php

namespace App\Models;

use App\Enums\Peran;
use App\Enums\Sifat;
use App\Enums\Status;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Request;

#[Guarded(['id'])]
class Document extends Model
{
    use HasFactory;

    /** Batas "akan berakhir" (TB-03). */
    const HARI_PENGINGAT = 30;

    protected function casts(): array
    {
        return [
            'sifat' => Sifat::class,
            'status' => Status::class,
            'tanggal_surat' => 'date',
            'tanggal_berlaku' => 'date',
            'tanggal_berakhir' => 'date',
            'selesai_pada' => 'datetime',
            'diingatkan_pada' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function pengaju(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(DocumentLog::class)->oldest('id');
    }

    /** Aturan metadata; $final untuk dokumen yang sudah ber-TTD (nomor dan tanggal surat wajib). */
    public static function aturan(Request $request, bool $final = false): array
    {
        $wajib = $final ? 'required' : 'nullable';

        return [
            'judul' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'nomor' => [$wajib, 'string', 'max:150'],
            'abstrak' => [$wajib, 'string', 'max:5000'],
            'tanggal_surat' => [$wajib, 'date'],
            'tanggal_berlaku' => ['nullable', 'date'],
            'tanggal_berakhir' => array_filter(['nullable', 'date', $request->filled('tanggal_berlaku') ? 'after_or_equal:tanggal_berlaku' : null]),
        ];
    }

    const ATURAN_BERKAS = ['file', 'mimes:pdf', 'max:20480'];

    /** Padanan query DocumentPolicy::view. */
    #[Scope]
    protected function visibleTo(Builder $query, ?User $user): void
    {
        $query->where(function (Builder $q) use ($user) {
            $q->where(fn (Builder $q) => $q->where('status', Status::Selesai)->where('sifat', Sifat::Eksternal));

            if (! $user) {
                return;
            }

            $q->orWhere('submitted_by', $user->id)
                ->orWhereHas('logs', fn (Builder $l) => $l->where('user_id', $user->id));

            $sedivisi = fn (array $status) => fn (Builder $q) => $q->where('division_id', $user->division_id)->whereIn('status', $status);

            match ($user->peran) {
                Peran::Karyawan => $q->orWhere($sedivisi([Status::Selesai])),
                Peran::Manajer => $q->orWhere($sedivisi([Status::MenungguManajer, Status::MenungguGm, Status::MenungguTtd, Status::Selesai])),
                Peran::Gm => $q->orWhereIn('status', [Status::MenungguGm, Status::MenungguTtd, Status::Selesai]),
                Peran::Admin => $q->orWhere('status', Status::Selesai),
            };
        });
    }

    /** Antrean approval $user: dokumen yang lolos DocumentPolicy::decide. */
    #[Scope]
    protected function antrean(Builder $query, User $user): void
    {
        match ($user->peran) {
            Peran::Manajer => $query->where('status', Status::MenungguManajer)->where('division_id', $user->division_id)->where('submitted_by', '!=', $user->id),
            Peran::Gm => $query->where('status', Status::MenungguGm),
            default => $query->whereRaw('1 = 0'),
        };
    }

    /** Arsip "divisinya" (BRD 8b): Karyawan dan Manajer hanya divisi sendiri, GM dan Admin semua. */
    #[Scope]
    protected function arsipUntuk(Builder $query, User $user): void
    {
        $query->visibleTo($user)->where('status', Status::Selesai)
            ->when($user->berperan(Peran::Karyawan, Peran::Manajer), fn (Builder $q) => $q->where('division_id', $user->division_id));
    }

    /** Akan berakhir dalam HARI_PENGINGAT hari, termasuk hari ini. */
    #[Scope]
    protected function akanBerakhir(Builder $query): void
    {
        $query->where('status', Status::Selesai)
            ->whereBetween('tanggal_berakhir', [today(), today()->addDays(self::HARI_PENGINGAT)]);
    }

    /**
     * Pencarian dan filter daftar. Nilai yang tidak sah diabaikan.
     * LIKE memakai ESCAPE eksplisit supaya % dan _ dari pengguna bukan wildcard, sama di PostgreSQL, MySQL, SQLite.
     *
     * @param  array<string, mixed>  $f  q, kategori, tahun, divisi, sifat, status, masa
     */
    #[Scope]
    protected function saring(Builder $query, array $f): void
    {
        $teks = fn (string $k) => is_string($f[$k] ?? null) && trim($f[$k]) !== '' ? trim($f[$k]) : null;
        $angka = fn (string $k) => ctype_digit((string) $teks($k)) ? (int) $f[$k] : null;

        if ($q = $teks('q')) {
            $mirip = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($q)).'%';
            $query->where(fn (Builder $b) => $b
                ->whereRaw("LOWER(judul) LIKE ? ESCAPE '!'", [$mirip])
                ->orWhereRaw("LOWER(nomor) LIKE ? ESCAPE '!'", [$mirip])
                ->orWhereRaw("LOWER(abstrak) LIKE ? ESCAPE '!'", [$mirip]));
        }

        $query
            ->when($angka('kategori'), fn (Builder $b, int $id) => $b->where('category_id', $id))
            ->when($angka('tahun'), fn (Builder $b, int $t) => $b->whereYear('tanggal_surat', $t))
            ->when($angka('divisi'), fn (Builder $b, int $id) => $b->where('division_id', $id))
            ->when(Sifat::tryFrom($teks('sifat') ?? ''), fn (Builder $b, Sifat $s) => $b->where('sifat', $s))
            ->when(Status::tryFrom($teks('status') ?? ''), fn (Builder $b, Status $s) => $b->where('status', $s))
            ->when($teks('masa'), fn (Builder $b, string $m) => match ($m) {
                'berakhir' => $b->where('tanggal_berakhir', '<', today()),
                'akan_berakhir' => $b->whereBetween('tanggal_berakhir', [today(), today()->addDays(self::HARI_PENGINGAT)]),
                'berlaku' => $b->where(fn (Builder $w) => $w->whereNull('tanggal_berakhir')
                    ->orWhere('tanggal_berakhir', '>', today()->addDays(self::HARI_PENGINGAT))),
                default => $b,
            });
    }

    /** Berkas yang ditampilkan: scan ber-TTD bila sudah ada, selain itu draf. */
    public function berkas(): ?string
    {
        return $this->berkas_final ?? $this->berkas_draf;
    }

    /** FR-22: berlaku | akan_berakhir | berakhir. Tanpa tanggal berakhir berarti berlaku. */
    public function masa(): string
    {
        $akhir = $this->tanggal_berakhir;

        return match (true) {
            $akhir === null => 'berlaku',
            $akhir->lt(today()) => 'berakhir',
            $akhir->lte(today()->addDays(self::HARI_PENGINGAT)) => 'akan_berakhir',
            default => 'berlaku',
        };
    }

    /** Bentuk ringkas untuk daftar (tipe `Dokumen` di resources/js/types.ts). */
    public function ringkas(): array
    {
        return [
            'id' => $this->id,
            'judul' => $this->judul,
            'nomor' => $this->nomor,
            'kategori' => $this->category->nama,
            'divisi' => $this->division->nama,
            'sifat' => $this->sifat,
            'status' => $this->status,
            'status_label' => $this->status->label(),
            'masa' => $this->masa(),
            'tahun' => $this->tanggal_surat?->year,
            'tanggal_surat' => $this->tanggal_surat?->toDateString(),
            'tanggal_berlaku' => $this->tanggal_berlaku?->toDateString(),
            'tanggal_berakhir' => $this->tanggal_berakhir?->toDateString(),
            'pengaju' => $this->pengaju->name,
            'diperbarui' => $this->updated_at?->toIso8601String(),
        ];
    }
}
