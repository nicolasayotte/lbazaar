<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'coingecko' => [
        'api_url' => env('COINGECKO_API_URL', 'https://api.coingecko.com/api/v3'),
        'cache_ttl' => env('EXCHANGE_RATE_CACHE_TTL', 600),
        'fallback_cache_ttl' => env('EXCHANGE_RATE_FALLBACK_CACHE_TTL', 60),
        'fallback_rate' => env('EXCHANGE_RATE_FALLBACK', '50'),
    ],

    'cardano' => [
        'explorer_url'              => env('CARDANO_EXPLORER_URL', 'https://preprod.cardanoscan.io'),
        'required_confirmations'    => env('ADA_REQUIRED_CONFIRMATIONS', 10),
        'payment_timeout_minutes'   => env('ADA_PAYMENT_TIMEOUT_MINUTES', 30),
        'network_id'                => env('CARDANO_NETWORK_ID', 0),
        'quote_window_minutes'      => env('PAYMENT_QUOTE_WINDOW_MINUTES', 5),
        'min_ada'                   => env('MIN_ADA', 2000000),
        'max_tx_fee'                => env('MAX_TX_FEE', 500000),
        'network_health_cache_ttl'  => env('CARDANO_NETWORK_HEALTH_CACHE_TTL', 60),
        'certificate_lock_date'     => env('CERTIFICATE_LOCK_DATE'),
        'owner_wallet_addr'         => env('OWNER_WALLET_ADDR'),
    ],

    'blockfrost' => [
        'api_key' => env('BLOCKFROST_API_KEY'),
        'network' => env('NETWORK', 'preprod'),
    ],

    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

];
