import { Link } from '@inertiajs/react';
import { CircleCheck, Inbox, Undo2 } from 'lucide-react';
import { TabelDokumen } from '@/components/tabel';
import { Kosong, Panel, Tombol } from '@/components/ui';
import { Kepala } from '@/layouts/internal';
import { cx, useShared, waktuLalu } from '@/lib';
import type { Dokumen } from '@/types';

type Riwayat = { id: number; aksi: 'setujui' | 'tolak'; catatan: string | null; waktu: string; dokumen: Dokumen };

export default function Approval({ menunggu, riwayat, tab }: { menunggu: Dokumen[]; riwayat: Riwayat[]; tab: 'antrean' | 'riwayat' }) {
    const gm = useShared().auth!.user.peran === 'gm';
    const kelasTab = (aktif: boolean) => cx('h-9 rounded-full px-4 text-sm leading-9 font-medium transition-colors', aktif ? 'bg-primary text-on-primary' : 'bg-bg text-muted ring-1 ring-line hover:text-ink');

    return (
        <>
            <Kepala
                judul="Approval"
                keterangan={gm ? 'Approval final: setujui dan tentukan apakah dokumen internal atau eksternal.' : 'Pengajuan dari divisi Anda yang menunggu approval tahap 1.'}
            />
            <div className="mb-4 flex gap-1" role="tablist">
                <Link href="/approval" role="tab" aria-selected={tab === 'antrean'} className={kelasTab(tab === 'antrean')} preserveState>
                    Menunggu ({menunggu.length})
                </Link>
                <Link href="/approval?riwayat=1" role="tab" aria-selected={tab === 'riwayat'} className={kelasTab(tab === 'riwayat')} preserveState>
                    Riwayat keputusan
                </Link>
            </div>

            {tab === 'antrean' ? (
                <Panel>
                    {menunggu.length ? (
                        <TabelDokumen
                            data={menunggu}
                            kolom={['pengaju', 'divisi', 'diperbarui']}
                            aksi={(d) => <Tombol ukuran="sm" href={`/arsip/${d.id}`}>Tinjau</Tombol>}
                        />
                    ) : (
                        <div className="p-5">
                            <Kosong ikon={<Inbox />} judul="Tidak ada yang menunggu">Semua pengajuan sudah Anda putuskan. Pengajuan baru akan muncul di sini dan di notifikasi.</Kosong>
                        </div>
                    )}
                </Panel>
            ) : (
                <Panel>
                    {riwayat.length ? (
                        <ul className="divide-y divide-line">
                            {riwayat.map((r) => (
                                <li key={r.id}>
                                    <Link href={`/arsip/${r.dokumen.id}`} className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-surface">
                                        {r.aksi === 'setujui' ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-label="Disetujui" /> : <Undo2 className="mt-0.5 size-5 shrink-0 text-danger" aria-label="Ditolak" />}
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-medium">{r.dokumen.judul}</span>
                                            <span className="text-sm text-muted">{r.aksi === 'setujui' ? 'Disetujui' : 'Dikembalikan untuk revisi'} · {r.dokumen.pengaju} · {r.dokumen.divisi}</span>
                                            {r.catatan && <span className="mt-1 block text-sm text-ink/80 italic">“{r.catatan}”</span>}
                                        </span>
                                        <time className="shrink-0 text-xs text-muted" dateTime={r.waktu}>{waktuLalu(r.waktu)}</time>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-5"><Kosong ikon={<Inbox />} judul="Belum ada keputusan" /></div>
                    )}
                </Panel>
            )}
        </>
    );
}
