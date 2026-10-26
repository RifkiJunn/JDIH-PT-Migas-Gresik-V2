import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, EyeOff, LogIn } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { TemaToggle } from '@/components/kerangka';
import { Input, Kolom, Tombol } from '@/components/ui';
import { INSTANSI } from '@/lib';

export default function Login() {
    const form = useForm({ email: '', password: '', ingat: false });
    const [lihat, setLihat] = useState(false);

    const masuk = (e: FormEvent) => {
        e.preventDefault();
        form.post('/login', { onFinish: () => form.reset('password') });
    };

    return (
        <div className="relative isolate grid min-h-dvh place-items-center bg-surface px-4 py-10">
            <Head title="Masuk" />
            <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(125deg,var(--hero-from)_15%,var(--hero-to))]" aria-hidden />
            <div className="absolute top-4 right-4 flex items-center gap-1 text-white">
                <TemaToggle className="text-white/85 hover:bg-white/10 hover:text-white" />
            </div>
            <Link href="/" className="absolute top-5 left-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/85 hover:text-white sm:left-6">
                <ArrowLeft className="size-4" aria-hidden /> Portal JDIH
            </Link>

            <main className="anim-muncul w-full max-w-sm rounded-2xl border border-line bg-bg p-7 shadow-float sm:p-8">
                <div className="grid justify-items-center text-center">
                    <img src="/images/logo.png" alt="" width={41} height={60} className="h-15 w-auto dark:hidden" />
                    <img src="/images/logo-putih.png" alt="" width={41} height={60} className="hidden h-15 w-auto dark:block" />
                    <h1 className="mt-4 text-xl font-bold">Masuk ke JDIH PTGM</h1>
                    <p className="mt-1 text-sm text-muted">Ruang internal pengajuan dan arsip dokumen</p>
                </div>

                <form onSubmit={masuk} className="mt-7 grid gap-4" noValidate>
                    <Kolom label="Email" galat={form.errors.email}>
                        {(id, a) => <Input id={id} {...a} type="email" autoComplete="username" autoFocus required value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />}
                    </Kolom>
                    <Kolom label="Password" galat={form.errors.password}>
                        {(id, a) => (
                            <div className="relative">
                                <Input id={id} {...a} type={lihat ? 'text' : 'password'} autoComplete="current-password" required className="pr-11" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                                <button type="button" onClick={() => setLihat(!lihat)} aria-label={lihat ? 'Sembunyikan password' : 'Tampilkan password'} className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center text-muted hover:text-ink">
                                    {lihat ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        )}
                    </Kolom>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                        <input type="checkbox" className="size-4 cursor-pointer accent-[var(--primary)]" checked={form.data.ingat} onChange={(e) => form.setData('ingat', e.target.checked)} />
                        Ingat saya di perangkat ini
                    </label>
                    <Tombol type="submit" ukuran="lg" memuat={form.processing} className="mt-1 w-full">
                        {!form.processing && <LogIn />} Masuk
                    </Tombol>
                </form>
                <p className="mt-6 text-center text-xs text-muted">Lupa password? Hubungi Admin untuk direset.</p>
            </main>
            <p className="mt-6 text-xs text-muted">© {new Date().getFullYear()} {INSTANSI.nama} · Developed by {INSTANSI.pengembang}</p>
        </div>
    );
}
