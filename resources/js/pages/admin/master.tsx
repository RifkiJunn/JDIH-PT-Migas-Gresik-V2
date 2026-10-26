import { router, useForm } from '@inertiajs/react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { IkonKategori } from '@/components/dokumen';
import { Input, Panel, Tombol } from '@/components/ui';
import { Kepala } from '@/layouts/internal';

type Baris = { id: number; nama: string; documents_count: number; users_count?: number };

export default function Master({ kategori, divisi }: { kategori: Baris[]; divisi: Baris[] }) {
    return (
        <>
            <Kepala judul="Kategori & Divisi" keterangan="Kategori tampil di portal publik dan form pengajuan. Divisi menentukan siapa melihat dokumen internal." />
            <div className="grid gap-6 lg:grid-cols-2">
                <Daftar jenis="kategori" judul="Kategori dokumen" baris={kategori} />
                <Daftar jenis="divisi" judul="Divisi" baris={divisi} />
            </div>
        </>
    );
}

function Daftar({ jenis, judul, baris }: { jenis: 'kategori' | 'divisi'; judul: string; baris: Baris[] }) {
    const tambah = useForm({ nama: '' });
    const [ubah, setUbah] = useState<number | null>(null);

    return (
        <Panel judul={judul}>
            <ul className="divide-y divide-line">
                {baris.map((b) =>
                    ubah === b.id ? (
                        <BarisUbah key={b.id} jenis={jenis} b={b} selesai={() => setUbah(null)} />
                    ) : (
                        <li key={b.id} className="group flex items-center gap-3 px-5 py-2.5">
                            {jenis === 'kategori' && <IkonKategori nama={b.nama} className="size-4 text-primary" />}
                            <span className="flex-1 font-medium">{b.nama}</span>
                            <span className="text-xs text-muted tabular">
                                {b.documents_count} dokumen{b.users_count !== undefined && ` · ${b.users_count} akun`}
                            </span>
                            <Tombol varian="ghost" ukuran="sm" className="size-8 px-0" onClick={() => setUbah(b.id)} aria-label={`Ubah ${b.nama}`}><Pencil /></Tombol>
                            <Tombol
                                varian="ghost"
                                ukuran="sm"
                                className="size-8 px-0 hover:text-danger"
                                aria-label={`Hapus ${b.nama}`}
                                title={b.documents_count || b.users_count ? 'Masih dipakai, tidak bisa dihapus' : undefined}
                                disabled={b.documents_count > 0 || (b.users_count ?? 0) > 0}
                                onClick={() => confirm(`Hapus ${jenis} "${b.nama}"?`) && router.delete(`/admin/master/${jenis}/${b.id}`, { preserveScroll: true })}
                            >
                                <Trash2 />
                            </Tombol>
                        </li>
                    ),
                )}
            </ul>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    tambah.post(`/admin/master/${jenis}`, { preserveScroll: true, onSuccess: () => tambah.reset() });
                }}
                className="flex gap-2 border-t border-line p-3"
            >
                <div className="flex-1">
                    <Input aria-label={`Nama ${jenis} baru`} placeholder={`Tambah ${jenis}…`} value={tambah.data.nama} onChange={(e) => tambah.setData('nama', e.target.value)} aria-invalid={!!tambah.errors.nama} />
                    {tambah.errors.nama && <p className="mt-1 text-sm text-danger">{tambah.errors.nama}</p>}
                </div>
                <Tombol type="submit" varian="secondary" memuat={tambah.processing} disabled={!tambah.data.nama.trim()}>{!tambah.processing && <Plus />} Tambah</Tombol>
            </form>
        </Panel>
    );
}

function BarisUbah({ jenis, b, selesai }: { jenis: string; b: Baris; selesai: () => void }) {
    const form = useForm({ nama: b.nama });
    return (
        <li className="px-5 py-2">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.put(`/admin/master/${jenis}/${b.id}`, { preserveScroll: true, onSuccess: selesai });
                }}
                className="flex items-center gap-2"
            >
                <Input autoFocus aria-label="Nama" value={form.data.nama} onChange={(e) => form.setData('nama', e.target.value)} onKeyDown={(e) => e.key === 'Escape' && selesai()} className="h-9" />
                <Tombol type="submit" ukuran="sm" className="size-9 px-0" aria-label="Simpan" memuat={form.processing}>{!form.processing && <Check />}</Tombol>
                <Tombol varian="ghost" ukuran="sm" className="size-9 px-0" aria-label="Batal" onClick={selesai}><X /></Tombol>
            </form>
            {form.errors.nama && <p className="mt-1 text-sm text-danger">{form.errors.nama}</p>}
        </li>
    );
}
