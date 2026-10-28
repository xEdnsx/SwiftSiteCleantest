<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_unique(array_merge(
        array_filter(array_map('trim', explode(',', env('ADMIN_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')))),
        array_filter(array_map('trim', explode(',', env('CLIENT_ALLOWED_ORIGINS', 'http://localhost:8100,http://127.0.0.1:8100,http://localhost:4200,http://127.0.0.1:4200,capacitor://localhost,http://localhost,https://localhost'))))
    ))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'X-Requested-With'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
