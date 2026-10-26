<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Peran;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Division;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

/** FR-09: tambah, ubah, nonaktifkan akun; atur peran, divisi, dan penunjukan Modul II. */
class PenggunaController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q'));

        return Inertia::render('admin/akun', [
            'akun' => User::with('division')
                ->when($q !== '', fn ($b) => $b->where(fn ($w) => $w->whereLike('name', "%{$q}%")->orWhereLike('email', "%{$q}%")))
                ->orderBy('name')->paginate(20)->withQueryString()
                ->through(fn (User $u) => [
                    'id' => $u->id, 'name' => $u->name, 'email' => $u->email,
                    'peran' => $u->peran, 'peran_label' => $u->peran->label(),
                    'division_id' => $u->division_id, 'divisi' => $u->division?->nama,
                    'input_eksisting' => $u->input_eksisting, 'aktif' => $u->aktif,
                ]),
            'divisi' => Division::orderBy('nama')->get(['id', 'nama']),
            'filter' => ['q' => $q],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validasi($request, [
            'email' => ['required', 'email', 'max:255', 'unique:users'],
            'password' => ['required', Password::min(8)->letters()->numbers()],
        ]);

        $user = User::create($data);
        ActivityLog::catat('akun', "Membuat akun {$user->email} sebagai {$user->peran->label()}");

        return back()->with('sukses', "Akun {$user->name} dibuat.");
    }

    public function update(Request $request, User $user)
    {
        $data = $this->validasi($request, [
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user)],
            'password' => ['nullable', Password::min(8)->letters()->numbers()],
            'aktif' => ['boolean'],
        ]);

        if ($user->is($request->user()) && (! ($data['aktif'] ?? true) || $data['peran'] !== Peran::Admin->value)) {
            return back()->with('error', 'Anda tidak bisa menonaktifkan atau menurunkan peran akun sendiri.');
        }

        $lama = $user->peran;
        $user->fill(array_filter($data, fn ($v, $k) => $k !== 'password' || filled($v), ARRAY_FILTER_USE_BOTH));
        // Nonaktif: cookie "ingat saya" yang lama tidak berlaku lagi.
        if (! $user->aktif) {
            $user->setRememberToken(Str::random(60));
        }
        $user->save();

        if ($lama !== $user->peran) {
            ActivityLog::catat('peran', "Mengubah peran {$user->email}: {$lama->label()} → {$user->peran->label()}");
        }

        return back()->with('sukses', "Akun {$user->name} diperbarui.");
    }

    private function validasi(Request $request, array $tambahan): array
    {
        $peran = Peran::tryFrom((string) $request->input('peran'));
        $butuhDivisi = in_array($peran, [Peran::Karyawan, Peran::Manajer], true);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'peran' => ['required', Rule::enum(Peran::class)],
            'division_id' => $butuhDivisi ? ['required', 'integer', 'exists:divisions,id'] : ['nullable'],
            'input_eksisting' => ['boolean'],
            ...$tambahan,
        ], ['division_id.required' => 'Karyawan dan Manajer wajib punya divisi.'], ['name' => 'nama', 'division_id' => 'divisi']);

        // GM dan Admin tidak punya divisi; Modul II hanya untuk Karyawan.
        $data['division_id'] = $butuhDivisi ? $data['division_id'] : null;
        $data['input_eksisting'] = $peran === Peran::Karyawan && ($data['input_eksisting'] ?? false);

        return $data;
    }
}
