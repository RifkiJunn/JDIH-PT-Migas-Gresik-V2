#!/bin/sh
set -e

# APP_KEY disimpan di volume storage supaya tetap sama walau container dibuat ulang.
KUNCI=storage/app/private/.app_key
[ -f "$KUNCI" ] || php -r 'echo "base64:".base64_encode(random_bytes(32));' > "$KUNCI"
export APP_KEY="$(cat "$KUNCI")"

# .env container = .env.example, dengan nilai dari compose (environment/env_file) menimpa.
# Perlu ditulis ke berkas karena artisan serve membaca ulang .env di tiap worker.
php -r '
foreach (file(".env.example") as $baris) {
    if (preg_match("/^([A-Z0-9_]+)=/", $baris, $m) && ($v = getenv($m[1])) !== false) {
        $baris = $m[1]."=\"".addcslashes($v, "\"\\\\")."\"\n";
    }
    $isi[] = $baris;
}
file_put_contents(".env", implode("", $isi));
'

# Hanya container web yang menyiapkan database; scheduler langsung jalan.
if [ "$3" = "serve" ]; then
    php artisan migrate --force
    if [ ! -f storage/app/private/.terisi ]; then
        php artisan db:seed --force && touch storage/app/private/.terisi
    fi
fi

exec "$@"
