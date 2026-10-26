import { useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, MessageSquareWarning, Save, Send } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { IsianMetadata, type Metadata, metadataKosong, PilihBerkas, PilihSifat } from '@/components/form-dokumen';
import { Panel, Tombol } from '@/components/ui';
import { Kepala } from '@/layouts/internal';
import { cx, tanggal } from '@/lib';
import type { Dokumen, Opsi, Sifat } from '@/types';

const LANGKAH = ['Upload draf', 'Metadata', 'Kirim'];

/** Modul I langkah 1: draf belum ber-TTD, metadata manual, usulan internal/eksternal. Dipakai juga untuk revisi. */
export default function FormPengajuan({ dokumen, kategori, catatan }: { dokumen: Dokumen | null; kategori: Opsi[]; catatan?: string | null }) {
    const ubah = dokumen !== null;
    const [langkah, setLangkah] = useState(0);
    const form = useForm<Metadata & { sifat: Sifat | ''; berkas: File | null; ajukan: boolean }>({
        ...metadataKosong,
        ...(dokumen && {
            judul: dokumen.judul,
            category_id: String(kategori.find((k) => k.nama === dokumen.kategori)?.id ?? ''),
            nomor: dokumen.nomor ?? '',
            tanggal_surat: dokumen.tanggal_surat ?? '',
            tanggal_berlaku: dokumen.tanggal_berlaku ?? '',
            tanggal_berakhir: dokumen.tanggal_berakhir ?? '',
            abstrak: dokumen.abstrak ?? '',
        }),
        sifat: dokumen?.sifat ?? '',
        berkas: null,
        ajukan: false,
    });

    const bolehLanjut = [ubah || form.data.berkas !== null, form.data.judul.trim() !== '' && form.data.category_id !== '' && form.data.sifat !== ''];

    const [ajukan, setAjukan] = useState(true);
    const kirim = (ajukan: boolean) => (e?: FormEvent) => {
        e?.preventDefault();
        setAjukan(ajukan);
        form.transform((d) => ({ ...d, ajukan, ...(ubah && { _method: 'put' }) }));
        form.post(ubah ? `/pengajuan/${dokumen.id}` : '/pengajuan', {
            forceFormData: true,
            onError: (galat) => setLangkah('berkas' in galat ? 0 : 1),
        });
    };

    const kat = kategori.find((k) => String(k.id) === form.data.category_id)?.nama;

    return (
        <>
            <Kepala judul={ubah ? 'Perbaiki Pengajuan' : 'Ajukan Dokumen'} jejak={[['Pengajuan Saya', '/pengajuan']]} keterangan="Draf diajukan ke Manajer divisi Anda, lalu ke GM. TTD basah dilakukan setelah GM menyetujui." />

            {catatan && (
                <div className="mb-5 flex gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
                    <MessageSquareWarning className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
                    <div>
                        <p className="font-medium">Catatan revisi</p>
                        <p className="mt-0.5 text-sm whitespace-pre-line">{catatan}</p>
                    </div>
                </div>
            )}

            <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Langkah">
                {LANGKAH.map((l, i) => (
                    <li key={l} aria-current={i === langkah ? 'step' : undefined}>
                        <button
                            type="button"
                            disabled={i > langkah && !bolehLanjut.slice(0, i).every(Boolean)}
                            onClick={() => setLangkah(i)}
                            className="group grid w-full cursor-pointer gap-2 text-left disabled:cursor-not-allowed"
                        >
                            <span className={cx('h-1 rounded-full transition-colors duration-300', i <= langkah ? 'bg-primary' : 'bg-line')} />
                            <span className={cx('flex items-center gap-2 text-sm', i === langkah ? 'font-semibold text-ink' : 'text-muted')}>
                                <span className={cx('grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold', i < langkah ? 'bg-primary text-on-primary' : i === langkah ? 'ring-2 ring-primary text-primary' : 'ring-1 ring-line')}>
                                    {i < langkah ? <Check className="size-3.5" /> : i + 1}
                                </span>
                                <span className="truncate">{l}</span>
                            </span>
                        </button>
                    </li>
                ))}
            </ol>

            {/* Enter di langkah awal berarti "Lanjut", bukan kirim. */}
            <form onSubmit={(e) => (langkah < 2 ? (e.preventDefault(), bolehLanjut[langkah] && setLangkah(langkah + 1)) : kirim(true)(e))}>
                <Panel className="p-5 sm:p-6">
                    {langkah === 0 && (
                        <PilihBerkas
                            berkas={form.data.berkas}
                            onPilih={(f) => form.setData('berkas', f)}
                            galat={form.errors.berkas}
                            label={ubah ? 'Ganti draf (opsional)' : 'Draf dokumen'}
                            petunjuk={ubah ? 'Biarkan kosong untuk memakai draf sebelumnya. PDF, maks. 20 MB.' : 'Draf belum ber-TTD. PDF, maksimal 20 MB.'}
                        />
                    )}
                    {langkah === 1 && (
                        <div className="grid gap-6">
                            <IsianMetadata form={form} kategori={kategori} />
                            <PilihSifat judul="Usulan sifat dokumen" nilai={form.data.sifat} onPilih={(s) => form.setData('sifat', s)} galat={form.errors.sifat} />
                            <p className="-mt-3 text-sm text-muted">Keputusan akhir internal atau eksternal ada di GM.</p>
                        </div>
                    )}
                    {langkah === 2 && (
                        <div className="grid gap-5">
                            <p className="text-muted">Periksa kembali sebelum mengirim. Setelah dikirim, pengajuan tidak bisa diubah kecuali dikembalikan untuk revisi.</p>
                            <dl className="grid gap-x-6 gap-y-3 rounded-xl bg-surface p-5 text-sm sm:grid-cols-[160px_1fr]">
                                {([
                                    ['Berkas', form.data.berkas?.name ?? 'Draf sebelumnya'],
                                    ['Judul', form.data.judul],
                                    ['Jenis', kat ?? '–'],
                                    ['Nomor', form.data.nomor || '–'],
                                    ['Tanggal surat', tanggal(form.data.tanggal_surat)],
                                    ['Masa berlaku', `${tanggal(form.data.tanggal_berlaku)} s.d. ${form.data.tanggal_berakhir ? tanggal(form.data.tanggal_berakhir) : 'tidak ditentukan'}`],
                                    ['Usulan sifat', form.data.sifat === 'eksternal' ? 'Eksternal (portal publik)' : 'Internal (divisi)'],
                                ] as const).map(([k, v]) => (
                                    <div key={k} className="contents">
                                        <dt className="text-muted">{k}</dt>
                                        <dd className="font-medium break-words">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}
                </Panel>

                <div className="sticky bottom-0 -mx-4 mt-5 flex flex-wrap justify-between gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
                    {langkah > 0 ? (
                        <Tombol varian="secondary" onClick={() => setLangkah(langkah - 1)}><ArrowLeft /> Kembali</Tombol>
                    ) : (
                        <Tombol varian="ghost" href={ubah ? `/arsip/${dokumen.id}` : '/pengajuan'}>Batal</Tombol>
                    )}
                    {langkah < 2 ? (
                        <Tombol onClick={() => setLangkah(langkah + 1)} disabled={!bolehLanjut[langkah]}>Lanjut <ArrowRight /></Tombol>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            <Tombol varian="secondary" onClick={kirim(false)} memuat={form.processing && !ajukan} disabled={form.processing}><Save /> Simpan draf</Tombol>
                            <Tombol type="submit" memuat={form.processing && ajukan} disabled={form.processing}><Send /> Kirim untuk approval</Tombol>
                        </div>
                    )}
                </div>
                {form.progress && <progress value={form.progress.percentage} max="100" className="mt-3 h-1 w-full accent-[var(--accent)]" />}
            </form>
        </>
    );
}
