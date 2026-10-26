import { router } from '@inertiajs/react';
import { FilePlus2, Inbox } from 'lucide-react';
import { BarFilter, TabelDokumen } from '@/components/tabel';
import { Kosong, Panel, Penomoran, Tombol } from '@/components/ui';
import { Kepala } from '@/layouts/internal';
import { cx } from '@/lib';
import type { Dokumen, Halaman } from '@/types';

const TAB = [
    ['', 'Semua'],
    ['draf', 'Draf'],
    ['menunggu_manajer', 'Menunggu approval'],
    ['perlu_tindakan', 'Perlu tindakan'],
    ['selesai', 'Selesai'],
    ['ditolak', 'Ditolak'],
];

export default function DaftarPengajuan({ dokumen, filter }: { dokumen: Halaman<Dokumen>; filter: { q?: string; status?: string } }) {
    return (
        <>
            <Kepala
                judul="Pengajuan Saya"
                keterangan="Draf, status approval, dan dokumen yang perlu Anda tindak lanjuti."
                aksi={<Tombol href="/pengajuan/baru"><FilePlus2 /> Ajukan Dokumen</Tombol>}
            />
            <div className="mb-4 flex gap-1 overflow-x-auto" role="tablist" aria-label="Status">
                {TAB.map(([v, l]) => (
                    <button
                        key={v}
                        type="button"
                        role="tab"
                        aria-selected={(filter.status ?? '') === v}
                        onClick={() => router.get('/pengajuan', Object.fromEntries(Object.entries({ q: filter.q, status: v }).filter(([, x]) => x)), { preserveState: true, replace: true, viewTransition: false })}
                        className={cx('h-9 shrink-0 cursor-pointer rounded-full px-4 text-sm font-medium transition-colors', (filter.status ?? '') === v ? 'bg-primary text-on-primary' : 'bg-bg text-muted ring-1 ring-line hover:text-ink')}
                    >
                        {l}
                    </button>
                ))}
            </div>
            <Panel>
                <BarFilter url="/pengajuan" filter={filter} />
                {dokumen.data.length ? (
                    <TabelDokumen data={dokumen.data} kolom={['status', 'diperbarui']} />
                ) : (
                    <div className="p-5">
                        <Kosong ikon={<Inbox />} judul={filter.status || filter.q ? 'Tidak ada pengajuan yang cocok' : 'Belum ada pengajuan'}>
                            {!filter.status && !filter.q && (
                                <>
                                    Upload draf dokumen, isi metadata, lalu kirim untuk approval Manajer.
                                    <div className="mt-4"><Tombol href="/pengajuan/baru"><FilePlus2 /> Ajukan dokumen pertama</Tombol></div>
                                </>
                            )}
                        </Kosong>
                    </div>
                )}
            </Panel>
            <Penomoran halaman={dokumen} />
        </>
    );
}
