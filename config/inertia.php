<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Testing
    |--------------------------------------------------------------------------
    |
    | The values here are used to during test assertions.
    |
    */
    'testing' => [
        'ensure_pages_exist' => false,
        'page_paths' => [
            resource_path('js/pages'),
        ],
        'page_extensions' => [
            'js',
            'jsx',
            'svelte',
            'ts',
            'tsx',
            'vue',
        ],
    ],
];
