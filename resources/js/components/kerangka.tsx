import { Link } from '@inertiajs/react';
import { CircleAlert, CircleCheck, Moon, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cx, useShared } from '@/lib';

/** Logo berwarna di tema terang; versi putih di tema gelap dan di atas latar navy. */
export function Logo({ sub = 'PT Gresik Migas', putih = false, href = '/' }: { sub?: string; putih?: boolean; href?: string }) {
    return (
        <Link href={href} className="flex items-center gap-3 rounded-lg" aria-label="JDIH PT Gresik Migas, ke beranda">
            <img src="/images/logo.png" alt="" width={27} height={40} className={cx('h-10 w-auto', putih ? 'hidden' : 'dark:hidden')} />
            <img src="/images/logo-putih.png" alt="" width={27} height={40} className={cx('h-10 w-auto', putih ? '' : 'hidden dark:block')} />
            <span className="leading-tight">
                <span className={cx('block text-lg font-bold tracking-tight', putih ? 'text-white' : 'text-primary')}>JDIH PTGM</span>
                <span className={cx('block text-xs', putih ? 'text-white/75' : 'text-muted')}>{sub}</span>
            </span>
        </Link>
    );
}

export function TemaToggle({ className }: { className?: string }) {
    const [gelap, setGelap] = useState(false);
    useEffect(() => setGelap(document.documentElement.dataset.theme === 'dark'), []);

    const ganti = () => {
        const tema = gelap ? 'light' : 'dark';
        const terapkan = () => {
            document.documentElement.dataset.theme = tema;
            setGelap(!gelap);
        };
        // Silang-pudar halus bila peramban mendukung View Transitions.
        document.startViewTransition ? document.startViewTransition(terapkan) : terapkan();
        try {
            localStorage.setItem('tema', tema);
        } catch {
            // Penyimpanan diblokir: tema tetap berganti untuk sesi ini.
        }
    };

    return (
        <button
            type="button"
            onClick={ganti}
            aria-label={gelap ? 'Pakai tema terang' : 'Pakai tema gelap'}
            title={gelap ? 'Tema terang' : 'Tema gelap'}
            className={cx('grid size-10 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-primary/8 hover:text-ink', className)}
        >
            {gelap ? <Sun className="size-[18px]" aria-hidden /> : <Moon className="size-[18px]" aria-hidden />}
        </button>
    );
}

/** Pesan sukses/galat dari server, muncul di pojok dan hilang sendiri. */
export function Flash() {
    const { flash } = useShared();
    const [pesan, setPesan] = useState<{ jenis: 'sukses' | 'error'; teks: string } | null>(null);

    useEffect(() => {
        if (flash?.sukses) setPesan({ jenis: 'sukses', teks: flash.sukses });
        else if (flash?.error) setPesan({ jenis: 'error', teks: flash.error });
    }, [flash]);

    useEffect(() => {
        if (!pesan || pesan.jenis === 'error') return;
        const t = setTimeout(() => setPesan(null), 4500);
        return () => clearTimeout(t);
    }, [pesan]);

    if (!pesan) return null;
    const sukses = pesan.jenis === 'sukses';

    return (
        <div role={sukses ? 'status' : 'alert'} className="anim-muncul fixed right-4 bottom-4 left-4 z-50 ml-auto flex max-w-md items-start gap-3 rounded-xl border border-line bg-bg p-4 shadow-float sm:left-auto">
            {sukses ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> : <CircleAlert className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />}
            <p className="flex-1 text-sm">{pesan.teks}</p>
            <button type="button" onClick={() => setPesan(null)} aria-label="Tutup pesan" className="-m-1 grid size-7 cursor-pointer place-items-center rounded-md text-muted hover:bg-surface hover:text-ink">
                <X className="size-4" />
            </button>
        </div>
    );
}
