<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Division;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/** Kategori dokumen (FR-25) dan divisi: dua daftar nama yang sama bentuknya. */
class MasterController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/master', [
            'kategori' => Category::withCount('documents')->orderBy('nama')->get(['id', 'nama']),
            'divisi' => Division::withCount('documents', 'users')->orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    public function store(Request $request, string $jenis)
    {
        $model = $this->model($jenis);
        $model::create($request->validate(['nama' => ['required', 'string', 'max:100', Rule::unique($model->getTable())]]));

        return back()->with('sukses', ucfirst($jenis).' ditambahkan.');
    }

    public function update(Request $request, string $jenis, int $id)
    {
        $baris = $this->model($jenis)::findOrFail($id);
        $baris->update($request->validate(['nama' => ['required', 'string', 'max:100', Rule::unique($baris->getTable())->ignore($baris)]]));

        return back()->with('sukses', ucfirst($jenis).' diperbarui.');
    }

    public function destroy(string $jenis, int $id)
    {
        $baris = $this->model($jenis)::findOrFail($id);
        if ($baris->documents()->exists() || ($baris instanceof Division && $baris->users()->exists())) {
            return back()->with('error', ucfirst($jenis)." \"{$baris->nama}\" masih dipakai, jadi tidak bisa dihapus.");
        }

        $baris->delete();

        return back()->with('sukses', ucfirst($jenis).' dihapus.');
    }

    private function model(string $jenis): Model
    {
        return $jenis === 'kategori' ? new Category : new Division;
    }
}
