import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, ExternalLink, Menu, X } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { Flash, Logo, TemaToggle } from '@/components/kerangka';
import { kelasItemMenu, Tarik } from '@/components/tarik';
import { cx, INSTANSI, useShared } from '@/lib';

const MENU = [
    { label: 'Beranda', href: '/' },
    { label: 'Dokumen Hukum', href: '/dokumen', sub: true },
    { label: 'Profil', href: '/profil' },
    { label: 'Kontak', href: '/profil#kontak' },
];

/** Kerangka portal publik. Sengaja tanpa tombol login (BRD 7): pegawai masuk lewat /login. */
export default function PublicLayout({ children }: { children: ReactNode }) {
    const { url } = usePage();
    const { menuKategori } = useShared();
    const [laci, setLaci] = useState(false);
    const aktif = (href: string) => (href === '/' ? url === '/' : url.startsWith(href.split('#')[0]) && !href.includes('#'));

    useEffect(() => setLaci(false), [url]);

    return (
        <div className="flex min-h-dvh flex-col">
            <a href="#isi" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">
                Langsung ke isi
            </a>
            <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md supports-[backdrop-filter]:bg-bg/80">
                <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
                    <Logo />
                    <nav aria-label="Menu utama" className="ml-auto hidden items-center gap-1 md:flex">
                        {MENU.map((m) =>
                            m.sub ? (
                                <Tarik
                                    key={m.href}
                                    label="Dokumen Hukum"
                                    tombol={(buka) => (
                                        <span className={cx('flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-primary/8', aktif(m.href) ? 'text-primary' : 'text-ink/80 hover:text-ink')}>
                                            {m.label}
                                            <ChevronDown className={cx('size-4 transition-transform duration-200', buka && 'rotate-180')} aria-hidden />
                                        </span>
                                    )}
                                >
                                    {(tutup) => (
                                        <div onClick={tutup}>
                                            <Link href="/dokumen" className={cx(kelasItemMenu, 'font-medium')} prefetch>Semua dokumen</Link>
                                            <div className="my-1 h-px bg-line" />
                                            {menuKategori.map((k) => (
                                                <Link key={k.id} href={`/dokumen?kategori=${k.id}`} className={kelasItemMenu} prefetch>{k.nama}</Link>
                                            ))}
                                        </div>
                                    )}
                                </Tarik>
                            ) : (
                                <Link
                                    key={m.href}
                                    href={m.href}
                                    prefetch
                                    aria-current={aktif(m.href) ? 'page' : undefined}
                                    className={cx('flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-primary/8', aktif(m.href) ? 'text-primary' : 'text-ink/80 hover:text-ink')}
                                >
                                    {m.label}
                                </Link>
                            ),
                        )}
                    </nav>
                    <TemaToggle className="ml-auto md:ml-1" />
                    <button type="button" onClick={() => setLaci(!laci)} aria-expanded={laci} aria-controls="laci-publik" aria-label="Buka menu" className="-mr-2 grid size-10 cursor-pointer place-items-center rounded-lg text-ink hover:bg-primary/8 md:hidden">
                        {laci ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>
                </div>
                {laci && (
                    <nav id="laci-publik" aria-label="Menu utama" className="anim-muncul border-t border-line bg-bg px-4 pt-2 pb-4 md:hidden">
                        {MENU.map((m) => (
                            <Link key={m.href} href={m.href} className={cx('flex h-12 items-center rounded-lg px-3 font-medium', aktif(m.href) ? 'bg-primary/10 text-primary' : 'text-ink')}>
                                {m.label}
                            </Link>
                        ))}
                        <p className="mt-3 mb-1 px-3 text-xs font-semibold text-muted">Kategori</p>
                        <div className="flex flex-wrap gap-2 px-3">
                            {menuKategori.map((k) => (
                                <Link key={k.id} href={`/dokumen?kategori=${k.id}`} className="rounded-full border border-line px-3 py-1.5 text-sm">{k.nama}</Link>
                            ))}
                        </div>
                    </nav>
                )}
            </header>

            <main id="isi" className="flex-1">{children}</main>

            <footer className="bg-footer text-white/80">
                <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                    <div className="grid content-start gap-4">
                        <Logo putih />
                        <p className="max-w-xs text-sm leading-relaxed">
                            Jaringan Dokumentasi dan Informasi Hukum {INSTANSI.nama}. Pusat dokumen legal perusahaan yang terbuka untuk publik.
                        </p>
                        <p className="text-sm">{INSTANSI.alamat}</p>
                    </div>
                    <TautanFooter judul="Tautan cepat" tautan={[['Beranda', '/'], ['Dokumen Hukum', '/dokumen'], ['Profil JDIH', '/profil'], ['Kontak', '/profil#kontak']]} />
                    <TautanFooter judul="Kategori" tautan={menuKategori.slice(0, 6).map((k) => [k.nama, `/dokumen?kategori=${k.id}`])} />
                    <div className="grid content-start gap-3 text-sm">
                        <h2 className="font-semibold text-white">Informasi</h2>
                        <a href="https://jdihn.go.id" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
                            JDIH Nasional <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                        <Link href="/profil#faq" className="hover:text-white">FAQ</Link>
                        <Link href="/profil#privasi" className="hover:text-white">Kebijakan privasi</Link>
                    </div>
                </div>
                <div className="border-t border-white/10">
                    <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-5 text-xs text-white/65 sm:px-6">
                        <p>© {new Date().getFullYear()} {INSTANSI.nama}. Hak cipta dilindungi.</p>
                        <p>Developed by {INSTANSI.pengembang}</p>
                    </div>
                </div>
            </footer>
            <Flash />
        </div>
    );
}

function TautanFooter({ judul, tautan }: { judul: string; tautan: string[][] }) {
    return (
        <div className="grid content-start gap-3 text-sm">
            <h2 className="font-semibold text-white">{judul}</h2>
            {tautan.map(([label, href]) => (
                <Link key={href} href={href} className="hover:text-white">{label}</Link>
            ))}
        </div>
    );
}
