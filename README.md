# JDIH PT Gresik Migas

Portal Jaringan Dokumentasi dan Informasi Hukum PTGM. Satu aplikasi, dua ruang:

- **Portal publik** (`/`): cari, baca, dan unduh dokumen eksternal yang sudah disetujui GM. Tanpa login.
- **Ruang internal** (`/login`): pengajuan dan approval (Modul I), input dokumen eksisting (Modul II), arsip divisi, pengingat masa berlaku, dan administrasi.

Kebutuhan lengkap ada di `BRD JDIH PT Gresik Migas.md`.

## Teknologi

Laravel 13 · Inertia 3 + React 19 + TypeScript · Tailwind CSS 4 · PostgreSQL (pengembangan) / MySQL (produksi) · PHPUnit

## Menjalankan

Butuh PHP 8.3+, Composer, Node 20+, dan PostgreSQL atau MySQL.

```bash
composer install
npm install
cp .env.example .env        # lalu isi DB_* dan OPENROUTER_API_KEY
php artisan key:generate
php artisan migrate --seed  # data contoh
composer dev                # server, queue, log, dan Vite sekaligus
```

Buka http://localhost:8000. Akun contoh (password semua `password`):

| Email | Peran |
| --- | --- |
| `admin@ptgm.test` | Admin |
| `gm@ptgm.test` | GM |
| `manajer.legal@ptgm.test` | Manajer Legal |
| `karyawan.legal@ptgm.test` | Karyawan Legal, ditunjuk input dokumen eksisting |
| `manajer.sdm@ptgm.test`, `karyawan.sdm@ptgm.test` | Divisi SDM |

## Baca otomatis (AI)

1. Server membaca teks PDF dengan `pdftotext`. Bila PDF hasil scan tanpa lapisan teks, halaman diubah ke gambar (`pdftoppm`) lalu dibaca `tesseract` (bahasa `ind`).
2. **Hanya teks** yang dikirim ke OpenRouter, dengan `provider.zdr = true` (Zero Data Retention) dan `data_collection = deny`. Berkas tidak pernah keluar dari server.
3. Hasil mengisi form; pengguna wajib memeriksa sebelum menyimpan. Bila AI gagal atau kunci kosong, form tetap bisa diisi manual.

Pasang `poppler-utils` dan `tesseract-ocr` + `tesseract-ocr-ind` di server. Di Windows, isi path lengkapnya di `PDFTOTEXT_BIN`, `PDFTOPPM_BIN`, `TESSERACT_BIN`.

## Tugas terjadwal

Jalankan `php artisan schedule:work` (lokal) atau cron `* * * * * php artisan schedule:run` (server):

- 01.00: cadangan otomatis (`cadangan:buat`), 14 terakhir disimpan di `storage/app/private/cadangan`.
- 07.00: pengingat dokumen yang berakhir 30 hari lagi (`dokumen:pengingat`), lewat notifikasi aplikasi dan email.

Salin cadangan ke luar server secara berkala. Restore lewat menu **Backup & Restore** (Admin) membuat cadangan pengaman lebih dulu.

## Tes

```bash
php artisan test
npm run typecheck
```

Tes menjaga aturan keamanan: matriks siapa melihat apa (policy dan query harus sama), alur status pengajuan, berkas internal tidak bisa dibuka lewat URL, pemulihan cadangan, dan AI yang gagal tetap bisa diisi manual.

## Sebelum produksi

- Ganti semua password akun contoh, atau jalankan `php artisan migrate --force` tanpa `--seed`.
- `APP_ENV=production`, `APP_DEBUG=false`, HTTPS aktif (URL otomatis dipaksa `https` di produksi).
- Isi alamat dan kontak resmi di `resources/js/lib.ts` (`INSTANSI`).
