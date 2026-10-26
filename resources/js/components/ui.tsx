import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, LoaderCircle, X } from 'lucide-react';
import { type ComponentProps, type ReactNode, useEffect, useId, useRef } from 'react';
import { cx } from '@/lib';
import type { Halaman, Masa, Status } from '@/types';

const VARIAN = {
    primary: 'bg-primary text-on-primary hover:bg-primary-hover shadow-sm',
    secondary: 'border border-line bg-bg text-ink hover:bg-surface hover:border-muted/40',
    ghost: 'text-muted hover:bg-primary/8 hover:text-ink',
    danger: 'bg-danger text-bg hover:opacity-90',
    putih: 'bg-white text-[#1B1C3F] hover:bg-white/90 shadow-sm',
};
const UKURAN = { sm: 'h-8 px-3 text-sm gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-6 text-base gap-2', ikon: 'size-10 justify-center' };

type TombolProps = {
    varian?: keyof typeof VARIAN;
    ukuran?: keyof typeof UKURAN;
    memuat?: boolean;
    href?: string;
    prefetch?: boolean;
} & ComponentProps<'button'>;

/** Satu bentuk tombol untuk semua aksi. Dengan `href` menjadi tautan Inertia. */
export function Tombol({ varian = 'primary', ukuran = 'md', memuat, href, prefetch, className, children, disabled, ...props }: TombolProps) {
    const kelas = cx(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg font-medium whitespace-nowrap transition-[background-color,border-color,color,opacity,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        VARIAN[varian],
        UKURAN[ukuran],
        className,
    );
    if (href) {
        return (
            <Link href={href} className={kelas} prefetch={prefetch} aria-label={props['aria-label']} title={props.title}>
                {children}
            </Link>
        );
    }
    return (
        <button type="button" className={kelas} disabled={disabled || memuat} aria-busy={memuat} {...props}>
            {memuat && <LoaderCircle className="animate-spin" aria-hidden />}
            {children}
        </button>
    );
}

export const kelasInput =
    'w-full rounded-lg border border-line bg-bg px-3 text-sm text-ink transition-colors placeholder:text-muted/80 hover:border-muted/50 focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/20 aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-60';

export const Input = ({ className, ...p }: ComponentProps<'input'>) => <input className={cx(kelasInput, 'h-10', className)} {...p} />;
export const Pilih = ({ className, ...p }: ComponentProps<'select'>) => <select className={cx(kelasInput, 'h-10 cursor-pointer pr-8', className)} {...p} />;
export const Teks = ({ className, ...p }: ComponentProps<'textarea'>) => <textarea className={cx(kelasInput, 'min-h-28 py-2.5 leading-relaxed', className)} {...p} />;

/** Label selalu tampil, petunjuk dan galat tepat di bawah kolomnya. */
export function Kolom({ label, galat, petunjuk, wajib, className, children }: {
    label: string;
    galat?: string;
    petunjuk?: ReactNode;
    wajib?: boolean;
    className?: string;
    children: (id: string, attrs: { 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => ReactNode;
}) {
    const id = useId();
    const ket = galat || petunjuk ? `${id}-ket` : undefined;
    return (
        <div className={cx('grid content-start gap-1.5', className)}>
            <label htmlFor={id} className="text-sm font-medium text-ink">
                {label}
                {wajib && <span className="text-danger" aria-hidden> *</span>}
            </label>
            {children(id, { 'aria-invalid': galat ? true : undefined, 'aria-describedby': ket })}
            {galat ? (
                <p id={ket} className="text-sm text-danger">{galat}</p>
            ) : petunjuk ? (
                <p id={ket} className="text-xs leading-relaxed text-muted">{petunjuk}</p>
            ) : null}
        </div>
    );
}

const NADA = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    primary: 'bg-primary',
    accent: 'bg-accent',
    muted: 'bg-muted',
};

/** Warna status selalu disertai teks; teks tetap warna tinta supaya kontrasnya aman di kedua tema. */
export function Lencana({ nada = 'muted', children, className }: { nada?: keyof typeof NADA; children: ReactNode; className?: string }) {
    return (
        <span className={cx('inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-ink', className)}>
            <span className={cx('size-1.5 rounded-full', NADA[nada])} aria-hidden />
            {children}
        </span>
    );
}

const MASA: Record<Masa, [keyof typeof NADA, string]> = {
    berlaku: ['success', 'Berlaku'],
    akan_berakhir: ['warning', 'Akan berakhir'],
    berakhir: ['danger', 'Berakhir'],
};
export const LencanaMasa = ({ masa }: { masa: Masa }) => <Lencana nada={MASA[masa][0]}>{MASA[masa][1]}</Lencana>;

const STATUS: Record<Status, keyof typeof NADA> = {
    draf: 'muted',
    menunggu_manajer: 'warning',
    revisi: 'danger',
    menunggu_gm: 'warning',
    menunggu_ttd: 'accent',
    selesai: 'success',
    ditolak: 'muted',
};
export const LencanaStatus = ({ status, label }: { status: Status; label: string }) => <Lencana nada={STATUS[status]}>{label}</Lencana>;

/** Dialog bawaan peramban: fokus terkunci, Esc menutup, latar bisa diklik untuk menutup. */
export function Dialog({ buka, tutup, judul, lebar = 'max-w-lg', children }: { buka: boolean; tutup: () => void; judul: string; lebar?: string; children: ReactNode }) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const d = ref.current;
        if (!d) return;
        if (buka && !d.open) d.showModal();
        if (!buka && d.open) d.close();
    }, [buka]);

    return (
        <dialog
            ref={ref}
            onClose={tutup}
            onClick={(e) => e.target === ref.current && tutup()}
            className={cx('anim-muncul m-auto w-[calc(100%-2rem)] rounded-2xl border border-line bg-bg p-0 text-ink shadow-float', lebar)}
        >
            {buka && (
                <div className="flex max-h-[85dvh] flex-col">
                    <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
                        <h2 className="text-base font-semibold">{judul}</h2>
                        <Tombol varian="ghost" ukuran="ikon" onClick={tutup} aria-label="Tutup" className="-mr-2 size-9">
                            <X />
                        </Tombol>
                    </div>
                    <div className="overflow-y-auto p-5">{children}</div>
                </div>
            )}
        </dialog>
    );
}

export function Penomoran({ halaman }: { halaman: Halaman<unknown> }) {
    if (halaman.last_page <= 1) return null;
    const [sebelum, ...tengah] = halaman.links;
    const sesudah = tengah.pop()!;
    const panah = (url: string | null, label: string, ikon: ReactNode) =>
        url ? (
            <Link href={url} preserveScroll={false} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-primary/8 hover:text-ink" aria-label={label}>{ikon}</Link>
        ) : (
            <span className="grid size-9 place-items-center rounded-lg text-muted/40" aria-hidden>{ikon}</span>
        );

    return (
        <nav aria-label="Halaman" className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <p className="text-sm text-muted tabular">
                {halaman.from}–{halaman.to} dari {halaman.total}
            </p>
            <div className="flex items-center gap-1">
                {panah(sebelum.url, 'Halaman sebelumnya', <ChevronLeft className="size-4" />)}
                {tengah.map((l, i) =>
                    l.url ? (
                        <Link
                            key={i}
                            href={l.url}
                            aria-current={l.active ? 'page' : undefined}
                            className={cx('hidden h-9 min-w-9 place-items-center rounded-lg px-2 text-sm tabular sm:grid', l.active ? 'bg-primary font-semibold text-on-primary' : 'text-muted hover:bg-primary/8 hover:text-ink')}
                        >
                            {l.label}
                        </Link>
                    ) : (
                        <span key={i} className="hidden px-1 text-muted sm:inline">…</span>
                    ),
                )}
                {panah(sesudah.url, 'Halaman berikutnya', <ChevronRight className="size-4" />)}
            </div>
        </nav>
    );
}

export function Kosong({ ikon, judul, children }: { ikon: ReactNode; judul: string; children?: ReactNode }) {
    return (
        <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-line px-6 py-12 text-center">
            <div className="mb-1 grid size-12 place-items-center rounded-full bg-surface text-muted [&_svg]:size-6">{ikon}</div>
            <p className="font-semibold">{judul}</p>
            {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
        </div>
    );
}

export function Panel({ judul, aksi, children, className }: { judul?: ReactNode; aksi?: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section className={cx('rounded-xl border border-line bg-bg', className)}>
            {judul && (
                <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                    <h2 className="text-[15px] font-semibold">{judul}</h2>
                    {aksi}
                </header>
            )}
            {children}
        </section>
    );
}
