import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import InternalLayout from './layouts/internal';
import PublicLayout from './layouts/publik';

createInertiaApp({
    title: (judul) => (judul ? `${judul} · JDIH PTGM` : 'JDIH PT Gresik Migas'),
    resolve: (nama) => {
        const halaman = import.meta.glob('./pages/**/*.tsx');
        return halaman[`./pages/${nama}.tsx`]() as never;
    },
    // Halaman publik dan internal memakai kerangka berbeda; login berdiri sendiri.
    layout: (nama) => (nama.startsWith('publik/') ? PublicLayout : nama.startsWith('auth/') ? undefined : InternalLayout),
    setup({ el, App, props }) {
        createRoot(el!).render(<App {...props} />);
    },
    progress: { color: '#00A2EA', delay: 120 },
    defaults: {
        prefetch: { cacheFor: '30s', hoverDelay: 60 },
        visitOptions: (_href, options) => ({ viewTransition: options.method === 'get', ...options }),
    },
});
