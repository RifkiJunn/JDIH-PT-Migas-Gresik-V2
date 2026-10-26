import { FileUp, Globe, Lock, RefreshCw, Sparkles, TriangleAlert } from 'lucide-react';
import { type DragEvent, useEffect, useRef, useState } from 'react';
import { cx, kirimBerkas, ukuran } from '@/lib';
import type { Opsi, Sifat } from '@/types';
import { Input, Kolom, Pilih, Teks, Tombol } from './ui';

export type Metadata = {
    judul: string;
    category_id: string;
    nomor: string;
    tanggal_surat: string;
    tanggal_berlaku: string;
    tanggal_berakhir: string;
    abstrak: string;
};

export const metadataKosong: Metadata = { judul: '', category_id: '', nomor: '', tanggal_surat: '', tanggal_berlaku: '', tanggal_berakhir: '', abstrak: '' };

const BATAS = 20 * 1024 * 1024;

/** Area unggah PDF: seret-lepas atau klik. Berkas yang dipilih langsung bisa dipratinjau dari perangkat sendiri. */
export function PilihBerkas({ berkas, onPilih, galat, label = 'Berkas PDF', petunjuk, pratinjau = true }: {
    berkas: File | null;
    onPilih: (f: File | null) => void;
    galat?: string;
    label?: string;
    petunjuk?: string;
    pratinjau?: boolean;
}) {
    const input = useRef<HTMLInputElement>(null);
    const [seret, setSeret] = useState(false);
    const [salah, setSalah] = useState<string | null>(null);
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!berkas) return setUrl(null);
        const u = URL.createObjectURL(berkas);
        setUrl(u);
        return () => URL.revokeObjectURL(u);
    }, [berkas]);

    const terima = (f: File | undefined) => {
        if (!f) return;
        if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) return setSalah('Hanya berkas PDF yang bisa diunggah.');
        if (f.size > BATAS) return setSalah(`Ukuran ${ukuran(f.size)} melebihi batas 20 MB.`);
        setSalah(null);
        onPilih(f);
    };
    const lepas = (e: DragEvent) => {
        e.preventDefault();
        setSeret(false);
        terima(e.dataTransfer.files[0]);
    };

    return (
        <div className="grid gap-3">
            <div>
                <p className="mb-1.5 text-sm font-medium">{label}</p>
                <div
                    onDragOver={(e) => { e.preventDefault(); setSeret(true); }}
                    onDragLeave={() => setSeret(false)}
                    onDrop={lepas}
                    className={cx(
                        'relative grid justify-items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
                        seret ? 'border-accent bg-accent/5' : galat || salah ? 'border-danger/60' : 'border-line hover:border-primary/40',
                    )}
                >
                    <span className={cx('grid size-12 place-items-center rounded-full', berkas ? 'bg-success/12 text-success' : 'bg-primary/10 text-primary')}>
                        <FileUp className="size-6" aria-hidden />
                    </span>
                    {berkas ? (
                        <>
                            <p className="max-w-full truncate font-medium">{berkas.name}</p>
                            <p className="text-sm text-muted">{ukuran(berkas.size)} · <button type="button" onClick={() => input.current?.click()} className="cursor-pointer font-medium text-link hover:underline">Ganti berkas</button></p>
                        </>
                    ) : (
                        <>
                            <p className="font-medium">Seret PDF ke sini, atau <button type="button" onClick={() => input.current?.click()} className="cursor-pointer text-link hover:underline">pilih dari perangkat</button></p>
                            <p className="text-sm text-muted">{petunjuk ?? 'PDF, maksimal 20 MB'}</p>
                        </>
                    )}
                    <input ref={input} type="file" accept="application/pdf,.pdf" className="sr-only" tabIndex={-1} aria-label={label} onChange={(e) => terima(e.target.files?.[0])} />
                </div>
                {(salah || galat) && <p className="mt-1.5 text-sm text-danger">{salah ?? galat}</p>}
            </div>
            {pratinjau && url && <iframe src={`${url}#view=FitH`} title="Pratinjau berkas" className="h-[420px] w-full rounded-xl border border-line bg-surface" />}
        </div>
    );
}

/** Tombol baca otomatis: OCR di server, teksnya dibaca AI, hasilnya mengisi kolom yang masih bisa dikoreksi (FR-19, FR-20). */
export function BacaOtomatis({ berkas, onHasil }: { berkas: File | null; onHasil: (data: Partial<Metadata>) => void }) {
    const [memuat, setMemuat] = useState(false);
    const [pesan, setPesan] = useState<{ galat: boolean; teks: string } | null>(null);

    const baca = async () => {
        if (!berkas) return;
        setMemuat(true);
        setPesan(null);
        const data = new FormData();
        data.append('berkas', berkas);
        try {
            const { data: hasil } = await kirimBerkas<{ data: Record<string, string | number | null> }>('/ai/baca', data);
            const terisi = Object.fromEntries(Object.entries(hasil).filter(([, v]) => v !== null).map(([k, v]) => [k, String(v)]));
            onHasil(terisi);
            const n = Object.keys(terisi).length;
            setPesan({ galat: n === 0, teks: n ? `${n} kolom terisi otomatis. Periksa dan koreksi sebelum menyimpan.` : 'AI tidak menemukan metadata. Silakan isi manual.' });
        } catch (e) {
            setPesan({ galat: true, teks: (e as Error).message });
        } finally {
            setMemuat(false);
        }
    };

    return (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium"><Sparkles className="size-4 text-accent" aria-hidden /> Baca otomatis dengan AI</p>
                    <p className="mt-0.5 text-sm text-muted">Nomor, perihal, dan tanggal dibaca dari scan. Teks diproses tanpa disimpan penyedia AI.</p>
                </div>
                <Tombol varian="secondary" onClick={baca} memuat={memuat} disabled={!berkas}>
                    {!memuat && <Sparkles />} {memuat ? 'Membaca…' : 'Baca otomatis'}
                </Tombol>
            </div>
            {pesan && (
                <p role="status" className={cx('mt-3 flex items-start gap-2 text-sm', pesan.galat ? 'text-danger' : 'text-ink')}>
                    {pesan.galat ? <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> : <RefreshCw className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />}
                    {pesan.teks}
                </p>
            )}
        </div>
    );
}

type FormMeta = { data: Metadata; setData: (k: keyof Metadata, v: string) => void; errors: Partial<Record<keyof Metadata, string>> };

/** Kolom metadata. `final` = dokumen sudah ber-TTD: nomor, tanggal surat, dan abstrak wajib. Kolom hasil AI diberi tanda. */
export function IsianMetadata({ form, kategori, final = false, dariAi = [] }: { form: FormMeta; kategori: Opsi[]; final?: boolean; dariAi?: string[] }) {
    const ai = (k: keyof Metadata) => (dariAi.includes(k) ? 'ring-2 ring-accent/40 border-accent/60' : '');
    const tanda = (k: keyof Metadata) => (dariAi.includes(k) ? 'Diisi AI: periksa kembali.' : undefined);
    const tgl = (k: 'tanggal_surat' | 'tanggal_berlaku' | 'tanggal_berakhir', label: string, wajib = false, petunjuk?: string) => (
        <Kolom label={label} galat={form.errors[k]} wajib={wajib} petunjuk={tanda(k) ?? petunjuk}>
            {(id, a) => <Input id={id} {...a} type="date" className={ai(k)} value={form.data[k]} onChange={(e) => form.setData(k, e.target.value)} />}
        </Kolom>
    );

    return (
        <div className="grid gap-5 sm:grid-cols-2">
            <Kolom label="Judul / perihal" galat={form.errors.judul} wajib className="sm:col-span-2" petunjuk={tanda('judul')}>
                {(id, a) => <Input id={id} {...a} className={ai('judul')} value={form.data.judul} onChange={(e) => form.setData('judul', e.target.value)} placeholder="Contoh: Pembentukan Tim Pengadaan Barang 2026" />}
            </Kolom>
            <Kolom label="Jenis dokumen" galat={form.errors.category_id} wajib petunjuk={tanda('category_id')}>
                {(id, a) => (
                    <Pilih id={id} {...a} className={ai('category_id')} value={form.data.category_id} onChange={(e) => form.setData('category_id', e.target.value)}>
                        <option value="">Pilih jenis…</option>
                        {kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                    </Pilih>
                )}
            </Kolom>
            <Kolom label="Nomor dokumen" galat={form.errors.nomor} wajib={final} petunjuk={tanda('nomor') ?? (final ? undefined : 'Boleh dikosongkan bila nomor baru terbit setelah TTD.')}>
                {(id, a) => <Input id={id} {...a} className={cx('tabular', ai('nomor'))} value={form.data.nomor} onChange={(e) => form.setData('nomor', e.target.value)} placeholder="012/SK/PTGM/X/2026" />}
            </Kolom>
            {tgl('tanggal_surat', 'Tanggal surat / penetapan', final)}
            {tgl('tanggal_berlaku', 'Mulai berlaku')}
            {tgl('tanggal_berakhir', 'Berakhir', false, 'Kosongkan bila tidak ada masa berlaku. Pengingat muncul 30 hari sebelumnya.')}
            <Kolom label="Abstrak / ringkasan" galat={form.errors.abstrak} wajib={final} className="sm:col-span-2" petunjuk={tanda('abstrak') ?? 'Dua sampai empat kalimat tentang isi dokumen. Tampil di portal untuk dokumen eksternal.'}>
                {(id, a) => <Teks id={id} {...a} className={ai('abstrak')} value={form.data.abstrak} onChange={(e) => form.setData('abstrak', e.target.value)} />}
            </Kolom>
        </div>
    );
}

export function PilihSifat({ nilai, onPilih, galat, judul = 'Sifat dokumen' }: { nilai: Sifat | ''; onPilih: (s: Sifat) => void; galat?: string; judul?: string }) {
    const opsi = [
        ['internal', Lock, 'Internal', 'Hanya bisa dibuka divisi pemilik.'],
        ['eksternal', Globe, 'Eksternal', 'Tampil di portal JDIH untuk publik.'],
    ] as const;
    return (
        <fieldset>
            <legend className="mb-1.5 text-sm font-medium">{judul} <span className="text-danger" aria-hidden>*</span></legend>
            <div className="grid gap-3 sm:grid-cols-2">
                {opsi.map(([v, Ikon, label, ket]) => (
                    <label key={v} className={cx('flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent', nilai === v ? 'border-primary bg-primary/8' : 'border-line hover:border-primary/40')}>
                        <input type="radio" name="sifat" value={v} checked={nilai === v} onChange={() => onPilih(v)} className="sr-only" />
                        <Ikon className={cx('mt-0.5 size-5 shrink-0', nilai === v ? 'text-primary' : 'text-muted')} aria-hidden />
                        <span>
                            <span className="block font-semibold">{label}</span>
                            <span className="text-sm text-muted">{ket}</span>
                        </span>
                    </label>
                ))}
            </div>
            {galat && <p className="mt-1.5 text-sm text-danger">{galat}</p>}
        </fieldset>
    );
}
