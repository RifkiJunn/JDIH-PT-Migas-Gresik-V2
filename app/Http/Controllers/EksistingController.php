<?php

namespace App\Http\Controllers;

use App\Enums\Sifat;
use App\Enums\Status;
use App\Models\Category;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/** Modul II: dokumen lama yang sudah ber-TTD langsung masuk arsip, tanpa approval. */
class EksistingController extends Controller
{
    public function create(Request $request)
    {
        abort_unless($request->user()->input_eksisting, 403, 'Akun Anda belum ditunjuk untuk input dokumen eksisting.');

        return Inertia::render('eksisting/form', ['kategori' => Category::orderBy('nama')->get(['id', 'nama'])]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->input_eksisting, 403);

        $data = $request->validate(Document::aturan($request, final: true) + [
            'sifat' => ['required', Rule::enum(Sifat::class)],
            'berkas' => ['required', ...Document::ATURAN_BERKAS],
        ]);
        $berkas = $request->file('berkas');

        $dok = Document::create([
            ...collect($data)->except('berkas')->all(),
            'status' => Status::Selesai,
            'sumber' => 'eksisting',
            'division_id' => $request->user()->division_id,
            'submitted_by' => $request->user()->id,
            'berkas_final' => $berkas->store('dokumen'),
            'berkas_ukuran' => $berkas->getSize(),
            'selesai_pada' => now(),
        ]);
        $dok->logs()->create(['user_id' => $request->user()->id, 'aksi' => 'eksisting']);

        return redirect($request->boolean('lagi') ? '/eksisting' : "/arsip/{$dok->id}")
            ->with('sukses', "Tersimpan: {$dok->judul}");
    }
}
