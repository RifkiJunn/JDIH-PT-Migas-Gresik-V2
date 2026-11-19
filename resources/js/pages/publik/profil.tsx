import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Mail, MapPin, Phone, Plus } from 'lucide-react';
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { INSTANSI } from '@/lib';
import type { Opsi } from '@/types';

const BAGIAN = [
    ['tentang', 'Profil JDIH'],
    ['dasar-hukum', 'Dasar Hukum'],
    ['kontak', 'Kontak'],
    ['faq', 'FAQ'],
    ['privasi', 'Privasi'],
] as const;

const FAQ = [
    ['Dokumen apa saja yang ada di JDIH PTGM?', 'Dokumen legal perusahaan yang sudah disetujui General Manager untuk dibuka ke publik, seperti surat keputusan, kontrak, MOU/PKS, dan berita acara.'],
    ['Apakah saya perlu mendaftar untuk mengunduh?', 'Tidak. Semua dokumen di portal ini bisa dicari, dibaca, dan diunduh tanpa akun.'],
    ['Apa arti status Berlaku, Akan berakhir, dan Berakhir?', 'Status mengikuti tanggal berakhir dokumen. "Akan berakhir" berarti masa berlakunya habis dalam 30 hari ke depan.'],
    ['Dokumen yang saya cari tidak ada.', 'Tidak semua dokumen perusahaan bersifat publik. Untuk permintaan informasi, hubungi kami lewat kontak di halaman ini.'],
];

export default function Profil({ kategori }: { kategori: Opsi[] }) {
    return (
        <>
            <Head title="Tentang" />
            <div className="border-b border-line bg-surface">
                <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
                    <h1 className="text-2xl font-bold sm:text-3xl">Tentang Kami</h1>
                    <p className="mt-3 text-lg leading-relaxed text-muted">
                        Jaringan Dokumentasi dan Informasi Hukum {INSTANSI.nama}: satu tempat untuk menemukan dokumen hukum perusahaan yang terbuka untuk masyarakat.
                    </p>
                </div>
            </div>

            <NavBagian />

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

                <Link href="/kredit" className="group flex items-center justify-between gap-4 rounded-xl border border-line p-5 transition-colors hover:border-primary/40 hover:bg-surface">
                    <span>
                        <span className="block font-semibold">Tim pengembang</span>
                        <span className="text-sm text-muted">Dikembangkan oleh mahasiswa {INSTANSI.pengembang}.</span>
                    </span>
                    <ArrowRight className="size-5 shrink-0 text-muted transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden />
                </Link>
            </div>
        </>
    );
}

/** Navigasi antarbagian: menempel di bawah header, penanda aktif bergeser mengikuti bagian yang sedang dibaca. */
function NavBagian() {
    const [aktif, setAktif] = useState<string>(BAGIAN[0][0]);
    const [penanda, setPenanda] = useState<{ x: number; w: number } | null>(null);
    const nav = useRef<HTMLElement>(null);

    useEffect(() => {
        const amati = new IntersectionObserver(
            (entri) => entri.forEach((e) => e.isIntersecting && setAktif(e.target.id)),
            { rootMargin: '-35% 0px -60% 0px' },
        );
        BAGIAN.forEach(([id]) => { const el = document.getElementById(id); if (el) amati.observe(el); });
        // Bagian terakhir terlalu pendek untuk melewati garis pengamat: aktifkan saat halaman mentok bawah.
        const mentok = () => innerHeight + scrollY >= document.body.scrollHeight - 4 && setAktif(BAGIAN.at(-1)![0]);
        addEventListener('scroll', mentok, { passive: true });
        return () => { amati.disconnect(); removeEventListener('scroll', mentok); };
    }, []);

    useLayoutEffect(() => {
        const ukur = () => {
            const el = nav.current?.querySelector<HTMLElement>(`[data-id="${aktif}"]`);
            if (!el) return;
            setPenanda({ x: el.offsetLeft, w: el.offsetWidth });
            // Di layar sempit, tab aktif digeser agar terlihat.
            nav.current!.scrollTo({ left: el.offsetLeft - 16, behavior: 'smooth' });
        };
        ukur();
        window.addEventListener('resize', ukur);
        return () => window.removeEventListener('resize', ukur);
    }, [aktif]);

    return (
        <div className="sticky top-16 z-20 border-b border-line bg-bg/90 backdrop-blur-md">
            <nav ref={nav} aria-label="Bagian halaman" className="relative mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-6">
                {penanda && (
                    <span
                        aria-hidden
                        className="absolute top-2 bottom-2 left-0 rounded-full bg-primary transition-[transform,width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                        style={{ width: penanda.w, transform: `translateX(${penanda.x}px)` }}
                    />
                )}
                {BAGIAN.map(([id, label]) => (
                    <a
                        key={id}
                        data-id={id}
                        href={`#${id}`}
                        aria-current={aktif === id ? 'location' : undefined}
                        onClick={(e) => {
                            e.preventDefault();
                            setAktif(id);
                            const halus = !matchMedia('(prefers-reduced-motion: reduce)').matches;
                            document.getElementById(id)?.scrollIntoView({ behavior: halus ? 'smooth' : 'auto' });
                            history.replaceState(history.state, '', `#${id}`);
                        }}
                        className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-[color,background-color,transform] duration-200 ease-out active:scale-[0.97] ${
                            aktif === id ? 'text-on-primary' : 'text-muted [@media(hover:hover)]:hover:bg-surface-2 [@media(hover:hover)]:hover:text-ink'
                        }`}
                    >
                        {label}
                    </a>
                ))}
            </nav>
        </div>
    );
}

function Bagian({ id, judul, children }: { id: string; judul: string; children: ReactNode }) {
    return (
        <section id={id} aria-labelledby={`${id}-judul`} className="scroll-mt-36">
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
