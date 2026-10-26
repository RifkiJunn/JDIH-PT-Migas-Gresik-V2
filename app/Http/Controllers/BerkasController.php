<?php

namespace App\Http\Controllers;

use App\Enums\Sifat;
use App\Models\ActivityLog;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

/** Satu-satunya jalan ke berkas. Berkas ada di disk privat, jadi tidak bisa dibuka lewat URL langsung (NFR-03). */
class BerkasController extends Controller
{
    public function __invoke(Request $request, Document $document)
    {
        Gate::authorize('download', $document);

        $path = $document->berkas();
        abort_unless($path && Storage::exists($path), 404, 'Berkas tidak ditemukan.');

        $unduh = $request->boolean('unduh');
        if ($unduh && $document->sifat === Sifat::Internal) {
            ActivityLog::catat('unduh', "Unduh dokumen internal \"{$document->judul}\"");
        }

        $nama = str($document->nomor ?: $document->judul)->slug()->limit(80, '')->append('.pdf')->value();

        return Storage::response($path, $nama, [
            // Berkas internal tidak boleh tertinggal di cache peramban komputer bersama.
            'Cache-Control' => $document->sifat === Sifat::Internal ? 'no-store, private' : 'public, max-age=600',
            'X-Content-Type-Options' => 'nosniff',
        ], $unduh ? 'attachment' : 'inline');
    }
}
