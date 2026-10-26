export type Peran = 'karyawan' | 'manajer' | 'gm' | 'admin';
export type Status = 'draf' | 'menunggu_manajer' | 'revisi' | 'menunggu_gm' | 'menunggu_ttd' | 'selesai' | 'ditolak';
export type Masa = 'berlaku' | 'akan_berakhir' | 'berakhir';
export type Sifat = 'internal' | 'eksternal';

/** Bentuk Document::ringkas() di server. */
export type Dokumen = {
    id: number;
    judul: string;
    nomor: string | null;
    kategori: string;
    divisi: string;
    sifat: Sifat;
    status: Status;
    status_label: string;
    masa: Masa;
    tahun: number | null;
    tanggal_surat: string | null;
    tanggal_berlaku: string | null;
    tanggal_berakhir: string | null;
    pengaju: string;
    diperbarui: string | null;
    abstrak?: string | null;
};

export type Opsi = { id: number; nama: string; jumlah?: number };

export type Halaman<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

export type Shared = {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            peran: Peran;
            peran_label: string;
            divisi: string | null;
            input_eksisting: boolean;
        };
    } | null;
    flash: { sukses: string | null; error: string | null };
    notifikasi: { belum: number; daftar: { id: string; pesan: string; waktu: string; dibaca: boolean }[] } | null;
    antrean: number;
    menuKategori: Opsi[];
    errors: Record<string, string>;
};
