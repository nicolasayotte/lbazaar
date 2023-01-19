import React from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/inertia-react";
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import Layout from './layouts/Layout';
import { Provider } from "react-redux";
import store from "./store"
import Admin from "./layouts/Admin";
import MyPage from "./layouts/MyPage";
import { InertiaProgress } from "@inertiajs/progress";

createInertiaApp({
    resolve: async name => {
        const page = await resolvePageComponent(
            `./pages/${name}.jsx`,
            import.meta.glob('./pages/**/*.jsx')
        );

        if (name.startsWith('Admin')) {
            page.default.layout = p => <Admin children={p} />
        } else if (name.startsWith('Portal/MyPage')) {
            page.default.layout = p => <MyPage children={p} />
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

InertiaProgress.init({
    color: '#2ecc71',
    delay: 0,
    includeCSS: true
})
