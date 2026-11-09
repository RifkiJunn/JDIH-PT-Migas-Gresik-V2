<?php

namespace App\Http\Controllers;

use App\Enums\Sifat;
use App\Enums\Status;
use App\Models\Document;
use App\Models\DocumentLog;
use App\Services\DocumentWorkflow;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ApprovalController extends Controller
{
    public function __construct(private DocumentWorkflow $alur) {}

    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('approval/index', [
            'menunggu' => Document::antrean($user)->with('category', 'division', 'pengaju')->oldest('updated_at')->get()->map->ringkas(),
            'riwayat' => DocumentLog::with('document.category', 'document.division', 'document.pengaju')
                ->where('user_id', $user->id)->whereIn('aksi', ['setujui', 'tolak'])
                ->latest('id')->limit(20)->get()
                ->map(fn (DocumentLog $l) => ['id' => $l->id, 'aksi' => $l->aksi, 'catatan' => $l->catatan,
                    'waktu' => $l->created_at->toIso8601String(), 'dokumen' => $l->document->ringkas()]),
            'tab' => $request->boolean('riwayat') ? 'riwayat' : 'antrean',
        ]);
    }

    public function setujui(Request $request, Document $document)
    {
        // Keputusan internal/eksternal hanya diminta di tahap GM.
        $data = $request->validate([
            'sifat' => [Rule::requiredIf($document->status === Status::MenungguGm), 'nullable', Rule::enum(Sifat::class)],
            'catatan' => ['required', 'string', 'max:2000'],
        ], ['sifat.required' => 'Pilih apakah dokumen ini internal atau eksternal.'], ['catatan' => 'alasan']);

        $this->alur->setujui($document, $request->user(), isset($data['sifat']) ? Sifat::from($data['sifat']) : null, $data['catatan']);

        return redirect('/approval')->with('sukses', "Disetujui: {$document->judul}");
    }

    public function tolak(Request $request, Document $document)
    {
        $data = $request->validate(['catatan' => ['required', 'string', 'max:2000']], [], ['catatan' => 'komentar']);

        $this->alur->tolak($document, $request->user(), $data['catatan']);

        return redirect('/approval')->with('sukses', "Dikembalikan untuk revisi: {$document->judul}");
    }
}
