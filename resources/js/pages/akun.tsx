import { useForm } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { Input, Kolom, Panel, Tombol } from '@/components/ui';
import { Kepala } from '@/layouts/internal';
import { useShared } from '@/lib';

export default function Akun() {
    const user = useShared().auth!.user;
    const form = useForm({ password_lama: '', password: '', password_confirmation: '' });

    return (
        <>
            <Kepala judul="Profil Saya" />
            <div className="grid max-w-3xl gap-6">
                <Panel judul="Data akun">
                    <dl className="grid gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-[140px_1fr]">
                        {([['Nama', user.name], ['Email', user.email], ['Peran', user.peran_label], ['Divisi', user.divisi ?? '–']] as const).map(([k, v]) => (
                            <div key={k} className="contents">
                                <dt className="text-muted">{k}</dt>
                                <dd className="font-medium">{v}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="border-t border-line px-5 py-3 text-xs text-muted">Perubahan nama, email, peran, atau divisi dilakukan oleh Admin.</p>
                </Panel>

                <Panel judul={<span id="password" className="scroll-mt-24">Ganti password</span>}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.put('/akun/password', { preserveScroll: true, onSuccess: () => form.reset() });
                        }}
                        className="grid gap-4 p-5 sm:max-w-md"
                    >
                        <Kolom label="Password lama" galat={form.errors.password_lama}>
                            {(id, a) => <Input id={id} {...a} type="password" autoComplete="current-password" value={form.data.password_lama} onChange={(e) => form.setData('password_lama', e.target.value)} />}
                        </Kolom>
                        <Kolom label="Password baru" galat={form.errors.password} petunjuk="Minimal 8 karakter, berisi huruf dan angka.">
                            {(id, a) => <Input id={id} {...a} type="password" autoComplete="new-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />}
                        </Kolom>
                        <Kolom label="Ulangi password baru">
                            {(id, a) => <Input id={id} {...a} type="password" autoComplete="new-password" value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} />}
                        </Kolom>
                        <Tombol type="submit" memuat={form.processing} className="justify-self-start">{!form.processing && <KeyRound />} Simpan password</Tombol>
                    </form>
                </Panel>
            </div>
        </>
    );
}
