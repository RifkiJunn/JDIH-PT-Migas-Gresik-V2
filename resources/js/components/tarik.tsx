import { type ReactNode, useEffect, useRef, useState } from 'react';
import { cx } from '@/lib';

/** Menu tarik-turun: klik untuk buka, klik di luar atau Esc untuk tutup. */
export function Tarik({ tombol, label, children, lebar = 'w-64', kanan = false }: {
    tombol: (buka: boolean) => ReactNode;
    label: string;
    children: (tutup: () => void) => ReactNode;
    lebar?: string;
    kanan?: boolean;
}) {
    const [buka, setBuka] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!buka) return;
        const luar = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setBuka(false);
        const esc = (e: KeyboardEvent) => e.key === 'Escape' && setBuka(false);
        document.addEventListener('pointerdown', luar);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('pointerdown', luar);
            document.removeEventListener('keydown', esc);
        };
    }, [buka]);

    return (
        <div ref={ref} className="relative">
            <button type="button" aria-expanded={buka} aria-haspopup="true" aria-label={label} onClick={() => setBuka(!buka)} className="cursor-pointer rounded-lg">
                {tombol(buka)}
            </button>
            {buka && (
                <div className={cx('anim-muncul absolute top-full z-40 mt-2 origin-top rounded-xl border border-line bg-bg p-1.5 shadow-float', kanan ? 'right-0' : 'left-0', lebar)}>
                    {children(() => setBuka(false))}
                </div>
            )}
        </div>
    );
}

export const kelasItemMenu = 'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-primary/8 [&_svg]:size-4 [&_svg]:text-muted';
