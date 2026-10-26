import { Activity } from 'lucide-react';
import { BarFilter } from '@/components/tabel';
import { Kosong, Panel, Penomoran, Pilih } from '@/components/ui';
import { Kepala } from '@/layouts/internal';
import { AKSI } from '@/lib';
import type { Halaman } from '@/types';

type Log = { id: number; aksi: string; keterangan: string; ip: string | null; oleh: string; waktu: string };

export default function LogAktivitas({ log, daftarAksi, filter }: { log: Halaman<Log>; daftarAksi: string[]; filter: { aksi: string } }) {
    return (
        <>
            <Kepala judul="Log Aktivitas" keterangan="Login, approval, perubahan akun dan peran, unduhan dokumen internal, serta cadangan." />
            <Panel>
                <BarFilter url="/admin/log" filter={{ aksi: filter.aksi || undefined }}>
                    {(ubah) => (
                        <Pilih aria-label="Jenis aktivitas" className="w-auto min-w-44 flex-none" value={filter.aksi} onChange={(e) => ubah('aksi', e.target.value)}>
                            <option value="">Semua aktivitas</option>
                            {daftarAksi.map((a) => <option key={a} value={a}>{AKSI[a] ?? a}</option>)}
                        </Pilih>
                    )}
                </BarFilter>
                {log.data.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-line bg-surface text-left text-xs font-semibold text-muted">
                                <tr>
                                    <th className="px-4 py-3">Waktu</th>
                                    <th className="px-4 py-3">Aktivitas</th>
                                    <th className="px-4 py-3">Oleh</th>
                                    <th className="hidden px-4 py-3 md:table-cell">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {log.data.map((l) => (
                                    <tr key={l.id}>
                                        <td className="px-4 py-2.5 whitespace-nowrap text-muted tabular">{new Date(l.waktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                        <td className="px-4 py-2.5">
                                            <span className="mr-2 rounded-md bg-surface px-1.5 py-0.5 text-xs font-medium text-muted">{AKSI[l.aksi] ?? l.aksi}</span>
                                            {l.keterangan}
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">{l.oleh}</td>
                                        <td className="hidden px-4 py-2.5 text-muted tabular md:table-cell">{l.ip}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-5"><Kosong ikon={<Activity />} judul="Belum ada aktivitas" /></div>
                )}
            </Panel>
            <Penomoran halaman={log} />
        </>
    );
}
