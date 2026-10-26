<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LogController extends Controller
{
    public function __invoke(Request $request)
    {
        $aksi = $request->string('aksi')->value();

        return Inertia::render('admin/log', [
            'log' => ActivityLog::with('user')
                ->when($aksi !== '', fn ($q) => $q->where('aksi', $aksi))
                ->latest('id')->paginate(30)->withQueryString()
                ->through(fn (ActivityLog $l) => [
                    'id' => $l->id, 'aksi' => $l->aksi, 'keterangan' => $l->keterangan, 'ip' => $l->ip,
                    'oleh' => $l->user?->name ?? 'Sistem', 'waktu' => $l->created_at->toIso8601String(),
                ]),
            'daftarAksi' => ActivityLog::distinct()->orderBy('aksi')->pluck('aksi'),
            'filter' => ['aksi' => $aksi],
        ]);
    }
}
