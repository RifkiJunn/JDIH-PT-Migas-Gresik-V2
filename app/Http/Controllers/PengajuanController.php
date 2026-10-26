<?php

namespace App\Http\Controllers;

use App\Enums\Sifat;
use App\Enums\Status;
use App\Exceptions\TransisiTidakSah;
use App\Models\Category;
use App\Models\Document;
use App\Services\DocumentWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/** Modul I dari sisi karyawan: draf, ajukan, revisi, batalkan, upload scan TTD. */
class PengajuanController extends Controller
{
    public function __construct(private DocumentWorkflow $alur) {}

    public function index(Request $request)
    {
        $status = $request->string('status')->value();

        $dokumen = Document::where('submitted_by', $request->user()->id)
            ->when($status === 'perlu_tindakan', fn ($q) => $q->whereIn('status', [Status::Revisi, Status::MenungguTtd]))
            ->when($status === 'menunggu_manajer', fn ($q) => $q->whereIn('status', [Status::MenungguManajer, Status::MenungguGm]))
            ->when(Status::tryFrom($status) && $status !== 'menunggu_manajer', fn ($q) => $q->where('status', $status))
            ->saring($request->only('q'))
            ->with('category', 'division', 'pengaju')
            ->latest('updated_at')
            ->paginate(15)->withQueryString()
            ->through(fn (Document $d) => $d->ringkas());

        return Inertia::render('pengajuan/index', ['dokumen' => $dokumen, 'filter' => $request->only('q', 'status')]);
    }

    public function create()
    {
        return Inertia::render('pengajuan/form', ['dokumen' => null, 'kategori' => Category::orderBy('nama')->get(['id', 'nama'])]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(Document::aturan($request) + [
            'sifat' => ['required', Rule::enum(Sifat::class)],
            'berkas' => ['required', ...Document::ATURAN_BERKAS],
        ]);

        $dok = Document::create([
            ...collect($data)->except('berkas')->all(),
            'division_id' => $request->user()->division_id,
            'submitted_by' => $request->user()->id,
            'berkas_draf' => $request->file('berkas')->store('dokumen'),
        ]);
        $dok->logs()->create(['user_id' => $request->user()->id, 'aksi' => 'buat']);

        return $this->lanjut($request, $dok);
    }

    public function edit(Document $document)
    {
        Gate::authorize('update', $document);

        return Inertia::render('pengajuan/form', [
            'dokumen' => $document->load('category', 'division', 'pengaju')->ringkas() + ['abstrak' => $document->abstrak],
            'kategori' => Category::orderBy('nama')->get(['id', 'nama']),
            'catatan' => $document->logs()->where('aksi', 'tolak')->latest('id')->value('catatan'),
        ]);
    }

    public function update(Request $request, Document $document)
    {
        Gate::authorize('update', $document);

        $data = $request->validate(Document::aturan($request) + [
            'sifat' => ['required', Rule::enum(Sifat::class)],
            'berkas' => ['nullable', ...Document::ATURAN_BERKAS],
        ]);

        $lama = $document->berkas_draf;
        $data = collect($data)->except('berkas')->all();
        if ($request->hasFile('berkas')) {
            $data['berkas_draf'] = $request->file('berkas')->store('dokumen');
        }

        $this->tanpaYatim($data['berkas_draf'] ?? null, fn () => $this->alur->ubah($document, $request->user(), $data));
        if (isset($data['berkas_draf'])) {
            Storage::delete($lama);
        }

        return $this->lanjut($request, $document);
    }

    public function destroy(Document $document)
    {
        abort_unless(Gate::allows('update', $document) && $document->status === Status::Draf, 403);

        Storage::delete($document->berkas_draf);
        $document->delete();

        return redirect('/pengajuan')->with('sukses', 'Draf dihapus.');
    }

    public function ajukan(Request $request, Document $document)
    {
        $this->alur->ajukan($document, $request->user());

        return back()->with('sukses', 'Pengajuan dikirim ke Manajer.');
    }

    public function batalkan(Request $request, Document $document)
    {
        $this->alur->batalkan($document, $request->user());

        return back()->with('sukses', 'Pengajuan dibatalkan.');
    }

    /** Langkah 5–8 Modul I: scan ber-TTD + metadata final hasil koreksi. */
    public function selesaikan(Request $request, Document $document)
    {
        Gate::authorize('finalize', $document);

        $data = $request->validate(Document::aturan($request, final: true) + ['berkas' => ['required', ...Document::ATURAN_BERKAS]]);
        $berkas = $request->file('berkas');
        $path = $berkas->store('dokumen');

        $this->tanpaYatim($path, fn () => $this->alur->selesaikan($document, $request->user(), [
            ...collect($data)->except('berkas')->all(),
            'berkas_final' => $path,
            'berkas_ukuran' => $berkas->getSize(),
        ]));

        return back()->with('sukses', $document->sifat === Sifat::Eksternal
            ? 'Dokumen selesai dan sudah tampil di portal JDIH.'
            : 'Dokumen selesai dan tersimpan di arsip divisi.');
    }

    /** Berkas yang baru diunggah dihapus lagi bila perpindahan status ditolak, supaya tidak ada berkas yatim. */
    private function tanpaYatim(?string $path, callable $aksi): void
    {
        try {
            $aksi();
        } catch (TransisiTidakSah $e) {
            if ($path) {
                Storage::delete($path);
            }
            throw $e;
        }
    }

    /** Tombol "Kirim untuk approval" menyimpan lalu langsung mengajukan; "Simpan draf" hanya menyimpan. */
    private function lanjut(Request $request, Document $dok)
    {
        if ($request->boolean('ajukan')) {
            try {
                $this->alur->ajukan($dok, $request->user());
            } catch (TransisiTidakSah $e) {
                // Draf sudah tersimpan; jangan kembali ke form supaya tidak terbuat dua kali.
                return redirect("/arsip/{$dok->id}")->with('error', 'Draf tersimpan, tetapi belum bisa diajukan. '.$e->getMessage());
            }

            return redirect("/arsip/{$dok->id}")->with('sukses', 'Pengajuan dikirim ke Manajer.');
        }

        return redirect("/arsip/{$dok->id}")->with('sukses', 'Draf disimpan.');
    }
}
