import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity, Archive, Bell, CalendarClock, ChevronRight, DatabaseBackup, FilePen, FileStack, Globe, Inbox, KeyRound, LayoutDashboard,
    LogOut, type LucideIcon, Menu, Tags, UserRound, Users, X,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { Flash, Logo, TemaToggle } from '@/components/kerangka';
import { kelasItemMenu, Tarik } from '@/components/tarik';
import { cx, INSTANSI, useShared, waktuLalu } from '@/lib';
import type { Peran } from '@/types';

type ItemMenu = { label: string; href: string; ikon: LucideIcon; peran: Peran[]; badge?: number; syarat?: boolean };

/** Kerangka sistem informasi internal (BRD 8b): sidebar kiri, topbar, konten. */
export default function InternalLayout({ children }: { children: ReactNode }) {
    const { auth, antrean } = useShared();
    const { url } = usePage();
    const user = auth!.user;
    const [ciut, setCiut] = useState(false);
    const [laci, setLaci] = useState(false);

    useEffect(() => {
        try {
            setCiut(localStorage.getItem('sidebar') === 'ciut');
        } catch {
            // abaikan
        }
    }, []);
    useEffect(() => setLaci(false), [url]);

    const alihkan = () => {
        if (matchMedia('(min-width: 1024px)').matches) {
            setCiut(!ciut);
            try {
                localStorage.setItem('sidebar', ciut ? 'lebar' : 'ciut');
            } catch {
                // abaikan
            }
        } else setLaci(!laci);
    };

    const menu: ItemMenu[] = [
        { label: 'Dashboard', href: '/dashboard', ikon: LayoutDashboard, peran: ['karyawan', 'manajer', 'gm', 'admin'] },
        { label: 'Pengajuan Saya', href: '/pengajuan', ikon: FilePen, peran: ['karyawan'] },
        { label: 'Approval', href: '/approval', ikon: Inbox, peran: ['manajer', 'gm'], badge: antrean },
        { label: 'Dokumen Eksisting', href: '/eksisting', ikon: FileStack, peran: ['karyawan'], syarat: user.input_eksisting },
        { label: 'Arsip Dokumen', href: '/arsip', ikon: Archive, peran: ['karyawan', 'manajer', 'gm'] },
        { label: 'Akan Berakhir', href: '/akan-berakhir', ikon: CalendarClock, peran: ['karyawan', 'manajer', 'gm', 'admin'] },
    ];
    const menuAdmin: ItemMenu[] = [
        { label: 'Kelola Akun', href: '/admin/akun', ikon: Users, peran: ['admin'] },
        { label: 'Kategori & Divisi', href: '/admin/master', ikon: Tags, peran: ['admin'] },
        { label: 'Backup & Restore', href: '/admin/cadangan', ikon: DatabaseBackup, peran: ['admin'] },
        { label: 'Log Aktivitas', href: '/admin/log', ikon: Activity, peran: ['admin'] },
    ];
    const boleh = (m: ItemMenu) => m.peran.includes(user.peran) && m.syarat !== false;
    // Detail /arsip/{id} menyalakan menu asalnya: pengajuan yang berjalan milik Pengajuan/Approval, bukan Arsip.
    const status = (usePage().props as { dokumen?: { status?: string } }).dokumen?.status;
    const asal = !url.startsWith('/arsip/') || !status ? null
        : status === 'selesai' ? (user.peran === 'admin' ? '/akan-berakhir' : '/arsip')
        : user.peran === 'manajer' || user.peran === 'gm' ? '/approval' : '/pengajuan';
    const aktif = (href: string) => (asal ? asal === href : url === href || url.startsWith(`${href}/`) || url.startsWith(`${href}?`));

    const sidebar = (sempit: boolean) => (
        <nav aria-label="Menu internal" className="flex h-full flex-col gap-1 p-3">
            {menu.filter(boleh).map((m) => <Item key={m.href} m={m} aktif={aktif(m.href)} sempit={sempit} />)}
            {user.peran === 'admin' && (
                <>
                    <p className={cx('mt-4 mb-1 px-3 text-[11px] font-semibold tracking-wider text-muted', sempit && 'sr-only')}>ADMIN</p>
                    {menuAdmin.map((m) => <Item key={m.href} m={m} aktif={aktif(m.href)} sempit={sempit} />)}
                </>
            )}
            <div className="mt-auto grid gap-1 border-t border-line pt-3">
                <Item m={{ label: 'Portal publik', href: '/', ikon: Globe, peran: [] }} aktif={false} sempit={sempit} />
                <button type="button" onClick={() => router.post('/logout')} title={sempit ? 'Keluar' : undefined} className={cx('flex h-10 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium text-danger transition-colors hover:bg-danger/10', sempit && 'justify-center px-0')}>
                    <LogOut className="size-[18px] shrink-0" aria-hidden />
                    <span className={cx(sempit && 'sr-only')}>Keluar</span>
                </button>
            </div>
        </nav>
    );

    return (
        <div className="min-h-dvh bg-surface">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg px-3 sm:px-4">
                <button type="button" onClick={alihkan} aria-label={laci ? 'Tutup menu' : 'Ciutkan atau lebarkan menu'} aria-expanded={laci} className="grid size-10 cursor-pointer place-items-center rounded-lg text-muted hover:bg-primary/8 hover:text-ink">
                    {laci ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
                <Logo sub="Internal" href="/dashboard" />
                <div className="ml-auto flex items-center gap-1">
                    <TemaToggle />
                    <Notifikasi />
                    <Tarik
                        kanan
                        lebar="w-60"
                        label="Menu akun"
                        tombol={() => (
                            <span className="flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 transition-colors hover:bg-primary/8">
                                <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-semibold text-on-primary" aria-hidden>
                                    {user.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                                </span>
                                <span className="hidden text-left leading-tight sm:block">
                                    <span className="block max-w-40 truncate text-sm font-semibold">{user.name}</span>
                                    <span className="block text-xs text-muted">{user.peran_label}{user.divisi && ` · ${user.divisi}`}</span>
                                </span>
                            </span>
                        )}
                    >
                        {(tutup) => (
                            <div onClick={tutup}>
                                <div className="px-3 py-2 sm:hidden">
                                    <p className="truncate text-sm font-semibold">{user.name}</p>
                                    <p className="text-xs text-muted">{user.peran_label}{user.divisi && ` · ${user.divisi}`}</p>
                                </div>
                                <Link href="/akun" className={kelasItemMenu}><UserRound /> Profil saya</Link>
                                <Link href="/akun#password" className={kelasItemMenu}><KeyRound /> Ganti password</Link>
                                <div className="my-1 h-px bg-line" />
                                <button type="button" onClick={() => router.post('/logout')} className={cx(kelasItemMenu, 'font-medium text-danger [&_svg]:text-danger hover:bg-danger/10')}>
                                    <LogOut /> Keluar
                                </button>
                            </div>
                        )}
                    </Tarik>
                </div>
            </header>

            <div className="flex">
                <aside className={cx('sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 overflow-y-auto border-r border-line bg-surface-2 transition-[width] duration-200 ease-out lg:block', ciut ? 'w-[72px]' : 'w-64')}>
                    {sidebar(ciut)}
                </aside>
                {laci && (
                    <div className="fixed inset-0 top-16 z-20 lg:hidden">
                        <button type="button" aria-label="Tutup menu" className="absolute inset-0 cursor-default bg-[#0A0B1A]/50" onClick={() => setLaci(false)} />
                        <aside className="anim-laci relative h-full w-72 max-w-[85vw] overflow-y-auto border-r border-line bg-surface-2">{sidebar(false)}</aside>
                    </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
                    <footer className="mx-auto flex w-full max-w-7xl flex-wrap justify-between gap-2 px-4 py-5 text-xs text-muted sm:px-6 lg:px-8">
                        <span>© {new Date().getFullYear()} {INSTANSI.nama}</span>
                        <span>Developed by {INSTANSI.pengembang}</span>
                    </footer>
                </div>
            </div>
            <Flash />
        </div>
    );
}

function Item({ m, aktif, sempit }: { m: ItemMenu; aktif: boolean; sempit: boolean }) {
    const Ikon = m.ikon;
    return (
        <Link
            href={m.href}
            prefetch
            aria-current={aktif ? 'page' : undefined}
            title={sempit ? m.label : undefined}
            className={cx(
                'relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150',
                sempit && 'justify-center px-0',
                aktif
                    ? 'bg-primary/15 font-semibold text-primary before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-r-full before:bg-primary'
                    : 'text-muted hover:bg-primary/8 hover:text-ink',
            )}
        >
            <Ikon className="size-[18px] shrink-0" aria-hidden />
            <span className={cx('flex-1 truncate', sempit && 'sr-only')}>{m.label}</span>
            {!!m.badge && (
                <span className={cx('grid h-5 min-w-5 place-items-center rounded-full bg-warning px-1.5 text-[11px] font-bold text-bg tabular', sempit && 'absolute top-1 right-2.5 h-4 min-w-4 px-1 text-[10px]')}>
                    {m.badge}
                </span>
            )}
        </Link>
    );
}

function Notifikasi() {
    const { notifikasi } = useShared();
    if (!notifikasi) return null;
    return (
        <Tarik
            kanan
            lebar="w-[min(22rem,calc(100vw-1.5rem))]"
            label={`Notifikasi, ${notifikasi.belum} belum dibaca`}
            tombol={() => (
                <span className="relative grid size-10 place-items-center rounded-lg text-muted transition-colors hover:bg-primary/8 hover:text-ink">
                    <Bell className="size-[18px]" aria-hidden />
                    {notifikasi.belum > 0 && (
                        <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-bg tabular">
                            {notifikasi.belum > 9 ? '9+' : notifikasi.belum}
                        </span>
                    )}
                </span>
            )}
        >
            {(tutup) => (
                <div>
                    <div className="flex items-center justify-between px-3 py-2">
                        <p className="text-sm font-semibold">Notifikasi</p>
                        {notifikasi.belum > 0 && (
                            <button type="button" onClick={() => router.post('/notifikasi/baca-semua', {}, { preserveScroll: true })} className="cursor-pointer text-xs font-medium text-link hover:underline">
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>
                    {notifikasi.daftar.length ? (
                        <ul className="max-h-96 overflow-y-auto" onClick={tutup}>
                            {notifikasi.daftar.map((n) => (
                                <li key={n.id}>
                                    <Link href={`/notifikasi/${n.id}`} className="flex gap-3 rounded-lg px-3 py-2.5 hover:bg-primary/8">
                                        <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', n.dibaca ? 'bg-transparent' : 'bg-accent')} aria-hidden />
                                        <span className="min-w-0">
                                            <span className={cx('block text-sm', !n.dibaca && 'font-medium')}>{n.pesan}</span>
                                            <span className="text-xs text-muted">{waktuLalu(n.waktu)}</span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="px-3 py-6 text-center text-sm text-muted">Belum ada notifikasi.</p>
                    )}
                </div>
            )}
        </Tarik>
    );
}

/** Header konten: breadcrumb, judul halaman, aksi utama di kanan. Judul tab peramban ikut berubah. */
export function Kepala({ judul, jejak = [], keterangan, aksi }: { judul: string; jejak?: [string, string][]; keterangan?: ReactNode; aksi?: ReactNode }) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <Head title={judul} />
            <div className="min-w-0">
                <nav aria-label="Breadcrumb" className="mb-1.5 flex flex-wrap items-center gap-1 text-sm text-muted">
                    <Link href="/dashboard" className="hover:text-ink">Beranda</Link>
                    {jejak.map(([label, href]) => (
                        <span key={href} className="flex items-center gap-1">
                            <ChevronRight className="size-3.5" aria-hidden />
                            <Link href={href} className="hover:text-ink">{label}</Link>
                        </span>
                    ))}
                    <ChevronRight className="size-3.5" aria-hidden />
                    <span className="max-w-[40ch] truncate text-ink" aria-current="page">{judul}</span>
                </nav>
                <h1 className="text-2xl font-bold">{judul}</h1>
                {keterangan && <p className="mt-1 text-sm text-muted">{keterangan}</p>}
            </div>
            {aksi && <div className="flex flex-wrap gap-2">{aksi}</div>}
        </div>
    );
}
