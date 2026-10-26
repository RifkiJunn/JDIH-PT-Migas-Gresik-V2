<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Terpasang di seluruh grup web: akun yang dinonaktifkan Admin langsung keluar, termasuk yang masuk lewat
 * cookie "ingat saya". Sebagai `peran:karyawan,manajer`, hanya peran itu yang boleh lewat.
 */
class PastikanPeran
{
    public function handle(Request $request, Closure $next, string ...$peran): Response
    {
        $user = $request->user();

        if ($user && ! $user->aktif) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();

            return redirect('/login')->withErrors(['email' => 'Akun Anda dinonaktifkan. Hubungi Admin.']);
        }

        abort_unless($peran === [] || in_array($user?->peran->value, $peran, true), 403);

        return $next($request);
    }
}
