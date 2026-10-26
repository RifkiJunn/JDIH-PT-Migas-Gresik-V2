<?php

use App\Http\Controllers\Admin\CadanganController;
use App\Http\Controllers\Admin\LogController;
use App\Http\Controllers\Admin\MasterController;
use App\Http\Controllers\Admin\PenggunaController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\AkunController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\ArsipController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BerkasController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EksistingController;
use App\Http\Controllers\NotifikasiController;
use App\Http\Controllers\PengajuanController;
use App\Http\Controllers\PublikController;
use Illuminate\Support\Facades\Route;

// Portal publik. Hak lihat tiap dokumen tetap diperiksa DocumentPolicy.
Route::get('/', [PublikController::class, 'beranda']);
Route::get('dokumen', [PublikController::class, 'index']);
Route::get('dokumen/{document}', [PublikController::class, 'show']);
Route::get('dokumen/{document}/berkas', BerkasController::class);
Route::get('profil', [PublikController::class, 'profil']);

// Tidak ada tombol login di portal publik (BRD bagian 7); pegawai membuka /login langsung.
Route::middleware('guest')->group(function () {
    Route::get('login', [AuthController::class, 'create'])->name('login');
    Route::post('login', [AuthController::class, 'store'])->middleware('throttle:10,1');
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'destroy']);
    Route::get('dashboard', DashboardController::class);
    Route::get('akan-berakhir', [ArsipController::class, 'akanBerakhir']);
    Route::get('arsip/{document}', [ArsipController::class, 'show']);
    Route::post('notifikasi/baca-semua', [NotifikasiController::class, 'bacaSemua']);
    Route::get('notifikasi/{id}', [NotifikasiController::class, 'buka']);
    Route::get('akun', [AkunController::class, 'show']);
    Route::put('akun/password', [AkunController::class, 'password'])->middleware('throttle:6,1');

    Route::get('arsip', [ArsipController::class, 'index'])->middleware('peran:karyawan,manajer,gm');

    Route::middleware('peran:karyawan')->group(function () {
        Route::get('pengajuan', [PengajuanController::class, 'index']);
        Route::get('pengajuan/baru', [PengajuanController::class, 'create']);
        Route::post('pengajuan', [PengajuanController::class, 'store']);
        Route::get('pengajuan/{document}/ubah', [PengajuanController::class, 'edit']);
        Route::put('pengajuan/{document}', [PengajuanController::class, 'update']);
        Route::delete('pengajuan/{document}', [PengajuanController::class, 'destroy']);
        Route::post('pengajuan/{document}/ajukan', [PengajuanController::class, 'ajukan']);
        Route::post('pengajuan/{document}/batalkan', [PengajuanController::class, 'batalkan']);
        Route::post('pengajuan/{document}/selesaikan', [PengajuanController::class, 'selesaikan']);
        Route::get('eksisting', [EksistingController::class, 'create']);
        Route::post('eksisting', [EksistingController::class, 'store']);
        Route::post('ai/baca', AiController::class)->middleware('throttle:10,1');
    });

    Route::middleware('peran:manajer,gm')->group(function () {
        Route::get('approval', [ApprovalController::class, 'index']);
        Route::post('approval/{document}/setujui', [ApprovalController::class, 'setujui']);
        Route::post('approval/{document}/tolak', [ApprovalController::class, 'tolak']);
    });

    Route::middleware('peran:admin')->prefix('admin')->group(function () {
        Route::get('akun', [PenggunaController::class, 'index']);
        Route::post('akun', [PenggunaController::class, 'store']);
        Route::put('akun/{user}', [PenggunaController::class, 'update']);
        Route::get('master', [MasterController::class, 'index']);
        Route::post('master/{jenis}', [MasterController::class, 'store'])->whereIn('jenis', ['kategori', 'divisi']);
        Route::put('master/{jenis}/{id}', [MasterController::class, 'update'])->whereIn('jenis', ['kategori', 'divisi'])->whereNumber('id');
        Route::delete('master/{jenis}/{id}', [MasterController::class, 'destroy'])->whereIn('jenis', ['kategori', 'divisi'])->whereNumber('id');
        Route::get('cadangan', [CadanganController::class, 'index']);
        Route::post('cadangan', [CadanganController::class, 'store']);
        Route::get('cadangan/{nama}', [CadanganController::class, 'unduh'])->where('nama', 'jdih-[0-9-]+\.zip');
        Route::post('cadangan/pulihkan', [CadanganController::class, 'pulihkan']);
        Route::get('log', LogController::class);
    });
});
