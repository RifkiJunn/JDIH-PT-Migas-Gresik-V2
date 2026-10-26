<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/** Portal JDIH. Selalu memakai visibleTo(null): yang tampil hanya dokumen eksternal yang sudah selesai. */
class PublikController extends Controller
{
    public function beranda(): Response
    {
        $publik = fn () => Document::visibleTo(null)->with('category', 'division', 'pengaju');

        return Inertia::render('publik/beranda', [
            'kategori' => $this->kategori(),
            'terbaru' => $publik()->latest('selesai_pada')->limit(5)->get()->map->ringkas(),
            'terpopuler' => $publik()->orderByDesc('dilihat')->limit(5)->get()->map->ringkas(),
            'tahun' => $this->daftarTahun(),
            'statistik' => [
                'dokumen' => Document::visibleTo(null)->count(),
                'tahun_ini' => Document::visibleTo(null)->whereYear('tanggal_surat', now()->year)->count(),
                'diperbarui' => Document::visibleTo(null)->max('selesai_pada'),
            ],
        ]);
    }

    public function index(Request $request): Response
    {
        $filter = $request->only('q', 'kategori', 'tahun', 'masa', 'urut');

        $dokumen = Document::visibleTo(null)->saring($filter)
            ->with('category', 'division', 'pengaju')
            ->when(($filter['urut'] ?? null) === 'populer', fn ($q) => $q->orderByDesc('dilihat'), fn ($q) => $q->latest('tanggal_surat'))
            ->orderByDesc('id')
            ->paginate(10)->withQueryString()
            ->through(fn (Document $d) => $d->ringkas());

        return Inertia::render('publik/dokumen', [
            'dokumen' => $dokumen,
            'filter' => $filter,
            'kategori' => $this->kategori(),
            'tahun' => $this->daftarTahun(),
        ]);
    }

    public function show(Request $request, Document $document)
    {
        Gate::authorize('view', $document);

        // Dokumen yang tidak publik dibuka lewat ruang internal.
        if (! Gate::forUser(null)->allows('view', $document)) {
            return redirect("/arsip/{$document->id}");
        }

        // Dihitung sekali per sesi; prefetch saat hover tidak ikut menambah.
        if (! $request->header('Purpose') && ! $request->session()->has("dilihat.{$document->id}")) {
            $request->session()->put("dilihat.{$document->id}", true);
            $document->increment('dilihat');
        }

        $document->load('category', 'division', 'pengaju');

        return Inertia::render('publik/detail', [
            'dokumen' => $document->ringkas() + ['abstrak' => $document->abstrak, 'dilihat' => $document->dilihat],
            'terkait' => Document::visibleTo(null)->where('category_id', $document->category_id)->whereKeyNot($document->id)
                ->with('category', 'division', 'pengaju')->latest('tanggal_surat')->limit(4)->get()->map->ringkas(),
        ]);
    }

    public function profil(): Response
    {
        return Inertia::render('publik/profil', ['kategori' => $this->kategori()]);
    }

    /** Kategori beserta jumlah dokumen publiknya (FR-05). */
    private function kategori()
    {
        return Category::orderBy('nama')
            ->withCount(['documents' => fn ($q) => $q->visibleTo(null)])
            ->get(['id', 'nama'])
            ->map(fn (Category $k) => ['id' => $k->id, 'nama' => $k->nama, 'jumlah' => $k->documents_count]);
    }

    private function daftarTahun()
    {
        return Document::visibleTo(null)->whereNotNull('tanggal_surat')->pluck('tanggal_surat')
            ->map(fn ($t) => $t->year)->unique()->sortDesc()->values();
    }
}
