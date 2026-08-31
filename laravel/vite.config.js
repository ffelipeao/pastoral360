import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    publicDir: false,
    plugins: [
        laravel({
            publicDirectory: '../www',
            buildDirectory: 'build',
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/images/pastoral360-favicon.svg',
                'resources/images/icone.png',
                'resources/images/Logo1.png',
            ],
            refresh: true,
        }),
    ],
    build: {
        outDir: '../www/build',
        emptyOutDir: true,
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
