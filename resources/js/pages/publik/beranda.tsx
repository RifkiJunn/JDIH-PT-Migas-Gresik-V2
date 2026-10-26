import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Clock, FileSearch, Flame, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { BarisDokumen, IkonKategori } from '@/components/dokumen';
import { Kosong, Pilih } from '@/components/ui';
import { cx, tanggal } from '@/lib';
import type { Dokumen, Opsi } from '@/types';

type Props = {
    kategori: Opsi[];
    terbaru: Dokumen[];
    terpopuler: Dokumen[];
    tahun: number[];
    statistik: { dokumen: number; tahun_ini: number; diperbarui: string | null };
};

export default function Beranda({ kategori, terbaru, terpopuler, tahun, statistik }: Props) {
    const [tab, setTab] = useState<'terbaru' | 'terpopuler'>('terbaru');
    const daftar = tab === 'terbaru' ? terbaru : terpopuler;

    const cari = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const isian = Object.fromEntries([...new FormData(e.currentTarget)].filter(([, v]) => v !== ''));
        router.get('/dokumen', isian);
    };

    return (
        <>
            <Head title="Beranda" />

            <section className="relative isolate overflow-hidden bg-[linear-gradient(125deg,var(--hero-from)_15%,var(--hero-to))] text-white">
                {/* Lidah api dari logo sebagai tanda air: aset merek asli, bukan ilustrasi buatan. */}
                <img src="/images/logo-putih.png" alt="" aria-hidden className="pointer-events-none absolute -top-10 -right-16 -z-10 h-[130%] w-auto opacity-[0.07] select-none sm:right-0 lg:right-16" />
                <div className="mx-auto max-w-6xl px-4 pt-14 pb-24 sm:px-6 sm:pt-20 sm:pb-28">
                    <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.12]">
                        Dokumen hukum PT Gresik Migas, terbuka dan mudah dicari.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
                        Jaringan Dokumentasi dan Informasi Hukum: surat keputusan, kontrak, MOU, dan berita acara yang sudah disahkan untuk publik.
                    </p>
                    <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/80 tabular">
                        <span><strong className="text-white">{statistik.dokumen}</strong> dokumen publik</span>
                        <span><strong className="text-white">{statistik.tahun_ini}</strong> terbit tahun {new Date().getFullYear()}</span>
                        {statistik.diperbarui && <span>Diperbarui {tanggal(statistik.diperbarui)}</span>}
                    </p>
                </div>
            </section>

            {/* Kotak pencarian menumpang di tepi hero: tugas utama pengunjung ada di sini. */}
            <div className="relative z-10 mx-auto -mt-14 max-w-6xl px-4 sm:px-6">
                <form onSubmit={cari} role="search" aria-label="Cari dokumen" className="grid gap-3 rounded-2xl border border-line bg-bg p-3 shadow-float sm:p-4 md:grid-cols-[1fr_180px_170px_auto]">
                    <label className="relative">
                        <span className="sr-only">Kata kunci</span>
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" aria-hidden />
                        <input name="q" type="search" placeholder="Judul, nomor, atau isi dokumen" className="h-12 w-full rounded-xl border border-line bg-surface pr-4 pl-12 text-base text-ink placeholder:text-muted/80 focus:border-accent focus:bg-bg focus:ring-3 focus:ring-accent/20 focus:outline-none" />
                    </label>
                    <label>
                        <span className="sr-only">Jenis dokumen</span>
                        <Pilih name="kategori" className="h-12 rounded-xl bg-surface text-base" defaultValue="">
                            <option value="">Semua jenis</option>
                            {kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                        </Pilih>
                    </label>
                    <label>
                        <span className="sr-only">Tahun</span>
                        <Pilih name="tahun" className="h-12 rounded-xl bg-surface text-base" defaultValue="">
                            <option value="">Semua tahun</option>
                            {tahun.map((t) => <option key={t} value={t}>{t}</option>)}
                        </Pilih>
                    </label>
                    <button type="submit" className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-7 font-semibold text-on-primary transition-colors hover:bg-primary-hover active:scale-[0.98]">
                        <Search className="size-5" aria-hidden /> Cari
                    </button>
                </form>
                <Link href="/dokumen" className="mt-3 ml-1 inline-flex items-center gap-1 text-sm font-medium text-link hover:underline">
                    Pencarian lengkap dengan filter <ArrowRight className="size-4" aria-hidden />
                </Link>
            </div>

            <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6" aria-labelledby="judul-kategori">
                <h2 id="judul-kategori" className="text-xl font-semibold sm:text-2xl">Telusur per kategori</h2>
                <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {kategori.map((k) => (
                        <li key={k.id}>
                            <Link href={`/dokumen?kategori=${k.id}`} prefetch className="group flex h-full items-center gap-3 rounded-xl border border-line bg-bg p-4 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface">
                                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                                    <IkonKategori nama={k.nama} className="size-5" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block leading-snug font-semibold break-words">{k.nama}</span>
                                    <span className="text-sm text-muted tabular">{k.jumlah} dokumen</span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="judul-dokumen">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <h2 id="judul-dokumen" className="text-xl font-semibold sm:text-2xl">Dokumen hukum</h2>
                    <div role="tablist" aria-label="Urutan dokumen" className="inline-flex rounded-lg bg-surface p-1">
                        {([['terbaru', 'Terbaru', Clock], ['terpopuler', 'Terpopuler', Flame]] as const).map(([kunci, label, Ikon]) => (
                            <button
                                key={kunci}
                                type="button"
                                role="tab"
                                aria-selected={tab === kunci}
                                onClick={() => setTab(kunci)}
                                className={cx('inline-flex h-9 cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-medium transition-all duration-200', tab === kunci ? 'bg-bg text-primary shadow-sm' : 'text-muted hover:text-ink')}
                            >
                                <Ikon className="size-4" aria-hidden /> {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-5" role="tabpanel">
                    {daftar.length ? (
                        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                            {daftar.map((d) => <BarisDokumen key={d.id} dok={d} />)}
                        </ul>
                    ) : (
                        <Kosong ikon={<FileSearch />} judul="Belum ada dokumen publik">
                            Dokumen eksternal yang sudah disetujui GM akan tampil di sini.
                        </Kosong>
                    )}
                </div>

                <Link href="/dokumen" prefetch className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg border border-line px-5 text-sm font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-surface">
                    Lihat semua dokumen <ArrowRight className="size-4" aria-hidden />
                </Link>
            </section>
        </>
    );
}
