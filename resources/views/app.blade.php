<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="Jaringan Dokumentasi dan Informasi Hukum PT Gresik Migas">
        {{-- Tema dipasang sebelum CSS dimuat supaya tidak berkedip. Pilihan tersimpan menang atas pengaturan perangkat. --}}
        <script>
            try {
                const t = localStorage.getItem('tema');
                document.documentElement.dataset.theme = t ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            } catch { document.documentElement.dataset.theme = 'light'; }
        </script>
        <link rel="icon" href="/favicon.png" type="image/png">
        @fonts
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head />
    </head>
    <body>
        <x-inertia::app />
    </body>
</html>
