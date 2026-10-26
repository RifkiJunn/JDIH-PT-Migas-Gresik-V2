<?php

namespace App\Http\Controllers;

use App\Enums\Peran;
use App\Enums\Status;
use App\Models\Category;
use App\Models\Division;
use App\Models\Document;
use App\Models\DocumentLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

/** Arsip internal (dokumen selesai yang boleh dilihat akun ini) dan halaman detail internal untuk semua status. */
class ArsipController extends Controller
{
    public function index(Request $request)
    {
        return $this->daftar($request, 'arsip', $request->only('q', 'kategori', 'tahun', 'divisi', 'sifat', 'masa'));
    }

    public function akanBerakhir(Request $request)
    {
        // "semua" tidak dikenal saring(), jadi tidak membatasi masa berlaku.
        return $this->daftar($request, 'akan-berakhir', [...$request->only('q', 'kategori', 'divisi'), 'masa' => $request->query('masa', 'akan_berakhir')]);
    }

    private function daftar(Request $request, string $halaman, array $filter)
    {
        $user = $request->user();

        $dokumen = Document::arsipUntuk($user)->saring($filter)
            ->with('category', 'division', 'pengaju')
            ->when($halaman === 'akan-berakhir', fn ($q) => $q->orderByRaw('tanggal_berakhir IS NULL')->orderBy('tanggal_berakhir'), fn ($q) => $q->latest('selesai_pada'))
            ->paginate(15)->withQueryString()
            ->through(fn (Document $d) => $d->ringkas());

        return Inertia::render('arsip/index', [
            'halaman' => $halaman,
            'dokumen' => $dokumen,
            'filter' => array_filter($filter, fn ($v) => $v !== null),
            'kategori' => Category::orderBy('nama')->get(['id', 'nama']),
            // Pilihan divisi hanya untuk yang melihat lintas divisi.
            'divisi' => $user->berperan(Peran::Gm, Peran::Admin) ? Division::orderBy('nama')->get(['id', 'nama']) : [],
        ]);
    }

    public function show(Request $request, Document $document)
    {
        Gate::authorize('view', $document);
        $user = $request->user();
        $document->load('category', 'division', 'pengaju');

        return Inertia::render('arsip/show', [
            'dokumen' => $document->ringkas() + [
                'abstrak' => $document->abstrak,
                'sumber' => $document->sumber,
                'berkas_ukuran' => $document->berkas_ukuran,
                'selesai_pada' => $document->selesai_pada?->toIso8601String(),
            ],
            'riwayat' => $document->logs()->with('user')->get()->map(fn (DocumentLog $l) => [
                'id' => $l->id,
                'aksi' => $l->aksi,
                'catatan' => $l->catatan,
                'oleh' => $l->user->name,
                'peran' => $l->user->peran->label(),
                'waktu' => $l->created_at->toIso8601String(),
            ]),
            'boleh' => [
                'ubah' => $user->can('update', $document),
                'hapus' => $user->can('update', $document) && $document->status === Status::Draf,
                'batalkan' => $user->can('cancel', $document),
                'putus' => $user->can('decide', $document),
                'putus_gm' => $user->can('decide', $document) && $document->status === Status::MenungguGm,
                'selesaikan' => $user->can('finalize', $document),
                'unduh' => $user->can('download', $document),
            ],
            'kategori' => $user->can('finalize', $document) ? Category::orderBy('nama')->get(['id', 'nama']) : [],
        ]);
    }
}
