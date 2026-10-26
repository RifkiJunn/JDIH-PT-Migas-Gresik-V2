import { usePage } from '@inertiajs/react';
import type { Shared } from './types';

export const cx = (...kelas: (string | false | null | undefined)[]) => kelas.filter(Boolean).join(' ');

export const useShared = () => usePage<Shared>().props;

const tglFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const tglPendek = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

/** "2026-03-03" → "3 Maret 2026". Tanggal tanpa jam dibaca sebagai tanggal lokal. */
export function tanggal(nilai: string | null | undefined, pendek = false) {
    if (!nilai) return '–';
    const d = nilai.length === 10 ? new Date(`${nilai}T00:00:00`) : new Date(nilai);
    return (pendek ? tglPendek : tglFormat).format(d);
}

const relatif = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });

export function waktuLalu(iso: string) {
    const detik = (new Date(iso).getTime() - Date.now()) / 1000;
    const satuan: [Intl.RelativeTimeFormatUnit, number][] = [
        ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60],
    ];
    for (const [unit, s] of satuan) if (Math.abs(detik) >= s) return relatif.format(Math.round(detik / s), unit);
    return 'baru saja';
}

export function ukuran(byte: number | null | undefined) {
    if (!byte) return '';
    return byte > 1048576 ? `${(byte / 1048576).toFixed(1)} MB` : `${Math.ceil(byte / 1024)} KB`;
}

/** Sisa hari sampai tanggal; negatif bila sudah lewat. */
export function sisaHari(nilai: string | null) {
    if (!nilai) return null;
    const hari = new Date(`${nilai}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.round(hari / 86400000);
}

/** Permintaan JSON di luar Inertia (baca AI). Token CSRF diambil dari cookie XSRF-TOKEN milik Laravel. */
export async function kirimBerkas<T>(url: string, data: FormData): Promise<T> {
    const token = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
    const res = await fetch(url, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json', 'X-XSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest' },
    });
    const isi = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(isi.message ?? 'Permintaan gagal. Coba lagi.');
    return isi as T;
}

/** Label aksi riwayat dokumen dan log aktivitas. */
export const AKSI: Record<string, string> = {
    buat: 'Membuat draf',
    ajukan: 'Mengajukan',
    setujui: 'Menyetujui',
    tolak: 'Mengembalikan untuk revisi',
    batalkan: 'Membatalkan',
    selesai: 'Upload scan TTD, dokumen selesai',
    eksisting: 'Input dokumen eksisting',
    login: 'Login',
    approval: 'Approval',
    penolakan: 'Penolakan',
    akun: 'Akun baru',
    peran: 'Ubah peran',
    unduh: 'Unduh internal',
    unduh_cadangan: 'Unduh cadangan',
    cadangan: 'Cadangan',
    pulihkan: 'Pemulihan',
};

/** Identitas dan kontak di footer dan halaman Profil. Alamat dan kontak resmi masih menunggu konfirmasi (BRD 10). */
export const INSTANSI = {
    nama: 'PT Gresik Migas',
    alamat: 'Gresik, Jawa Timur',
    email: null as string | null,
    telepon: null as string | null,
    pengembang: 'Tim Capstone JDIH PTGM',
};
