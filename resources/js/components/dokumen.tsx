import { Link } from '@inertiajs/react';
import { CalendarDays, Download, Eye, FileSignature, FileText, Handshake, Landmark, ScrollText, Stamp } from 'lucide-react';
import { useState } from 'react';
import { cx, tanggal } from '@/lib';
import type { Dokumen } from '@/types';
import { Dialog, LencanaMasa, Tombol } from './ui';

/** Ikon kategori ditebak dari namanya; kategori baru dari Admin memakai ikon dokumen umum. */
export function IkonKategori({ nama, className }: { nama: string; className?: string }) {
    const n = nama.toLowerCase();
    const Ikon = n.includes('sk') || n.includes('keputusan') ? Stamp
        : n.includes('kontrak') ? FileSignature
        : n.includes('mou') || n.includes('pks') || n.includes('kerja sama') ? Handshake
        : n.includes('acara') ? CalendarDays
        : n.includes('peraturan') ? Landmark
        : n.includes('surat') ? ScrollText
        : FileText;
    return <Ikon className={className} aria-hidden />;
}

/** Pratinjau PDF memakai penampil bawaan peramban; tidak perlu mengunduh. */
export function Pratinjau({ id, judul, className }: { id: number; judul: string; className?: string }) {
    return (
        <iframe
            src={`/dokumen/${id}/berkas#view=FitH`}
            title={`Pratinjau ${judul}`}
            loading="lazy"
            className={cx('w-full rounded-xl border border-line bg-surface', className)}
        />
    );
}

export function TombolPratinjau({ dok }: { dok: Dokumen }) {
    const [buka, setBuka] = useState(false);
    return (
        <>
            <Tombol varian="secondary" ukuran="sm" onClick={() => setBuka(true)}>
                <Eye /> Preview
            </Tombol>
            <Dialog buka={buka} tutup={() => setBuka(false)} judul={dok.judul} lebar="max-w-4xl">
                <Pratinjau id={dok.id} judul={dok.judul} className="h-[70dvh]" />
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Tombol varian="secondary" href={`/dokumen/${dok.id}`}>Lihat detail</Tombol>
                    <a href={`/dokumen/${dok.id}/berkas?unduh=1`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover">
                        <Download className="size-4" /> Unduh PDF
                    </a>
                </div>
            </Dialog>
        </>
    );
}

/** Baris register dokumen publik: judul, nomor, tahun, kategori, status, Preview, Unduh. */
export function BarisDokumen({ dok }: { dok: Dokumen }) {
    return (
        <li className="group relative grid gap-3 px-4 py-4 transition-colors hover:bg-surface sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5 sm:px-5">
            <div className="hidden size-11 place-items-center rounded-lg bg-primary/8 text-primary sm:grid">
                <IkonKategori nama={dok.kategori} className="size-5" />
            </div>
            <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span className="font-semibold text-primary">{dok.kategori}</span>
                    <span aria-hidden>·</span>
                    <span className="tabular">{dok.nomor ?? 'Tanpa nomor'}</span>
                    {dok.tahun && (
                        <>
                            <span aria-hidden>·</span>
                            <span className="tabular">{dok.tahun}</span>
                        </>
                    )}
                </div>
                <Link href={`/dokumen/${dok.id}`} prefetch className="line-clamp-2 font-semibold leading-snug text-ink decoration-primary/40 group-hover:underline after:absolute after:inset-0 sm:after:content-none">
                    {dok.judul}
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <LencanaMasa masa={dok.masa} />
                    {dok.tanggal_berakhir && <span>s.d. {tanggal(dok.tanggal_berakhir, true)}</span>}
                </div>
            </div>
            <div className="relative z-10 flex gap-2">
                <TombolPratinjau dok={dok} />
                <a href={`/dokumen/${dok.id}/berkas?unduh=1`} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-primary hover:bg-primary/8" aria-label={`Unduh ${dok.judul}`}>
                    <Download className="size-4" aria-hidden /> Unduh
                </a>
            </div>
        </li>
    );
}
