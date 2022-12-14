import React from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/inertia-react";
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import Layout from './layouts/Layout';

createInertiaApp({
    resolve: async name => {
        const page = await resolvePageComponent(
            `./pages/${name}.jsx`,
            import.meta.glob('./pages/**/*.jsx')
        );

        if (!page.default.layout) {
            page.default.layout = p => <Layout children={p} />
        }

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <App {...props} />
        );
    }
})
