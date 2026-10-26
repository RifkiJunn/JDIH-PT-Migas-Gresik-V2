<?php

namespace App\Http\Middleware;

use App\Enums\Peran;
use App\Models\Category;
use App\Models\Document;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => $user ? [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'peran' => $user->peran,
                    'peran_label' => $user->peran->label(),
                    'divisi' => $user->division?->nama,
                    'input_eksisting' => $user->input_eksisting,
                ],
            ] : null,
            'flash' => fn () => [
                'sukses' => $request->session()->get('sukses'),
                'error' => $request->session()->get('error'),
            ],
            'notifikasi' => fn () => $user ? [
                'belum' => $user->unreadNotifications()->count(),
                'daftar' => $user->notifications()->limit(8)->get()->map(fn ($n) => [
                    'id' => $n->id,
                    'pesan' => $n->data['pesan'],
                    'waktu' => $n->created_at->toIso8601String(),
                    'dibaca' => $n->read_at !== null,
                ]),
            ] : null,
            'antrean' => fn () => $user?->berperan(Peran::Manajer, Peran::Gm) ? Document::antrean($user)->count() : 0,
            // Menu "Dokumen Hukum" di navbar publik.
            'menuKategori' => fn () => $request->is('/', 'dokumen', 'dokumen/*', 'profil')
                ? Category::orderBy('nama')->get(['id', 'nama'])
                : [],
        ];
    }
}
