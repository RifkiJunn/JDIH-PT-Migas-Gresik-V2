# Aset frontend dibangun terpisah supaya image akhir tidak membawa node_modules.
FROM node:22-alpine AS aset
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY vite.config.js tsconfig.json ./
COPY resources resources
RUN npm run build

FROM php:8.5-cli
# poppler-utils dan tesseract untuk baca otomatis PDF (termasuk hasil scan).
RUN apt-get update && apt-get install -y --no-install-recommends \
        poppler-utils tesseract-ocr tesseract-ocr-ind libpq-dev libzip-dev unzip \
    && docker-php-ext-install pdo_pgsql zip \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
# Bawaan PHP hanya 2 MB per upload. Dokumen sampai 50 MB, zip cadangan untuk dipulihkan sampai 1 GB.
RUN echo 'upload_max_filesize=1G' > /usr/local/etc/php/conf.d/upload.ini \
    && echo 'post_max_size=1G' >> /usr/local/etc/php/conf.d/upload.ini

WORKDIR /app
COPY composer.json composer.lock ./
# Paket dev ikut dipasang: seeder demo memakai factory (Faker).
RUN composer install --no-interaction --no-scripts --no-autoloader --prefer-dist
COPY . .
COPY --from=aset /app/public/build public/build
RUN composer dump-autoload --optimize && php artisan package:discover

EXPOSE 8000
ENTRYPOINT ["sh", "docker/mulai.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
