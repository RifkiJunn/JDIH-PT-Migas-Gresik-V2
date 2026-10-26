<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function create()
    {
        return Inertia::render('auth/login');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ], [], ['password' => 'password']);

        // Lima kali salah untuk satu email dari satu IP: tunggu (NFR-01).
        $kunci = 'login|'.mb_strtolower($data['email']).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($kunci, 5)) {
            throw ValidationException::withMessages([
                'email' => 'Terlalu banyak percobaan. Coba lagi dalam '.RateLimiter::availableIn($kunci).' detik.',
            ]);
        }

        if (! Auth::attempt([...$data, 'aktif' => true], $request->boolean('ingat'))) {
            RateLimiter::hit($kunci, 300);
            throw ValidationException::withMessages(['email' => 'Email atau password salah, atau akun tidak aktif.']);
        }

        RateLimiter::clear($kunci);
        $request->session()->regenerate();
        ActivityLog::catat('login', 'Masuk ke sistem');

        return redirect()->intended('/dashboard');
    }

    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
