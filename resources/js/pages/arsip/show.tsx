import { router, useForm } from '@inertiajs/react';
import { Ban, Check, CircleCheck, Download, ExternalLink, Globe, Lock, Pencil, Send, Stamp, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { BacaOtomatis, IsianMetadata, type Metadata, PilihBerkas, PilihSifat } from '@/components/form-dokumen';
import { Pratinjau } from '@/components/dokumen';
import { Dialog, Kolom, LencanaMasa, LencanaStatus, Panel, Teks, Tombol } from '@/components/ui';
import { Kepala } from '@/layouts/internal';
import { AKSI, cx, tanggal, ukuran, useShared, waktuLalu } from '@/lib';
import type { Dokumen, Opsi, Sifat, Status } from '@/types';

type Props = {
    dokumen: Dokumen & { sumber: 'pengajuan' | 'eksisting'; berkas_ukuran: number | null; selesai_pada: string | null };
    riwayat: { id: number; aksi: string; catatan: string | null; oleh: string; peran: string; waktu: string }[];
    boleh: { ubah: boolean; hapus: boolean; batalkan: boolean; putus: boolean; putus_gm: boolean; selesaikan: boolean; unduh: boolean };
    kategori: Opsi[];
};

export default function DetailInternal({ dokumen: d, riwayat, boleh, kategori }: Props) {
    const { auth } = useShared();
    const [konfirmasi, setKonfirmasi] = useState<'hapus' | 'batalkan' | null>(null);
    const jejak: [string, string][] = d.status === 'selesai'
        ? [[auth!.user.peran === 'admin' ? 'Akan Berakhir' : 'Arsip Dokumen', auth!.user.peran === 'admin' ? '/akan-berakhir' : '/arsip']]
        : boleh.putus ? [['Approval', '/approval']] : [['Pengajuan Saya', '/pengajuan']];

    return (
        <>
            <Kepala
                judul={d.judul}
                jejak={jejak}
                aksi={
                    <>
                        {boleh.hapus && <Tombol varian="ghost" onClick={() => setKonfirmasi('hapus')} className="text-danger hover:bg-danger/10 hover:text-danger"><Trash2 /> Hapus draf</Tombol>}
                        {boleh.batalkan && !boleh.hapus && <Tombol varian="ghost" onClick={() => setKonfirmasi('batalkan')}><Ban /> Batalkan</Tombol>}
                        {boleh.ubah && <Tombol varian="secondary" href={`/pengajuan/${d.id}/ubah`}><Pencil /> {d.status === 'revisi' ? 'Perbaiki' : 'Ubah'}</Tombol>}
                        {boleh.ubah && <Tombol onClick={() => router.post(`/pengajuan/${d.id}/ajukan`)}><Send /> {d.status === 'revisi' ? 'Ajukan ulang' : 'Ajukan'}</Tombol>}
                        {boleh.unduh && (
                            <a href={`/dokumen/${d.id}/berkas?unduh=1`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-bg px-4 text-sm font-medium hover:bg-surface">
                                <Download className="size-4" /> Unduh
                            </a>
                        )}
                    </>
                }
            />

            <div className="mb-6 flex flex-wrap items-center gap-2">
                <LencanaStatus status={d.status} label={d.status_label} />
                {d.status === 'selesai' && <LencanaMasa masa={d.masa} />}
                <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                    {d.sifat === 'internal' ? <Lock className="size-4" /> : <Globe className="size-4" />}
                    {d.sifat === 'internal' ? 'Internal divisi' : d.status === 'selesai' ? 'Tampil di portal publik' : 'Usulan: eksternal'}
                </span>
                {d.status === 'selesai' && d.sifat === 'eksternal' && (
                    <a href={`/dokumen/${d.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-link hover:underline">Lihat di portal <ExternalLink className="size-3.5" /></a>
                )}
            </div>

            {d.sumber === 'pengajuan' && <Pelacak status={d.status} />}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
                <div className="grid min-w-0 content-start gap-6">
                    {boleh.putus && <PanelKeputusan d={d} gm={boleh.putus_gm} />}
                    {boleh.selesaikan && <PanelSelesaikan d={d} kategori={kategori} />}
                    {d.abstrak && (
                        <Panel judul="Abstrak">
                            <p className="max-w-[70ch] px-5 py-4 leading-relaxed whitespace-pre-line">{d.abstrak}</p>
                        </Panel>
                    )}
                    {boleh.unduh && (
                        <Panel judul={d.status === 'selesai' ? 'Dokumen' : 'Draf dokumen'}>
                            <div className="p-3">
                                <Pratinjau id={d.id} judul={d.judul} className="h-[70dvh] min-h-[420px]" />
                            </div>
                        </Panel>
                    )}
                </div>

                <aside className="grid content-start gap-6">
                    <Panel judul="Informasi">
                        <dl className="divide-y divide-line text-sm">
                            {([
                                ['Jenis', d.kategori],
                                ['Nomor', d.nomor ?? '–'],
                                ['Tanggal surat', tanggal(d.tanggal_surat)],
                                ['Berlaku', tanggal(d.tanggal_berlaku)],
                                ['Berakhir', d.tanggal_berakhir ? tanggal(d.tanggal_berakhir) : 'Tidak ditentukan'],
                                ['Divisi', d.divisi],
                                ['Pengaju', d.pengaju],
                                ['Sumber', d.sumber === 'eksisting' ? 'Dokumen eksisting (Modul II)' : 'Pengajuan baru (Modul I)'],
                                ...(d.berkas_ukuran ? [['Ukuran berkas', ukuran(d.berkas_ukuran)]] : []),
                            ] as [string, string][]).map(([k, v]) => (
                                <div key={k} className="grid grid-cols-[110px_1fr] gap-3 px-5 py-2.5">
                                    <dt className="text-muted">{k}</dt>
                                    <dd className="font-medium break-words tabular">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </Panel>
                    <Panel judul="Riwayat">
                        <ol className="px-5 py-4">
                            {riwayat.map((r, i) => (
                                <li key={r.id} className="relative grid grid-cols-[20px_1fr] gap-3 pb-5 last:pb-0">
                                    {i < riwayat.length - 1 && <span className="absolute top-5 bottom-0 left-[9px] w-px bg-line" aria-hidden />}
                                    <span className={cx('mt-1 grid size-5 place-items-center rounded-full ring-4 ring-bg', r.aksi === 'tolak' ? 'bg-danger' : r.aksi === 'setujui' || r.aksi === 'selesai' ? 'bg-success' : 'bg-primary')} aria-hidden>
                                        {r.aksi === 'tolak' ? <Undo2 className="size-3 text-bg" /> : <Check className="size-3 text-bg" />}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">{AKSI[r.aksi] ?? r.aksi}</p>
                                        <p className="text-xs text-muted">{r.oleh} · {r.peran} · <time dateTime={r.waktu} title={new Date(r.waktu).toLocaleString('id-ID')}>{waktuLalu(r.waktu)}</time></p>
                                        {r.catatan && <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-sm whitespace-pre-line">{r.catatan}</p>}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </Panel>
                </aside>
            </div>

            <Dialog buka={konfirmasi !== null} tutup={() => setKonfirmasi(null)} judul={konfirmasi === 'hapus' ? 'Hapus draf ini?' : 'Batalkan pengajuan?'}>
                <p className="text-muted">
                    {konfirmasi === 'hapus' ? 'Draf dan berkasnya dihapus permanen.' : 'Pengajuan berhenti dan berstatus Ditolak. Anda perlu membuat pengajuan baru untuk mengajukan lagi.'}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                    <Tombol varian="secondary" onClick={() => setKonfirmasi(null)}>Kembali</Tombol>
                    <Tombol
                        varian="danger"
                        onClick={() => (konfirmasi === 'hapus' ? router.delete(`/pengajuan/${d.id}`) : router.post(`/pengajuan/${d.id}/batalkan`, {}, { onFinish: () => setKonfirmasi(null) }))}
                    >
                        {konfirmasi === 'hapus' ? 'Hapus' : 'Ya, batalkan'}
                    </Tombol>
                </div>
            </Dialog>
        </>
    );
}

const TAHAP: [string, Status[]][] = [
    ['Draf', ['draf']],
    ['Approval Manajer', ['menunggu_manajer', 'revisi']],
    ['Approval GM', ['menunggu_gm']],
    ['TTD basah', ['menunggu_ttd']],
    ['Selesai', ['selesai']],
];

/** Posisi pengajuan dalam alur Modul I. */
function Pelacak({ status }: { status: Status }) {
    if (status === 'ditolak') return null;
    const kini = TAHAP.findIndex(([, s]) => s.includes(status));
    return (
        <ol className="mb-6 flex overflow-x-auto rounded-xl border border-line bg-bg p-2" aria-label="Tahap pengajuan">
            {TAHAP.map(([label], i) => {
                const lewat = i < kini || status === 'selesai';
                const sini = i === kini && status !== 'selesai';
                return (
                    <li key={label} aria-current={sini ? 'step' : undefined} className={cx('flex min-w-36 flex-1 items-center gap-2.5 rounded-lg px-3 py-2', sini && (status === 'revisi' ? 'bg-danger/10' : 'bg-primary/10'))}>
                        <span className={cx('grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold', lewat ? 'bg-success text-bg' : sini ? (status === 'revisi' ? 'bg-danger text-bg' : 'bg-primary text-on-primary') : 'bg-surface text-muted ring-1 ring-line')}>
                            {lewat ? <Check className="size-4" /> : i + 1}
                        </span>
                        <span className={cx('text-sm', sini ? 'font-semibold' : 'text-muted')}>
                            {label}
                            {sini && status === 'revisi' && <span className="block text-xs font-normal text-danger">Perlu revisi</span>}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

function PanelKeputusan({ d, gm }: { d: Dokumen; gm: boolean }) {
    const setuju = useForm<{ sifat: Sifat | '' }>({ sifat: gm ? d.sifat : '' });
    const tolak = useForm({ catatan: '' });
    const [bukaTolak, setBukaTolak] = useState(false);

    return (
        <Panel judul={gm ? 'Approval final (GM)' : 'Approval Manajer'} className="border-primary/30 ring-4 ring-primary/5">
            <div className="grid gap-5 p-5">
                <p className="text-sm text-muted">
                    Periksa draf di bawah. Setujui untuk meneruskan{gm ? ' ke tahap TTD basah' : ' ke GM'}, atau tolak dengan komentar agar pengaju merevisi.
                </p>
                {gm && (
                    <>
                        <PilihSifat judul="Keputusan sifat dokumen" nilai={setuju.data.sifat} onPilih={(s) => setuju.setData('sifat', s)} galat={setuju.errors.sifat} />
                        <p className="-mt-3 text-sm text-muted">Usulan pengaju: <strong className="text-ink">{d.sifat === 'eksternal' ? 'Eksternal' : 'Internal'}</strong>.</p>
                    </>
                )}
                <div className="flex flex-wrap gap-2">
                    <Tombol onClick={() => setuju.post(`/approval/${d.id}/setujui`)} memuat={setuju.processing}>
                        {!setuju.processing && <CircleCheck />} Setujui
                    </Tombol>
                    <Tombol varian="secondary" onClick={() => setBukaTolak(true)} className="text-danger"><Undo2 /> Tolak</Tombol>
                </div>
            </div>
            <Dialog buka={bukaTolak} tutup={() => setBukaTolak(false)} judul="Tolak dan minta revisi">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        tolak.post(`/approval/${d.id}/tolak`, { onSuccess: () => setBukaTolak(false) });
                    }}
                    className="grid gap-4"
                >
                    <Kolom label="Komentar untuk pengaju" galat={tolak.errors.catatan} wajib petunjuk="Jelaskan apa yang perlu diperbaiki. Pengajuan kembali ke pengaju dengan status Revisi.">
                        {(id, a) => <Teks id={id} {...a} autoFocus value={tolak.data.catatan} onChange={(e) => tolak.setData('catatan', e.target.value)} />}
                    </Kolom>
                    <div className="flex justify-end gap-2">
                        <Tombol varian="secondary" onClick={() => setBukaTolak(false)}>Batal</Tombol>
                        <Tombol type="submit" varian="danger" memuat={tolak.processing} disabled={!tolak.data.catatan.trim()}>Tolak</Tombol>
                    </div>
                </form>
            </Dialog>
        </Panel>
    );
}

/** Modul I langkah 5–8: upload scan ber-TTD ke pengajuan yang sama, baca AI, koreksi, simpan. */
function PanelSelesaikan({ d, kategori }: { d: Dokumen; kategori: Opsi[] }) {
    const [dariAi, setDariAi] = useState<string[]>([]);
    const form = useForm<Metadata & { berkas: File | null }>({
        judul: d.judul,
        category_id: String(kategori.find((k) => k.nama === d.kategori)?.id ?? ''),
        nomor: d.nomor ?? '',
        tanggal_surat: d.tanggal_surat ?? '',
        tanggal_berlaku: d.tanggal_berlaku ?? '',
        tanggal_berakhir: d.tanggal_berakhir ?? '',
        abstrak: d.abstrak ?? '',
        berkas: null,
    });

    return (
        <Panel judul={<span className="flex items-center gap-2"><Stamp className="size-4 text-accent" /> Upload scan ber-TTD</span>} className="border-accent/40 ring-4 ring-accent/5">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(`/pengajuan/${d.id}/selesaikan`, { forceFormData: true });
                }}
                className="grid gap-6 p-5"
            >
                <p className="text-sm text-muted">
                    GM sudah menyetujui sebagai dokumen <strong className="text-ink">{d.sifat}</strong>. Setelah TTD basah, scan dokumen (minimal 300 dpi) dan upload di sini.
                </p>
                <PilihBerkas berkas={form.data.berkas} onPilih={(f) => form.setData('berkas', f)} galat={form.errors.berkas} label="Scan dokumen ber-TTD" pratinjau={false} />
                <BacaOtomatis
                    berkas={form.data.berkas}
                    onHasil={(h) => {
                        form.setData((lama) => ({ ...lama, ...h }));
                        setDariAi(Object.keys(h));
                    }}
                />
                <IsianMetadata form={form} kategori={kategori} final dariAi={dariAi} />
                <div className="flex justify-end">
                    <Tombol type="submit" ukuran="lg" memuat={form.processing} disabled={!form.data.berkas}>
                        {!form.processing && <CircleCheck />} Simpan dan selesaikan
                    </Tombol>
                </div>
                {form.progress && <progress value={form.progress.percentage} max="100" className="h-1 w-full accent-[var(--accent)]" />}
            </form>
        </Panel>
    );
}
