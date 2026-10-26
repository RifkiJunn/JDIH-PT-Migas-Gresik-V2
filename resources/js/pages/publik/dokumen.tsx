import { Head, router } from '@inertiajs/react';
import { FileSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { type FormEvent, type ReactNode } from 'react';
import { BarisDokumen } from '@/components/dokumen';
import { Kosong, Penomoran, Pilih, Tombol } from '@/components/ui';
import { cx } from '@/lib';
import type { Dokumen, Halaman, Opsi } from '@/types';

type Filter = { q?: string; kategori?: string; tahun?: string; masa?: string; urut?: string };

const MASA = [['', 'Semua status'], ['berlaku', 'Berlaku'], ['akan_berakhir', 'Akan berakhir'], ['berakhir', 'Berakhir']];

export default function DaftarDokumen({ dokumen, filter, kategori, tahun }: { dokumen: Halaman<Dokumen>; filter: Filter; kategori: Opsi[]; tahun: number[] }) {
    const terapkan = (ubah: Filter) => {
        const baru = Object.fromEntries(Object.entries({ ...filter, ...ubah }).filter(([, v]) => v));
        router.get('/dokumen', baru, { preserveState: true, preserveScroll: true, replace: true, only: ['dokumen', 'filter'], viewTransition: false });
    };
    const cari = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        terapkan({ q: String(new FormData(e.currentTarget).get('q') ?? '') });
    };
    const aktif = [filter.kategori, filter.tahun, filter.masa].filter(Boolean).length;
    const namaKategori = kategori.find((k) => String(k.id) === filter.kategori)?.nama;

    const panelFilter = (
        <div className="grid gap-6">
            <Grup judul="Kategori">
                <Opsi pilih={!filter.kategori} onClick={() => terapkan({ kategori: '' })} label="Semua kategori" />
                {kategori.map((k) => (
                    <Opsi key={k.id} pilih={filter.kategori === String(k.id)} onClick={() => terapkan({ kategori: String(k.id) })} label={k.nama} jumlah={k.jumlah} />
                ))}
            </Grup>
            <Grup judul="Tahun">
                <Pilih aria-label="Tahun" value={filter.tahun ?? ''} onChange={(e) => terapkan({ tahun: e.target.value })}>
                    <option value="">Semua tahun</option>
                    {tahun.map((t) => <option key={t} value={t}>{t}</option>)}
                </Pilih>
            </Grup>
            <Grup judul="Status masa berlaku">
                {MASA.map(([v, l]) => <Opsi key={v} pilih={(filter.masa ?? '') === v} onClick={() => terapkan({ masa: v })} label={l} />)}
            </Grup>
            {aktif > 0 && (
                <Tombol varian="ghost" ukuran="sm" className="justify-self-start" onClick={() => router.get('/dokumen', filter.q ? { q: filter.q } : {})}>
                    <X /> Hapus filter
                </Tombol>
            )}
        </div>
    );

    return (
        <>
            <Head title={namaKategori ? `${namaKategori} · Dokumen Hukum` : 'Dokumen Hukum'} />
            <div className="border-b border-line bg-surface">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                    <h1 className="text-2xl font-bold sm:text-3xl">{namaKategori ?? 'Dokumen Hukum'}</h1>
                    <p className="mt-1 text-muted">Dokumen eksternal PT Gresik Migas yang telah disahkan dan terbuka untuk publik.</p>
                    <form onSubmit={cari} role="search" className="mt-5 flex max-w-2xl gap-2">
                        <label className="relative flex-1">
                            <span className="sr-only">Kata kunci</span>
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" aria-hidden />
                            <input key={filter.q} name="q" type="search" defaultValue={filter.q} placeholder="Judul, nomor, atau isi dokumen" className="h-11 w-full rounded-lg border border-line bg-bg pr-3 pl-11 text-ink placeholder:text-muted/80 focus:border-accent focus:ring-3 focus:ring-accent/20 focus:outline-none" />
                        </label>
                        <Tombol type="submit" className="h-11">Cari</Tombol>
                    </form>
                </div>
            </div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr]">
                <aside aria-label="Filter" className="hidden lg:block">
                    <div className="sticky top-24">{panelFilter}</div>
                </aside>
                <details className="group rounded-xl border border-line lg:hidden">
                    <summary className="flex h-12 cursor-pointer list-none items-center gap-2 px-4 font-medium">
                        <SlidersHorizontal className="size-4" aria-hidden /> Filter
                        {aktif > 0 && <span className="rounded-full bg-primary px-2 text-xs text-on-primary">{aktif}</span>}
                    </summary>
                    <div className="border-t border-line p-4">{panelFilter}</div>
                </details>

                <section aria-label="Hasil pencarian" className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted" aria-live="polite">
                            <strong className="text-ink tabular">{dokumen.total}</strong> dokumen{filter.q && <> untuk “{filter.q}”</>}
                        </p>
                        <label className="flex items-center gap-2 text-sm text-muted">
                            Urutkan
                            <Pilih className="h-9 w-auto" value={filter.urut ?? ''} onChange={(e) => terapkan({ urut: e.target.value })}>
                                <option value="">Terbaru</option>
                                <option value="populer">Terpopuler</option>
                            </Pilih>
                        </label>
                    </div>
                    {dokumen.data.length ? (
                        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                            {dokumen.data.map((d) => <BarisDokumen key={d.id} dok={d} />)}
                        </ul>
                    ) : (
                        <Kosong ikon={<FileSearch />} judul="Tidak ada dokumen yang cocok">
                            Coba kata kunci lain, atau hapus sebagian filter.
                        </Kosong>
                    )}
                    <Penomoran halaman={dokumen} />
                </section>
            </div>
        </>
    );
}

function Grup({ judul, children }: { judul: string; children: ReactNode }) {
    return (
        <fieldset className="grid gap-1">
            <legend className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{judul}</legend>
            {children}
        </fieldset>
    );
}

function Opsi({ pilih, onClick, label, jumlah }: { pilih: boolean; onClick: () => void; label: string; jumlah?: number }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={pilih}
            className={cx('flex h-9 cursor-pointer items-center justify-between rounded-lg px-3 text-left text-sm transition-colors', pilih ? 'bg-primary/12 font-semibold text-primary' : 'text-ink/85 hover:bg-surface')}
        >
            {label}
            {jumlah !== undefined && <span className="text-xs text-muted tabular">{jumlah}</span>}
        </button>
    );
}
