import { Head } from '@inertiajs/react';
import { Mail, MapPin, Phone, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { INSTANSI } from '@/lib';
import type { Opsi } from '@/types';

const FAQ = [
    ['Dokumen apa saja yang ada di JDIH PTGM?', 'Dokumen legal perusahaan yang sudah disetujui General Manager untuk dibuka ke publik, seperti surat keputusan, kontrak, MOU/PKS, dan berita acara.'],
    ['Apakah saya perlu mendaftar untuk mengunduh?', 'Tidak. Semua dokumen di portal ini bisa dicari, dibaca, dan diunduh tanpa akun.'],
    ['Apa arti status Berlaku, Akan berakhir, dan Berakhir?', 'Status mengikuti tanggal berakhir dokumen. "Akan berakhir" berarti masa berlakunya habis dalam 30 hari ke depan.'],
    ['Dokumen yang saya cari tidak ada.', 'Tidak semua dokumen perusahaan bersifat publik. Untuk permintaan informasi, hubungi kami lewat kontak di halaman ini.'],
];

export default function Profil({ kategori }: { kategori: Opsi[] }) {
    return (
        <>
            <Head title="Profil" />
            <div className="border-b border-line bg-surface">
                <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
                    <h1 className="text-2xl font-bold sm:text-3xl">Tentang JDIH PTGM</h1>
                    <p className="mt-3 text-lg leading-relaxed text-muted">
                        Jaringan Dokumentasi dan Informasi Hukum {INSTANSI.nama}: satu tempat untuk menemukan dokumen hukum perusahaan yang terbuka untuk masyarakat.
                    </p>
                </div>
            </div>

            <div className="mx-auto grid max-w-3xl gap-12 px-4 py-10 sm:px-6">
                <Bagian id="tentang" judul="Apa itu JDIH PTGM">
                    <p>
                        JDIH PTGM mengelola dokumen legal {INSTANSI.nama} secara digital dan terpusat. Setiap dokumen melewati persetujuan Manajer dan General Manager
                        sebelum diterbitkan. Dokumen yang ditetapkan bersifat eksternal tampil di portal ini; dokumen internal hanya dapat diakses divisi pemiliknya.
                    </p>
                    <p>Koleksi saat ini mencakup {kategori.map((k) => k.nama).join(', ')}.</p>
                </Bagian>

                <Bagian id="dasar-hukum" judul="Dasar hukum">
                    <ul className="list-disc space-y-2 pl-5">
                        <li>Undang-Undang Nomor 14 Tahun 2008 tentang Keterbukaan Informasi Publik.</li>
                        <li>Peraturan Presiden Nomor 33 Tahun 2012 tentang Jaringan Dokumentasi dan Informasi Hukum Nasional.</li>
                    </ul>
                </Bagian>

                <Bagian id="kontak" judul="Kontak">
                    <ul className="grid gap-3">
                        <Kontak ikon={<MapPin />} label="Alamat">{INSTANSI.alamat}</Kontak>
                        <Kontak ikon={<Mail />} label="Email">{INSTANSI.email ?? 'Segera diumumkan'}</Kontak>
                        <Kontak ikon={<Phone />} label="Telepon">{INSTANSI.telepon ?? 'Segera diumumkan'}</Kontak>
                    </ul>
                </Bagian>

                <Bagian id="faq" judul="Pertanyaan yang sering diajukan">
                    <div className="divide-y divide-line rounded-xl border border-line">
                        {FAQ.map(([t, j]) => (
                            <details key={t} className="group px-5 py-4">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
                                    {t}
                                    <Plus className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-45" aria-hidden />
                                </summary>
                                <p className="mt-2 text-muted">{j}</p>
                            </details>
                        ))}
                    </div>
                </Bagian>

                <Bagian id="privasi" judul="Kebijakan privasi">
                    <p>
                        Portal publik tidak meminta data pribadi dan tidak memakai pelacak pihak ketiga. Peramban hanya menyimpan pilihan tema terang/gelap Anda.
                        Jumlah dilihat dicatat tanpa identitas pengunjung.
                    </p>
                </Bagian>
            </div>
        </>
    );
}

function Bagian({ id, judul, children }: { id: string; judul: string; children: ReactNode }) {
    return (
        <section id={id} aria-labelledby={`${id}-judul`} className="scroll-mt-24">
            <h2 id={`${id}-judul`} className="text-xl font-semibold">{judul}</h2>
            <div className="mt-3 grid gap-3 leading-relaxed text-ink/90">{children}</div>
        </section>
    );
}

function Kontak({ ikon, label, children }: { ikon: ReactNode; label: string; children: ReactNode }) {
    return (
        <li className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary [&_svg]:size-5">{ikon}</span>
            <span>
                <span className="block text-sm text-muted">{label}</span>
                <span className="font-medium">{children}</span>
            </span>
        </li>
    );
}
