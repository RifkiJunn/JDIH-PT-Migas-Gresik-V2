import { Link } from '@inertiajs/react';
import { Archive, CalendarCheck } from 'lucide-react';
import { BarFilter, TabelDokumen } from '@/components/tabel';
import { Kosong, Panel, Penomoran, Pilih } from '@/components/ui';
import { Kepala } from '@/layouts/internal';
import { cx } from '@/lib';
import type { Dokumen, Halaman, Opsi } from '@/types';

type Props = {
    halaman: 'arsip' | 'akan-berakhir';
    dokumen: Halaman<Dokumen>;
    filter: Record<string, string>;
    kategori: Opsi[];
    divisi: Opsi[];
};

const MASA = [['akan_berakhir', 'Akan berakhir (30 hari)'], ['berakhir', 'Sudah berakhir'], ['semua', 'Semua dokumen']];

/** Arsip Dokumen dan Akan Berakhir: daftar dokumen selesai yang boleh dilihat akun ini. */
export default function Arsip({ halaman, dokumen, filter, kategori, divisi }: Props) {
    const arsip = halaman === 'arsip';
    const url = `/${halaman}`;

    return (
        <>
            <Kepala
                judul={arsip ? 'Arsip Dokumen' : 'Akan Berakhir'}
                keterangan={arsip ? 'Dokumen selesai yang dapat diakses akun Anda, internal maupun eksternal.' : 'Pantau masa berlaku dokumen agar tidak terlambat diperpanjang.'}
            />
            {!arsip && (
                <div className="mb-4 flex gap-1 overflow-x-auto" role="tablist" aria-label="Masa berlaku">
                    {MASA.map(([v, l]) => (
                        <Link
                            key={v}
                            href={url}
                            data={{ ...filter, masa: v, page: undefined }}
                            preserveState
                            replace
                            role="tab"
                            aria-selected={filter.masa === v}
                            className={cx('h-9 shrink-0 rounded-full px-4 text-sm leading-9 font-medium transition-colors', filter.masa === v ? 'bg-primary text-on-primary' : 'bg-bg text-muted ring-1 ring-line hover:text-ink')}
                        >
                            {l}
                        </Link>
                    ))}
                </div>
            )}
            <Panel>
                <BarFilter url={url} filter={filter}>
                    {(ubah) => (
                        <>
                            <Pilih aria-label="Kategori" className="w-auto min-w-40 flex-none" value={filter.kategori ?? ''} onChange={(e) => ubah('kategori', e.target.value)}>
                                <option value="">Semua kategori</option>
                                {kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                            </Pilih>
                            {divisi.length > 0 && (
                                <Pilih aria-label="Divisi" className="w-auto min-w-40 flex-none" value={filter.divisi ?? ''} onChange={(e) => ubah('divisi', e.target.value)}>
                                    <option value="">Semua divisi</option>
                                    {divisi.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                                </Pilih>
                            )}
                            {arsip && (
                                <>
                                    <Pilih aria-label="Sifat" className="w-auto flex-none" value={filter.sifat ?? ''} onChange={(e) => ubah('sifat', e.target.value)}>
                                        <option value="">Internal & eksternal</option>
                                        <option value="internal">Internal</option>
                                        <option value="eksternal">Eksternal</option>
                                    </Pilih>
                                    <Pilih aria-label="Masa berlaku" className="w-auto flex-none" value={filter.masa ?? ''} onChange={(e) => ubah('masa', e.target.value)}>
                                        <option value="">Semua masa berlaku</option>
                                        <option value="berlaku">Berlaku</option>
                                        <option value="akan_berakhir">Akan berakhir</option>
                                        <option value="berakhir">Berakhir</option>
                                    </Pilih>
                                </>
                            )}
                        </>
                    )}
                </BarFilter>
                {dokumen.data.length ? (
                    <TabelDokumen data={dokumen.data} kolom={['divisi', 'masa', 'berakhir']} />
                ) : (
                    <div className="p-5">
                        {arsip ? (
                            <Kosong ikon={<Archive />} judul="Arsip masih kosong">Dokumen yang sudah selesai (ber-TTD) akan tersimpan di sini.</Kosong>
                        ) : (
                            <Kosong ikon={<CalendarCheck />} judul="Tidak ada dokumen di daftar ini">Semua dokumen masih aman dari batas masa berlaku.</Kosong>
                        )}
                    </div>
                )}
            </Panel>
            <Penomoran halaman={dokumen} />
        </>
    );
}
