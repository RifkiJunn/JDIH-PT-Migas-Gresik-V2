<?php

namespace Database\Seeders;

use App\Enums\Peran;
use App\Enums\Sifat;
use App\Enums\Status;
use App\Models\Category;
use App\Models\Division;
use App\Models\Document;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/** Data contoh untuk demo. Semua akun berpassword "password"; ganti sebelum dipakai sungguhan. */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $divisi = collect(['Legal', 'Sekretariat', 'SDM', 'Keuangan'])->mapWithKeys(fn ($n) => [$n => Division::create(['nama' => $n])]);
        $kategori = collect(['SK', 'Kontrak', 'MOU/PKS', 'Berita Acara'])->mapWithKeys(fn ($n) => [$n => Category::create(['nama' => $n])]);

        $akun = fn (string $email, string $nama, Peran $peran, ?string $div = null, bool $eksisting = false) => User::create([
            'name' => $nama, 'email' => $email, 'password' => 'password', 'peran' => $peran,
            'division_id' => $div ? $divisi[$div]->id : null, 'input_eksisting' => $eksisting, 'email_verified_at' => now(),
        ]);
        $akun('admin@ptgm.test', 'Admin JDIH', Peran::Admin);
        $gm = $akun('gm@ptgm.test', 'General Manager', Peran::Gm);
        $manajer = $akun('manajer.legal@ptgm.test', 'Manajer Legal', Peran::Manajer, 'Legal');
        $legal = $akun('karyawan.legal@ptgm.test', 'Staf Legal', Peran::Karyawan, 'Legal', eksisting: true);
        $akun('manajer.sdm@ptgm.test', 'Manajer SDM', Peran::Manajer, 'SDM');
        $sdm = $akun('karyawan.sdm@ptgm.test', 'Staf SDM', Peran::Karyawan, 'SDM');

        // [judul, kategori, sifat, pengaju, tanggal surat (hari lalu), berakhir (hari dari sekarang, null = tanpa batas)]
        $selesai = [
            ['Pembentukan Tim Pengadaan Barang dan Jasa Tahun 2026', 'SK', Sifat::Eksternal, $legal, 40, 330],
            ['Perjanjian Jual Beli Gas untuk Pelanggan Industri', 'Kontrak', Sifat::Eksternal, $legal, 200, 21],
            ['Nota Kesepahaman Pengembangan Jaringan Gas Kota Gresik', 'MOU/PKS', Sifat::Eksternal, $legal, 420, 310],
            ['Berita Acara Serah Terima Pekerjaan Pipa Distribusi Tahap II', 'Berita Acara', Sifat::Eksternal, $legal, 15, null],
            ['Penetapan Struktur Organisasi PT Gresik Migas', 'SK', Sifat::Eksternal, $sdm, 600, null],
            ['Perjanjian Kerja Sama Pemeliharaan Stasiun Kompresor', 'MOU/PKS', Sifat::Eksternal, $legal, 380, -12],
            ['Kontrak Jasa Konsultan Hukum Korporasi', 'Kontrak', Sifat::Internal, $legal, 90, 9],
            ['Pengangkatan Pegawai Tetap Periode Juli 2026', 'SK', Sifat::Internal, $sdm, 110, null],
            ['Berita Acara Rapat Umum Pemegang Saham Tahunan', 'Berita Acara', Sifat::Internal, $legal, 160, null],
            ['Penetapan Tarif Penyaluran Gas Bumi Tahun 2026', 'SK', Sifat::Eksternal, $legal, 290, 70],
        ];

        foreach ($selesai as $i => [$judul, $kat, $sifat, $pengaju, $lalu, $akhir]) {
            $nomor = sprintf('%03d/%s/PTGM/%s', $i + 11, ['SK' => 'SK', 'Kontrak' => 'KTR', 'MOU/PKS' => 'MOU', 'Berita Acara' => 'BA'][$kat], today()->subDays($lalu)->format('Y'));
            $dok = $this->dokumen($judul, $kat, $nomor, $kategori, $pengaju, [
                'sifat' => $sifat,
                'status' => Status::Selesai,
                'tanggal_surat' => today()->subDays($lalu),
                'tanggal_berlaku' => today()->subDays($lalu),
                'tanggal_berakhir' => $akhir === null ? null : today()->addDays($akhir),
                'berkas_final' => $this->pdf($judul, $nomor),
                'selesai_pada' => today()->subDays($lalu)->addDays(3),
                'dilihat' => ($i * 37) % 120,
            ]);
            foreach ([[$pengaju, 'ajukan'], [$manajer, 'setujui'], [$gm, 'setujui'], [$pengaju, 'selesai']] as $j => [$oleh, $aksi]) {
                $dok->logs()->create(['user_id' => $oleh->id, 'aksi' => $aksi, 'created_at' => today()->subDays($lalu)->addHours(9 + $j * 5)]);
            }
        }

        // Pengajuan yang sedang berjalan, satu per status.
        $berjalan = [
            ['Perjanjian Sewa Kantor Cabang Manyar', 'Kontrak', Status::Draf, []],
            ['Kebijakan Penggunaan Kendaraan Dinas', 'SK', Status::MenungguManajer, ['ajukan']],
            ['Kerja Sama Pelatihan K3 dengan Lembaga Pelatihan', 'MOU/PKS', Status::Revisi, ['ajukan', 'tolak']],
            ['Pengadaan Meter Gas Pelanggan Rumah Tangga', 'Kontrak', Status::MenungguGm, ['ajukan', 'setujui']],
            ['Penunjukan Pejabat Pengelola Informasi dan Dokumentasi', 'SK', Status::MenungguTtd, ['ajukan', 'setujui', 'setujui']],
        ];
        foreach ($berjalan as $i => [$judul, $kat, $status, $langkah]) {
            $dok = $this->dokumen($judul, $kat, null, $kategori, $legal, [
                'sifat' => $i % 2 ? Sifat::Eksternal : Sifat::Internal,
                'status' => $status,
                'berkas_draf' => $this->pdf($judul, 'DRAF'),
            ]);
            $dok->logs()->create(['user_id' => $legal->id, 'aksi' => 'buat', 'created_at' => now()->subDays(6 - $i)]);
            foreach ($langkah as $j => $aksi) {
                $dok->logs()->create([
                    'user_id' => match (true) { $aksi === 'ajukan' => $legal->id, $j === 2 => $gm->id, default => $manajer->id },
                    'aksi' => $aksi,
                    'catatan' => $aksi === 'tolak' ? 'Lengkapi ruang lingkup pelatihan dan jangka waktu kerja sama di pasal 2.' : null,
                    'created_at' => now()->subDays(5 - $i)->addHours($j * 3),
                ]);
            }
        }
    }

    private function dokumen(string $judul, string $kat, ?string $nomor, $kategori, User $pengaju, array $isi): Document
    {
        return Document::create([
            'judul' => $judul,
            'nomor' => $nomor,
            'category_id' => $kategori[$kat]->id,
            'division_id' => $pengaju->division_id,
            'abstrak' => "Dokumen ini mengatur {$judul} di lingkungan PT Gresik Migas, termasuk ruang lingkup, para pihak yang terlibat, serta hak dan kewajiban masing-masing. Dokumen contoh untuk demonstrasi.",
            'submitted_by' => $pengaju->id,
            ...$isi,
        ]);
    }

    /** PDF satu halaman yang sah dan punya lapisan teks, supaya pratinjau dan baca otomatis bisa dicoba. */
    private function pdf(string $judul, string $nomor): string
    {
        $esc = fn (string $s) => str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $s);
        $baris = [
            [18, 'PT GRESIK MIGAS'],
            [11, 'Gresik, Jawa Timur'],
            [11, ''],
            ...array_map(fn ($b) => [15, $b], explode("\n", wordwrap(mb_strtoupper($judul), 55))),
            [11, "Nomor: {$nomor}"],
            [11, ''],
            [11, 'Ditetapkan di Gresik pada tanggal '.today()->translatedFormat('j F Y').'.'],
            [11, 'Dokumen contoh untuk demonstrasi aplikasi JDIH PT Gresik Migas.'],
        ];
        $isi = "BT 72 770 Td\n";
        foreach ($baris as [$ukuran, $teks]) {
            $isi .= "/F1 {$ukuran} Tf 0 -".($ukuran + 10)." Td (".$esc($teks).") Tj\n";
        }
        $isi .= 'ET';

        $objek = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
            '<< /Length '.strlen($isi)." >>\nstream\n{$isi}\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        ];
        $pdf = "%PDF-1.4\n";
        $posisi = [];
        foreach ($objek as $i => $o) {
            $posisi[] = strlen($pdf);
            $pdf .= ($i + 1)." 0 obj\n{$o}\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= 'xref
0 '.(count($objek) + 1)."\n0000000000 65535 f \n";
        foreach ($posisi as $p) {
            $pdf .= sprintf("%010d 00000 n \n", $p);
        }
        $pdf .= 'trailer << /Size '.(count($objek) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";

        $path = 'dokumen/contoh-'.str($judul)->slug()->limit(60, '').'.pdf';
        Storage::put($path, $pdf);

        return $path;
    }
}
