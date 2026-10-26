<?php

// Hanya aturan yang dipakai aplikasi ini. Aturan lain jatuh ke pesan bawaan bahasa Inggris.
return [
    'after_or_equal' => ':attribute harus sama atau setelah :date.',
    'boolean' => ':attribute harus ya atau tidak.',
    'confirmed' => 'Konfirmasi :attribute tidak cocok.',
    'current_password' => 'Password salah.',
    'date' => ':attribute bukan tanggal yang sah.',
    'email' => ':attribute harus alamat email yang sah.',
    'enum' => ':attribute yang dipilih tidak sah.',
    'exists' => ':attribute yang dipilih tidak ditemukan.',
    'file' => ':attribute harus berupa berkas.',
    'in' => ':attribute yang dipilih tidak sah.',
    'integer' => ':attribute harus berupa angka.',
    'max' => [
        'file' => ':attribute maksimal :max kilobyte.',
        'string' => ':attribute maksimal :max karakter.',
    ],
    'mimes' => ':attribute harus berkas bertipe: :values.',
    'min' => ['string' => ':attribute minimal :min karakter.'],
    'password' => [
        'letters' => ':attribute harus berisi huruf.',
        'numbers' => ':attribute harus berisi angka.',
    ],
    'required' => ':attribute wajib diisi.',
    'required_if' => ':attribute wajib diisi.',
    'string' => ':attribute harus berupa teks.',
    'unique' => ':attribute sudah dipakai.',
    'uploaded' => ':attribute gagal diunggah. Periksa ukuran berkas.',

    'attributes' => [
        'abstrak' => 'abstrak',
        'berkas' => 'berkas',
        'category_id' => 'jenis dokumen',
        'division_id' => 'divisi',
        'judul' => 'judul',
        'konfirmasi' => 'konfirmasi',
        'nama' => 'nama',
        'name' => 'nama',
        'nomor' => 'nomor dokumen',
        'peran' => 'peran',
        'sifat' => 'sifat dokumen',
        'tanggal_berakhir' => 'tanggal berakhir',
        'tanggal_berlaku' => 'tanggal mulai berlaku',
        'tanggal_surat' => 'tanggal surat',
    ],
];
