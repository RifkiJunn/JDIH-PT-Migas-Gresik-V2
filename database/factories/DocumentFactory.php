<?php

namespace Database\Factories;

use App\Enums\Sifat;
use App\Enums\Status;
use App\Models\Category;
use App\Models\Division;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'judul' => fake()->sentence(6),
            'nomor' => fake()->unique()->numerify('###/PTGM/SK/2026'),
            'category_id' => Category::factory(),
            'division_id' => Division::factory(),
            'sifat' => Sifat::Eksternal,
            'status' => Status::Draf,
            'abstrak' => fake()->paragraph(),
            'tanggal_surat' => fake()->dateTimeBetween('-3 years'),
            'berkas_draf' => 'dokumen/contoh.pdf',
            'submitted_by' => fn (array $a) => User::factory()->create(['division_id' => $a['division_id']]),
        ];
    }

    public function selesai(Sifat $sifat = Sifat::Eksternal): static
    {
        return $this->state([
            'status' => Status::Selesai,
            'sifat' => $sifat,
            'berkas_final' => 'dokumen/contoh-final.pdf',
            'selesai_pada' => now(),
        ]);
    }
}
