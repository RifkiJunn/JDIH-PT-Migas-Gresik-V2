import { Link, router } from '@inertiajs/react';
import { ChevronRight, Globe, Lock, Search } from 'lucide-react';
import { type ReactNode } from 'react';
import { cx, sisaHari, tanggal } from '@/lib';
import type { Dokumen } from '@/types';
import { kelasInput, LencanaMasa, LencanaStatus } from './ui';

type Kolom = 'status' | 'masa' | 'divisi' | 'pengaju' | 'berakhir' | 'diperbarui';

/** Tabel dokumen internal. Di layar sempit kolom sekunder disembunyikan dan baris tetap bisa diklik. */
export function TabelDokumen({ data, kolom, href = (d) => `/arsip/${d.id}`, aksi }: {
    data: Dokumen[];
    kolom: Kolom[];
    href?: (d: Dokumen) => string;
    aksi?: (d: Dokumen) => ReactNode;
}) {
    const ada = (k: Kolom) => kolom.includes(k);
    const th = 'px-4 py-3 text-left text-xs font-semibold text-muted';
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface">
                    <tr>
                        <th className={th}>Dokumen</th>
                        {ada('divisi') && <th className={cx(th, 'hidden lg:table-cell')}>Divisi</th>}
                        {ada('pengaju') && <th className={cx(th, 'hidden lg:table-cell')}>Pengaju</th>}
                        {ada('status') && <th className={cx(th, 'hidden sm:table-cell')}>Status</th>}
                        {ada('masa') && <th className={cx(th, 'hidden sm:table-cell')}>Masa berlaku</th>}
                        {ada('berakhir') && <th className={cx(th, 'hidden md:table-cell')}>Berakhir</th>}
                        {ada('diperbarui') && <th className={cx(th, 'hidden md:table-cell')}>Diperbarui</th>}
                        <th className={th}><span className="sr-only">Aksi</span></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-line">
                    {data.map((d) => {
                        const sisa = sisaHari(d.tanggal_berakhir);
                        return (
                            <tr key={d.id} className="group relative transition-colors hover:bg-surface">
                                <td className="max-w-md px-4 py-3">
                                    <Link href={href(d)} prefetch className="font-medium text-ink after:absolute after:inset-0 group-hover:text-primary">
                                        <span className="line-clamp-2">{d.judul}</span>
                                    </Link>
                                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                                        {d.sifat === 'internal' ? <Lock className="size-3.5" aria-label="Internal" /> : <Globe className="size-3.5" aria-label="Eksternal" />}
                                        <span>{d.kategori}</span>
                                        {d.nomor && <span className="tabular">· {d.nomor}</span>}
                                    </span>
                                    {/* Ringkasan status untuk layar sempit, karena kolomnya disembunyikan. */}
                                    <span className="mt-2 flex gap-2 sm:hidden">
                                        {ada('status') && <LencanaStatus status={d.status} label={d.status_label} />}
                                        {ada('masa') && <LencanaMasa masa={d.masa} />}
                                    </span>
                                </td>
                                {ada('divisi') && <td className="hidden px-4 py-3 text-muted lg:table-cell">{d.divisi}</td>}
                                {ada('pengaju') && <td className="hidden px-4 py-3 text-muted lg:table-cell">{d.pengaju}</td>}
                                {ada('status') && <td className="hidden px-4 py-3 sm:table-cell"><LencanaStatus status={d.status} label={d.status_label} /></td>}
                                {ada('masa') && <td className="hidden px-4 py-3 sm:table-cell"><LencanaMasa masa={d.masa} /></td>}
                                {ada('berakhir') && (
                                    <td className="hidden px-4 py-3 whitespace-nowrap md:table-cell">
                                        <span className="tabular">{tanggal(d.tanggal_berakhir, true)}</span>
                                        {sisa !== null && sisa >= 0 && sisa <= 30 && <span className="block text-xs text-warning">{sisa === 0 ? 'hari ini' : `${sisa} hari lagi`}</span>}
                                    </td>
                                )}
                                {ada('diperbarui') && <td className="hidden px-4 py-3 whitespace-nowrap text-muted tabular md:table-cell">{tanggal(d.diperbarui, true)}</td>}
                                <td className="relative z-10 px-4 py-3 text-right whitespace-nowrap">
                                    {aksi ? aksi(d) : <ChevronRight className="ml-auto size-4 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/** Baris filter: pencarian + pilihan. Perubahan langsung diterapkan tanpa memuat ulang halaman. */
export function BarFilter({ url, filter, children }: { url: string; filter: Record<string, string | undefined>; children?: (ubah: (k: string, v: string) => void) => ReactNode }) {
    const terapkan = (baru: Record<string, string | undefined>) =>
        router.get(url, Object.fromEntries(Object.entries({ ...filter, ...baru }).filter(([, v]) => v)), {
            preserveState: true, preserveScroll: true, replace: true, viewTransition: false,
        });

    return (
        <div className="flex flex-wrap gap-2 border-b border-line p-3">
            <form
                role="search"
                className="relative min-w-52 flex-1"
                onSubmit={(e) => {
                    e.preventDefault();
                    terapkan({ q: String(new FormData(e.currentTarget).get('q') ?? ''), page: undefined });
                }}
            >
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input key={filter.q} name="q" type="search" defaultValue={filter.q} placeholder="Cari judul atau nomor, lalu Enter" aria-label="Cari" className={cx(kelasInput, 'h-10 pl-9')} />
            </form>
            {children?.((k, v) => terapkan({ [k]: v, page: undefined }))}
        </div>
    );
}
