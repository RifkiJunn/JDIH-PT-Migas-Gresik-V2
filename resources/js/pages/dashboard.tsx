import { Link } from '@inertiajs/react';
import {
    Activity, ArrowRight, CalendarCheck, CalendarClock, CircleCheck, CircleX, DatabaseBackup, FilePlus2, FileText, Files, Globe, Hourglass, Inbox, Lock, PenLine, Users,
} from 'lucide-react';
import { Kepala } from '@/layouts/internal';
import { Kosong, LencanaMasa, Panel, Tombol } from '@/components/ui';
import { AKSI, cx, sisaHari, tanggal, useShared, waktuLalu } from '@/lib';
import type { Dokumen } from '@/types';

type Kartu = { label: string; nilai: number | string | null; ket: string; url: string; ikon: string; perhatian: boolean; jenis: 'angka' | 'tanggal' };
type Aktivitas = { id: number; judul: string; oleh: string; aksi: string; waktu: string; url: string | null };

const IKON = {
    'file-text': FileText, hourglass: Hourglass, 'pen-line': PenLine, 'calendar-clock': CalendarClock, inbox: Inbox, 'circle-check': CircleCheck,
    'circle-x': CircleX, globe: Globe, lock: Lock, users: Users, files: Files, 'database-backup': DatabaseBackup, activity: Activity,
} as const;

export default function Dashboard({ kartu, aktivitas, berakhir }: { kartu: Kartu[]; aktivitas: Aktivitas[]; berakhir: Dokumen[] }) {
    const { auth } = useShared();
    const user = auth!.user;
    const sapa = new Date().getHours() < 11 ? 'Selamat pagi' : new Date().getHours() < 15 ? 'Selamat siang' : new Date().getHours() < 19 ? 'Selamat sore' : 'Selamat malam';

    return (
        <>
            <Kepala
                judul="Dashboard"
                keterangan={`${sapa}, ${user.name}. ${user.peran_label}${user.divisi ? ` · ${user.divisi}` : ''}`}
                aksi={user.peran === 'karyawan' && <Tombol href="/pengajuan/baru"><FilePlus2 /> Ajukan Dokumen</Tombol>}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kartu.map((k) => {
                    const Ikon = IKON[k.ikon as keyof typeof IKON] ?? FileText;
                    return (
                        <Link
                            key={k.label}
                            href={k.url}
                            prefetch
                            className={cx(
                                'group relative grid gap-3 rounded-xl border bg-bg p-5 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-float',
                                k.perhatian ? 'border-warning/50 bg-[color-mix(in_oklab,var(--warning)_6%,var(--bg))]' : 'border-line hover:border-primary/30',
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium text-muted">{k.label}</p>
                                <span className={cx('grid size-10 place-items-center rounded-lg', k.perhatian ? 'bg-warning/15 text-warning' : 'bg-primary/10 text-primary')}>
                                    <Ikon className="size-5" aria-hidden />
                                </span>
                            </div>
                            <p className={cx('font-bold tracking-tight tabular', k.jenis === 'tanggal' ? 'text-lg' : 'text-3xl')}>
                                {k.jenis === 'tanggal' ? (k.nilai ? waktuLalu(String(k.nilai)) : 'Belum ada') : k.nilai}
                            </p>
                            <p className="flex items-center justify-between gap-2 text-xs text-muted">
                                {k.ket}
                                <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                            </p>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
                <Panel judul="Aktivitas terbaru" aksi={user.peran === 'admin' && <Link href="/admin/log" className="text-sm font-medium text-link hover:underline">Semua log</Link>}>
                    {aktivitas.length ? (
                        <ul className="divide-y divide-line">
                            {aktivitas.map((a) => {
                                const isi = (
                                    <>
                                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-hidden />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">{a.judul}</span>
                                            <span className="text-xs text-muted">{AKSI[a.aksi] ?? a.aksi} oleh {a.oleh}</span>
                                        </span>
                                        <time className="shrink-0 text-xs text-muted" dateTime={a.waktu}>{waktuLalu(a.waktu)}</time>
                                    </>
                                );
                                return (
                                    <li key={a.id}>
                                        {a.url ? <Link href={a.url} className="flex gap-3 px-5 py-3 transition-colors hover:bg-surface">{isi}</Link> : <div className="flex gap-3 px-5 py-3">{isi}</div>}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="p-5">
                            <Kosong ikon={<Activity />} judul="Belum ada aktivitas">
                                {user.peran === 'karyawan' ? 'Mulai dengan mengajukan dokumen pertama Anda.' : 'Aktivitas pengajuan akan muncul di sini.'}
                            </Kosong>
                        </div>
                    )}
                </Panel>

                <Panel judul="Dokumen akan berakhir" aksi={<Link href="/akan-berakhir" className="text-sm font-medium text-link hover:underline">Lihat semua</Link>}>
                    {berakhir.length ? (
                        <ul className="divide-y divide-line">
                            {berakhir.map((d) => {
                                const sisa = sisaHari(d.tanggal_berakhir);
                                return (
                                    <li key={d.id}>
                                        <Link href={`/arsip/${d.id}`} className="grid gap-1 px-5 py-3 transition-colors hover:bg-surface">
                                            <span className="line-clamp-1 text-sm font-medium">{d.judul}</span>
                                            <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                                                <LencanaMasa masa={d.masa} />
                                                <span className="tabular">{tanggal(d.tanggal_berakhir, true)}{sisa !== null && sisa >= 0 && ` · ${sisa === 0 ? 'hari ini' : `${sisa} hari lagi`}`}</span>
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="p-5">
                            <Kosong ikon={<CalendarCheck />} judul="Aman untuk 30 hari ke depan">Tidak ada dokumen yang akan berakhir dalam waktu dekat.</Kosong>
                        </div>
                    )}
                </Panel>
            </div>
        </>
    );
}
