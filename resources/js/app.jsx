import React from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/inertia-react";
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import Layout from './layouts/Layout';
import { Provider } from "react-redux";
import store from "./store"
import Admin from "./layouts/Admin";

createInertiaApp({
    resolve: async name => {

        const page = await resolvePageComponent(
            `./pages/${name}.jsx`,
            import.meta.glob('./pages/**/*.jsx')
        );

        if (name.startsWith('admin')) {
            page.default.layout = p => <Admin children={p} />
        } else {
            page.default.layout = p => <Layout children={p} />
        }

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <Provider store={store}>
                <App {...props} />
            </Provider>
        );
    }
})
