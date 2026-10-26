<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use ZipArchive;

/**
 * Cadangan = satu zip berisi data.json (isi tabel, tidak bergantung jenis database) dan folder dokumen/.
 * Disimpan di disk privat storage/app/private/cadangan.
 */
class Cadangan
{
    /** Urutan mengikuti foreign key: induk dulu. */
    private const TABEL = ['divisions', 'categories', 'users', 'documents', 'document_logs', 'activity_logs', 'notifications'];

    private const SIMPAN = 14;

    public function buat(): string
    {
        if (! Storage::directoryExists('cadangan') && ! Storage::makeDirectory('cadangan')) {
            throw new RuntimeException('Folder cadangan tidak bisa dibuat. Periksa izin storage/app/private.');
        }
        // Milidetik di nama: dua cadangan dalam detik yang sama tidak saling menimpa.
        $nama = 'jdih-'.now()->format('Ymd-His-v').'.zip';

        $zip = new ZipArchive;
        if ($zip->open($this->path($nama), ZipArchive::CREATE | ZipArchive::EXCL) !== true) {
            throw new RuntimeException("Berkas cadangan {$nama} tidak bisa dibuat.");
        }
        $zip->addFromString('data.json', json_encode(
            collect(self::TABEL)->mapWithKeys(fn ($t) => [$t => DB::table($t)->orderBy('id')->get()]),
            JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
        ));
        foreach (Storage::allFiles('dokumen') as $berkas) {
            $zip->addFile(Storage::path($berkas), $berkas);
        }
        if (! $zip->close()) {
            throw new RuntimeException('Cadangan gagal ditulis. Periksa ruang disk server.');
        }

        $this->daftar()->slice(self::SIMPAN)->each(fn ($c) => Storage::delete("cadangan/{$c['nama']}"));

        return $nama;
    }

    /** @return Collection<int, array{nama: string, ukuran: int, waktu: string}> terbaru dulu */
    public function daftar(): Collection
    {
        return collect(Storage::files('cadangan'))
            ->filter(fn ($f) => str_ends_with($f, '.zip'))
            ->sortDesc()->values()
            ->map(fn ($f) => [
                'nama' => basename($f),
                'ukuran' => Storage::size($f),
                'waktu' => date(DATE_ATOM, Storage::lastModified($f)),
            ]);
    }

    public function path(string $nama): string
    {
        return Storage::path('cadangan/'.basename($nama));
    }

    /** Mengganti seluruh data dan berkas dengan isi cadangan. Zip diperiksa dulu; bila tidak sah, tidak ada yang berubah. */
    public function pulihkan(string $zipPath): void
    {
        $zip = new ZipArchive;
        if ($zip->open($zipPath) !== true) {
            throw new RuntimeException('Berkas bukan zip cadangan yang sah.');
        }

        $berkas = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entri = $zip->getNameIndex($i);
            if ($entri === 'data.json' || str_ends_with($entri, '/')) {
                continue;
            }
            // Hanya nama berkas biasa di dalam dokumen/, supaya isi zip tidak bisa menulis ke luar folder itu.
            if (! preg_match('#^dokumen/[A-Za-z0-9_-][A-Za-z0-9._-]*$#', $entri) || str_contains($entri, '..')) {
                $zip->close();
                throw new RuntimeException("Isi cadangan tidak sah: {$entri}");
            }
            $berkas[] = $entri;
        }

        $data = json_decode((string) $zip->getFromName('data.json'), true);
        if (! is_array($data) || array_diff(self::TABEL, array_keys($data))) {
            $zip->close();
            throw new RuntimeException('Cadangan tidak lengkap: data.json tidak ditemukan atau rusak.');
        }

        DB::transaction(function () use ($data) {
            foreach (array_reverse(self::TABEL) as $t) {
                DB::table($t)->delete();
            }
            foreach (self::TABEL as $t) {
                foreach (array_chunk($data[$t], 500) as $baris) {
                    DB::table($t)->insert($baris);
                }
                $this->setelUrutanId($t);
            }
        });

        Storage::deleteDirectory('dokumen');
        foreach ($berkas as $entri) {
            Storage::put($entri, $zip->getFromName($entri));
        }
        $zip->close();
    }

    /** PostgreSQL tidak menggeser sequence saat id diisi manual; MySQL dan SQLite menyesuaikan sendiri. */
    private function setelUrutanId(string $tabel): void
    {
        if (DB::getDriverName() === 'pgsql' && $tabel !== 'notifications') {
            DB::statement("SELECT setval(pg_get_serial_sequence('{$tabel}', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM {$tabel}");
        }
    }
}
