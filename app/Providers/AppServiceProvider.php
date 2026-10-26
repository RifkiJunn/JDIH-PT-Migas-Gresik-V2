<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // NFR-04: semua akses lewat HTTPS di server.
        if ($this->app->isProduction()) {
            URL::forceScheme('https');
        }

        // Saat pengembangan, query N+1 dan atribut yang tidak dimuat langsung ketahuan.
        Model::shouldBeStrict(! $this->app->isProduction());
    }
}
