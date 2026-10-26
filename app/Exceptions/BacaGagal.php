<?php

namespace App\Exceptions;

use RuntimeException;

/** Baca otomatis tidak berhasil. Pesannya ditujukan untuk pengguna; form tetap bisa diisi manual. */
class BacaGagal extends RuntimeException {}
