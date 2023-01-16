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
        'feedback' => 'Your feedback successfully saved.',
        'inquiry' => 'Inquiry successfully submitted',
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
            ]
        ]
    ],
    'confirm' => [
        'class' => [
            'applications' => [
                'approve' => 'Are you sure you want to approve this class application?',
                'deny' => 'Are you sure you want to deny this class application?'
            ]
        ],
        'user' => [
            'enable' => 'Are you sure you want to enable this user?',
            'disable' => 'Are you sure you want to disable this user?'
        ]
    ]
];
