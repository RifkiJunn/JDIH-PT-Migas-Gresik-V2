import { useForm } from '@inertiajs/react';
import { Pencil, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { BarFilter } from '@/components/tabel';
import { Dialog, Input, Kolom, Kosong, Lencana, Panel, Penomoran, Pilih, Tombol } from '@/components/ui';
import { Kepala } from '@/layouts/internal';
import type { Halaman, Opsi, Peran } from '@/types';

type Akun = { id: number; name: string; email: string; peran: Peran; peran_label: string; division_id: number | null; divisi: string | null; input_eksisting: boolean; aktif: boolean };

const PERAN: [Peran, string][] = [['karyawan', 'Karyawan'], ['manajer', 'Manajer'], ['gm', 'GM'], ['admin', 'Admin']];

export default function KelolaAkun({ akun, divisi, filter }: { akun: Halaman<Akun>; divisi: Opsi[]; filter: { q: string } }) {
    const [edit, setEdit] = useState<Akun | 'baru' | null>(null);

    return (
        <>
            <Kepala judul="Kelola Akun" keterangan="Akun internal, peran, divisi, dan penunjukan input dokumen eksisting." aksi={<Tombol onClick={() => setEdit('baru')}><UserPlus /> Tambah akun</Tombol>} />
            <Panel>
                <BarFilter url="/admin/akun" filter={filter} />
                {akun.data.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-line bg-surface text-left text-xs font-semibold text-muted">
                                <tr>
                                    <th className="px-4 py-3">Nama</th>
                                    <th className="px-4 py-3">Peran</th>
                                    <th className="hidden px-4 py-3 md:table-cell">Divisi</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3"><span className="sr-only">Aksi</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {akun.data.map((a) => (
                                    <tr key={a.id} className="hover:bg-surface">
                                        <td className="px-4 py-3">
                                            <span className="block font-medium">{a.name}</span>
                                            <span className="text-xs text-muted">{a.email}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {a.peran_label}
                                            {a.input_eksisting && <span className="block text-xs text-muted">+ Dokumen eksisting</span>}
                                        </td>
                                        <td className="hidden px-4 py-3 text-muted md:table-cell">{a.divisi ?? '–'}</td>
                                        <td className="px-4 py-3">{a.aktif ? <Lencana nada="success">Aktif</Lencana> : <Lencana>Nonaktif</Lencana>}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Tombol varian="ghost" ukuran="sm" onClick={() => setEdit(a)} aria-label={`Ubah ${a.name}`}><Pencil /> Ubah</Tombol>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-5"><Kosong ikon={<Users />} judul="Akun tidak ditemukan" /></div>
                )}
            </Panel>
            <Penomoran halaman={akun} />
            <Dialog buka={edit !== null} tutup={() => setEdit(null)} judul={edit === 'baru' ? 'Tambah akun' : 'Ubah akun'}>
                {edit && <FormAkun key={edit === 'baru' ? 0 : edit.id} akun={edit === 'baru' ? null : edit} divisi={divisi} selesai={() => setEdit(null)} />}
            </Dialog>
        </>
    );
}

function FormAkun({ akun, divisi, selesai }: { akun: Akun | null; divisi: Opsi[]; selesai: () => void }) {
    const form = useForm({
        name: akun?.name ?? '',
        email: akun?.email ?? '',
        password: '',
        peran: akun?.peran ?? ('karyawan' as Peran),
        division_id: akun?.division_id ? String(akun.division_id) : '',
        input_eksisting: akun?.input_eksisting ?? false,
        aktif: akun?.aktif ?? true,
    });
    const butuhDivisi = form.data.peran === 'karyawan' || form.data.peran === 'manajer';

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const opsi = { preserveScroll: true, onSuccess: selesai };
                akun ? form.put(`/admin/akun/${akun.id}`, opsi) : form.post('/admin/akun', opsi);
            }}
            className="grid gap-4"
        >
            <Kolom label="Nama" galat={form.errors.name} wajib>
                {(id, a) => <Input id={id} {...a} autoFocus value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />}
            </Kolom>
            <Kolom label="Email" galat={form.errors.email} wajib>
                {(id, a) => <Input id={id} {...a} type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />}
            </Kolom>
            <Kolom label={akun ? 'Reset password' : 'Password awal'} galat={form.errors.password} wajib={!akun} petunjuk={akun ? 'Kosongkan bila tidak diganti.' : 'Minimal 8 karakter, huruf dan angka. Sampaikan ke pemilik akun.'}>
                {(id, a) => <Input id={id} {...a} type="text" autoComplete="new-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />}
            </Kolom>
            <div className="grid gap-4 sm:grid-cols-2">
                <Kolom label="Peran" galat={form.errors.peran} wajib>
                    {(id, a) => (
                        <Pilih id={id} {...a} value={form.data.peran} onChange={(e) => form.setData('peran', e.target.value as Peran)}>
                            {PERAN.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Pilih>
                    )}
                </Kolom>
                <Kolom label="Divisi" galat={form.errors.division_id} wajib={butuhDivisi} petunjuk={butuhDivisi ? undefined : 'GM dan Admin tidak berdivisi.'}>
                    {(id, a) => (
                        <Pilih id={id} {...a} disabled={!butuhDivisi} value={butuhDivisi ? form.data.division_id : ''} onChange={(e) => form.setData('division_id', e.target.value)}>
                            <option value="">Pilih divisi…</option>
                            {divisi.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                        </Pilih>
                    )}
                </Kolom>
            </div>
            {form.data.peran === 'karyawan' && (
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 text-sm">
                    <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={form.data.input_eksisting} onChange={(e) => form.setData('input_eksisting', e.target.checked)} />
                    <span>
                        <span className="block font-medium">Ditunjuk input dokumen eksisting</span>
                        <span className="text-muted">Boleh memasukkan dokumen lama ber-TTD langsung ke arsip (Modul II).</span>
                    </span>
                </label>
            )}
            {akun && (
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                    <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={form.data.aktif} onChange={(e) => form.setData('aktif', e.target.checked)} />
                    Akun aktif (bisa login)
                </label>
            )}
            <div className="flex justify-end gap-2 pt-2">
                <Tombol varian="secondary" onClick={selesai}>Batal</Tombol>
                <Tombol type="submit" memuat={form.processing}>Simpan</Tombol>
            </div>
        </form>
    );
}
