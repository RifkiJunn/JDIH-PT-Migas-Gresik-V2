import { router, useForm } from '@inertiajs/react';
import { DatabaseBackup, Download, History, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Dialog, Input, Kolom, Kosong, Panel, Tombol } from '@/components/ui';
import { Kepala } from '@/layouts/internal';
import { ukuran, waktuLalu } from '@/lib';

type Cadangan = { nama: string; ukuran: number; waktu: string };

export default function HalamanCadangan({ cadangan }: { cadangan: Cadangan[] }) {
    const [membuat, setMembuat] = useState(false);
    const [pulihkan, setPulihkan] = useState(false);

    return (
        <>
            <Kepala
                judul="Backup & Restore"
                keterangan="Cadangan berisi seluruh data dan berkas dokumen. Dibuat otomatis tiap malam pukul 01.00; 14 cadangan terakhir disimpan."
                aksi={
                    <>
                        <Tombol varian="secondary" onClick={() => setPulihkan(true)}><History /> Pulihkan</Tombol>
                        <Tombol memuat={membuat} onClick={() => router.post('/admin/cadangan', {}, { onStart: () => setMembuat(true), onFinish: () => setMembuat(false) })}>
                            {!membuat && <DatabaseBackup />} Buat cadangan sekarang
                        </Tombol>
                    </>
                }
            />
            <Panel judul="Cadangan tersimpan">
                {cadangan.length ? (
                    <ul className="divide-y divide-line">
                        {cadangan.map((c) => (
                            <li key={c.nama} className="flex flex-wrap items-center gap-3 px-5 py-3">
                                <DatabaseBackup className="size-5 text-primary" aria-hidden />
                                <span className="min-w-0 flex-1">
                                    <span className="block font-medium tabular">{c.nama}</span>
                                    <span className="text-xs text-muted">{new Date(c.waktu).toLocaleString('id-ID')} · {waktuLalu(c.waktu)} · {ukuran(c.ukuran)}</span>
                                </span>
                                <a href={`/admin/cadangan/${c.nama}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-primary hover:bg-primary/8">
                                    <Download className="size-4" /> Unduh
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-5">
                        <Kosong ikon={<DatabaseBackup />} judul="Belum ada cadangan">Buat cadangan pertama sekarang. Simpan salinannya di luar server, misalnya di drive kantor.</Kosong>
                    </div>
                )}
            </Panel>
            <Dialog buka={pulihkan} tutup={() => setPulihkan(false)} judul="Pulihkan dari cadangan">
                <FormPulihkan selesai={() => setPulihkan(false)} />
            </Dialog>
        </>
    );
}

function FormPulihkan({ selesai }: { selesai: () => void }) {
    const form = useForm<{ berkas: File | null; konfirmasi: string }>({ berkas: null, konfirmasi: '' });
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                form.post('/admin/cadangan/pulihkan', { forceFormData: true, onSuccess: selesai });
            }}
            className="grid gap-4"
        >
            <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/8 p-4 text-sm">
                <TriangleAlert className="size-5 shrink-0 text-warning" aria-hidden />
                <p>Seluruh data dan berkas saat ini akan diganti isi cadangan. Sebelum memulihkan, sistem otomatis membuat cadangan pengaman dari keadaan sekarang.</p>
            </div>
            <ZipPicker berkas={form.data.berkas} onPilih={(f) => form.setData('berkas', f)} galat={form.errors.berkas} />
            <Kolom label="Ketik PULIHKAN untuk melanjutkan" galat={form.errors.konfirmasi}>
                {(id, a) => <Input id={id} {...a} autoComplete="off" value={form.data.konfirmasi} onChange={(e) => form.setData('konfirmasi', e.target.value)} />}
            </Kolom>
            <div className="flex justify-end gap-2">
                <Tombol varian="secondary" onClick={selesai}>Batal</Tombol>
                <Tombol type="submit" varian="danger" memuat={form.processing} disabled={!form.data.berkas || form.data.konfirmasi !== 'PULIHKAN'}>Pulihkan data</Tombol>
            </div>
        </form>
    );
}

function ZipPicker({ berkas, onPilih, galat }: { berkas: File | null; onPilih: (f: File) => void; galat?: string }) {
    return (
        <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="zip">Berkas cadangan (.zip)</label>
            <input id="zip" type="file" accept=".zip,application/zip" onChange={(e) => e.target.files?.[0] && onPilih(e.target.files[0])} className="text-sm file:mr-3 file:h-10 file:cursor-pointer file:rounded-lg file:border file:border-line file:bg-surface file:px-4 file:text-sm file:font-medium file:text-ink" />
            {berkas && <p className="text-xs text-muted">{berkas.name} · {ukuran(berkas.size)}</p>}
            {galat && <p className="text-sm text-danger">{galat}</p>}
        </div>
    );
}
