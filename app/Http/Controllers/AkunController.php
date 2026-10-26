<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

/** Profil saya dan ganti password (FR-10). */
class AkunController extends Controller
{
    public function show()
    {
        return Inertia::render('akun');
    }

    public function password(Request $request)
    {
        $data = $request->validate([
            'password_lama' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ], [], ['password_lama' => 'password lama', 'password' => 'password baru']);

        $request->user()->update(['password' => $data['password']]);

        return back()->with('sukses', 'Password diganti.');
    }
}
