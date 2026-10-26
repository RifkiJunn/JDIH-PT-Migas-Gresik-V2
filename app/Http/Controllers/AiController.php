<?php

namespace App\Http\Controllers;

use App\Exceptions\BacaGagal;
use App\Models\Category;
use App\Models\Document;
use App\Services\BacaDokumen;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function __invoke(Request $request, BacaDokumen $ai)
    {
        $request->validate(['berkas' => ['required', ...Document::ATURAN_BERKAS]]);

        try {
            return ['data' => $ai->baca($request->file('berkas')->getRealPath(), Category::orderBy('nama')->get())];
        } catch (BacaGagal $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
