<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Messages Language Lines
    |--------------------------------------------------------------------------
    |
    | The following are custom messages mainly used for success and error messages
    |
    */
    'error'   => 'There was an error encountered',
    'success' => [
        'forgotPassword' => 'Reset password link already sent to you email.',
        'profile' => 'Profile successfully updated',
        'auth' => 'User successfully authenticated',
        'password' => 'Password successfully updated',
        'feedback' => 'Feedback successfully saved.',
        'inquiry' => 'Inquiry successfully submitted',
        'class_generated' => 'Command Generated.',
        'copy' => 'Copied!',
        'user' => [
            'login'  => 'User successfully authenticated',
            'logout' => 'User successfully signed out',
            'status' => [
                'update' => 'User status successfully updated'
            ],
            'create' => 'User successfully created'
        ],
        'class' => [
            'applications' => [
                'status' => [
                    'update' => 'Class application status successfully updated'
                ]
            ],
            'types' => [
                'update' => 'Class types successfully updated'
            ]
        ],
        'category' => [
            'update' => 'Category successfully updated',
            'delete' => 'Category successfully deleted',
            'create' => 'Category successfully created'
        ],
        'classification' => [
            'delete' => 'Classification successfully deleted'
        ]
    ],
    'confirm' => [
        'class' => [
            'applications' => [
                'approve' => 'Are you sure you want to approve this class application?',
                'deny' => 'Are you sure you want to deny this class application?'
            ],
            'types' => [
                'update' => 'Are you sure you want to update these class types?'
            ]
        ],
        'user' => [
            'enable' => 'Are you sure you want to enable this user?',
            'disable' => 'Are you sure you want to disable this user?'
        ],
        'category' => [
            'delete' => 'Are you sure you want to delete this category?'
        ],
        'classification' => [
            'delete' => 'Are you sure you want to delete this classification?'
        ]
    ]
];
