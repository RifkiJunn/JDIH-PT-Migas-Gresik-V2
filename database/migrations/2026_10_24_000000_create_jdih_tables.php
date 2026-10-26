<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('divisions', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 100)->unique();
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 100)->unique();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('peran', 20)->default('karyawan');
            $table->foreignId('division_id')->nullable()->constrained()->restrictOnDelete();
            // Karyawan yang ditunjuk Admin untuk Modul II (input dokumen eksisting).
            $table->boolean('input_eksisting')->default(false);
            $table->boolean('aktif')->default(true);
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->string('nomor', 150)->nullable()->index();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->foreignId('division_id')->constrained()->restrictOnDelete();
            $table->string('sifat', 20);
            $table->string('status', 30)->default('draf');
            $table->string('sumber', 20)->default('pengajuan');
            $table->text('abstrak')->nullable();
            $table->date('tanggal_surat')->nullable();
            $table->date('tanggal_berlaku')->nullable();
            $table->date('tanggal_berakhir')->nullable()->index();
            $table->string('berkas_draf')->nullable();
            $table->string('berkas_final')->nullable();
            $table->unsignedInteger('berkas_ukuran')->nullable();
            $table->unsignedInteger('dilihat')->default(0);
            $table->foreignId('submitted_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('selesai_pada')->nullable();
            $table->timestamp('diingatkan_pada')->nullable();
            $table->timestamps();

            $table->index(['status', 'sifat']);
        });

        Schema::create('document_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('aksi', 30);
            $table->text('catatan')->nullable();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('aksi', 30)->index();
            $table->string('keterangan');
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('document_logs');
        Schema::dropIfExists('documents');
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('division_id');
            $table->dropColumn(['peran', 'input_eksisting', 'aktif']);
        });
        Schema::dropIfExists('categories');
        Schema::dropIfExists('divisions');
    }
};
