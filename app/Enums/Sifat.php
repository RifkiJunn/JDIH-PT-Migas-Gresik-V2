<?php

namespace App\Enums;

enum Sifat: string
{
    /** Hanya divisi pemilik. */
    case Internal = 'internal';
    /** Tampil di portal JDIH setelah selesai. */
    case Eksternal = 'eksternal';
}
