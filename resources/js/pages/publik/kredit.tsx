import { Head } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import { INSTANSI, TIM } from '@/lib';

const inisial = (nama: string) => nama.split(/\s+/).slice(0, 2).map((k) => k[0]).join('').toUpperCase();

export default function Kredit() {
    return (
        <>
            <Head title="Kredit" />
            <div className="border-b border-line bg-surface">
                <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                        <GraduationCap className="size-4" aria-hidden /> {INSTANSI.pengembang}
                    </p>
                    <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Tim pengembang</h1>
                    <p className="mt-3 text-lg leading-relaxed text-muted">
                        JDIH {INSTANSI.nama} dikembangkan oleh mahasiswa {INSTANSI.pengembang} sebagai proyek capstone, bekerja sama dengan {INSTANSI.nama}.
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
                <ul className="grid gap-3 sm:grid-cols-2">
                    {TIM.map((t, i) => (
                        <li key={i} className="flex items-center gap-4 rounded-xl border border-line bg-bg p-4">
                            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary" aria-hidden>
                                {inisial(t.nama)}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate font-semibold">{t.nama}</span>
                                <span className="block text-sm text-muted">{t.peran}{t.nim && ` · ${t.nim}`}</span>
                                {t.github && (
                                    <a href={`https://github.com/${t.github}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-link hover:underline">
                                        @{t.github}
                                    </a>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}
