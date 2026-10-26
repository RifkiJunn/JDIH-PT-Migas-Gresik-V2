import { useForm } from '@inertiajs/react';
import { CircleCheck, ListPlus } from 'lucide-react';
import { useState } from 'react';
import { BacaOtomatis, IsianMetadata, type Metadata, metadataKosong, PilihBerkas, PilihSifat } from '@/components/form-dokumen';
import { Panel, Tombol } from '@/components/ui';
import { Kepala } from '@/layouts/internal';
import type { Opsi, Sifat } from '@/types';

/** Modul II: scan dokumen lama ber-TTD → AI → koreksi → internal/eksternal → simpan. Tanpa approval. */
export default function FormEksisting({ kategori }: { kategori: Opsi[] }) {
    const [dariAi, setDariAi] = useState<string[]>([]);
    const form = useForm<Metadata & { sifat: Sifat | ''; berkas: File | null; lagi: boolean }>({ ...metadataKosong, sifat: '', berkas: null, lagi: false });

    const simpan = (lagi: boolean) => {
        form.transform((d) => ({ ...d, lagi }));
        form.post('/eksisting', {
            forceFormData: true,
            onSuccess: () => {
                if (lagi) {
                    form.reset();
                    setDariAi([]);
                }
            },
        });
    };

    return (
        <>
            <Kepala judul="Dokumen Eksisting" keterangan="Input dokumen lama yang sudah ber-TTD basah. Dokumen langsung masuk arsip tanpa approval." />
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    simpan(false);
                }}
                className="grid gap-6"
            >
                <Panel judul="1. Upload scan">
                    <div className="grid gap-5 p-5">
                        <PilihBerkas berkas={form.data.berkas} onPilih={(f) => form.setData('berkas', f)} galat={form.errors.berkas} label="Scan dokumen ber-TTD" petunjuk="PDF hasil scan minimal 300 dpi, maksimal 20 MB" />
                        <BacaOtomatis
                            berkas={form.data.berkas}
                            onHasil={(h) => {
                                form.setData((lama) => ({ ...lama, ...h }));
                                setDariAi(Object.keys(h));
                            }}
                        />
                    </div>
                </Panel>
                <Panel judul="2. Periksa metadata">
                    <div className="p-5">
                        <IsianMetadata form={form} kategori={kategori} final dariAi={dariAi} />
                    </div>
                </Panel>
                <Panel judul="3. Tentukan sifat">
                    <div className="p-5">
                        <PilihSifat nilai={form.data.sifat} onPilih={(s) => form.setData('sifat', s)} galat={form.errors.sifat} />
                    </div>
                </Panel>
                <div className="flex flex-wrap justify-end gap-2">
                    <Tombol varian="secondary" onClick={() => simpan(true)} disabled={form.processing}><ListPlus /> Simpan & input lagi</Tombol>
                    <Tombol type="submit" memuat={form.processing}>{!form.processing && <CircleCheck />} Simpan ke arsip</Tombol>
                </div>
                {form.progress && <progress value={form.progress.percentage} max="100" className="h-1 w-full accent-[var(--accent)]" />}
            </form>
        </>
    );
}
