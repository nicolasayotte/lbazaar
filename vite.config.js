import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin'

export default defineConfig({
    plugins: [
        react(),
        laravel({
            input: [
                'resources/sass/app.scss',
                'resources/js/app.jsx',
            ],
            refresh: true,
        }),
    ],
    server: {
        host: '0.0.0.0',
        hmr: {
            host: 'lbazaar.test',
        },
        watch: {
            // Tell Vite to ignore watching the vendor and node_modules directories
            ignored: ['**/vendor/**', '**/node_modules/**'],
        },
        port: 5175
    },
});
