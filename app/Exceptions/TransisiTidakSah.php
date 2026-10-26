<?php

namespace App\Exceptions;

use RuntimeException;

/** Perpindahan status yang tidak diizinkan. Pesannya ditujukan untuk pengguna. */
class TransisiTidakSah extends RuntimeException {}
