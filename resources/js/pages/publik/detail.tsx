import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Download, ExternalLink, Eye } from 'lucide-react';
import { IkonKategori, Pratinjau } from '@/components/dokumen';
import { LencanaMasa } from '@/components/ui';
import { tanggal } from '@/lib';
import type { Dokumen } from '@/types';

export default function Detail({ dokumen: d, terkait }: { dokumen: Dokumen & { dilihat: number }; terkait: Dokumen[] }) {
    const meta: [string, string][] = [
        ['Jenis dokumen', d.kategori],
        ['Nomor', d.nomor ?? '–'],
        ['Tahun', d.tahun ? String(d.tahun) : '–'],
        ['Tanggal penetapan', tanggal(d.tanggal_surat)],
        ['Mulai berlaku', tanggal(d.tanggal_berlaku)],
        ['Berakhir', d.tanggal_berakhir ? tanggal(d.tanggal_berakhir) : 'Tidak ditentukan'],
        ['Divisi penerbit', d.divisi],
    ];

    return (
        <>
            <Head title={d.judul} />
            <div className="border-b border-line bg-surface">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
                        <Link href="/" className="hover:text-ink">Beranda</Link>
                        <ChevronRight className="size-4" aria-hidden />
                        <Link href="/dokumen" className="hover:text-ink">Dokumen Hukum</Link>
                        <ChevronRight className="size-4" aria-hidden />
                        <span className="text-ink" aria-current="page">{d.kategori}</span>
                    </nav>
                    <h1 className="mt-4 max-w-4xl text-2xl font-bold sm:text-3xl">{d.judul}</h1>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
                        <LencanaMasa masa={d.masa} />
                        <span className="tabular">{d.nomor}</span>
                        <span className="inline-flex items-center gap-1.5 tabular"><Eye className="size-4" aria-hidden /> Dilihat {d.dilihat} kali</span>
                    </div>
                </div>
            </div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
                <div className="grid min-w-0 content-start gap-8">
                    {d.abstrak && (
                        <section aria-labelledby="abstrak">
                            <h2 id="abstrak" className="text-lg font-semibold">Abstrak</h2>
                            <p className="mt-2 max-w-[70ch] leading-relaxed whitespace-pre-line text-ink/90">{d.abstrak}</p>
                        </section>
                    )}
                    <section aria-labelledby="pratinjau">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 id="pratinjau" className="text-lg font-semibold">Pratinjau dokumen</h2>
                            <a href={`/dokumen/${d.id}/berkas`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-link hover:underline">
                                Buka di tab baru <ExternalLink className="size-4" aria-hidden />
                            </a>
                        </div>
                        <Pratinjau id={d.id} judul={d.judul} className="mt-3 h-[75dvh] min-h-[480px]" />
                    </section>
                </div>

                <aside className="grid content-start gap-6 lg:sticky lg:top-24 lg:self-start">
                    <a href={`/dokumen/${d.id}/berkas?unduh=1`} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-hover">
                        <Download className="size-5" aria-hidden /> Unduh PDF
                    </a>
                    <section className="rounded-xl border border-line" aria-labelledby="metadata">
                        <h2 id="metadata" className="border-b border-line px-5 py-3 font-semibold">Informasi dokumen</h2>
                        <dl className="divide-y divide-line text-sm">
                            {meta.map(([k, v]) => (
                                <div key={k} className="grid grid-cols-[136px_1fr] gap-3 px-5 py-2.5">
                                    <dt className="text-muted">{k}</dt>
                                    <dd className="font-medium tabular">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                    {terkait.length > 0 && (
                        <section aria-labelledby="terkait">
                            <h2 id="terkait" className="mb-3 font-semibold">Dokumen terkait</h2>
                            <ul className="grid gap-2">
                                {terkait.map((t) => (
                                    <li key={t.id}>
                                        <Link href={`/dokumen/${t.id}`} prefetch className="group flex gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-surface">
                                            <IkonKategori nama={t.kategori} className="mt-0.5 size-4 shrink-0 text-primary" />
                                            <span className="min-w-0">
                                                <span className="line-clamp-2 text-sm font-medium group-hover:underline">{t.judul}</span>
                                                <span className="text-xs text-muted tabular">{t.nomor ?? t.kategori} · {t.tahun}</span>
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </aside>
            </div>
        </>
    );
}
