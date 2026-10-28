<?php

namespace Tests\Feature;

use Tests\TestCase;

class AdminCorsTest extends TestCase
{
    public function test_admin_origin_can_send_authorization_header(): void
    {
        $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'authorization,content-type',
        ])->options('/api/login')->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }

    public function test_unknown_origins_are_not_allowed(): void
    {
        $this->withHeaders([
            'Origin' => 'https://unknown.example',
            'Access-Control-Request-Method' => 'POST',
        ])->options('/api/login')->assertHeaderMissing('Access-Control-Allow-Origin');
    }

    public function test_ionic_origins_are_allowed(): void
    {
        foreach (['http://localhost:8100', 'http://127.0.0.1:8100', 'capacitor://localhost', 'http://localhost'] as $origin) {
            $this->withHeaders([
                'Origin' => $origin,
                'Access-Control-Request-Method' => 'POST',
                'Access-Control-Request-Headers' => 'authorization,content-type',
            ])->options('/api/login')->assertNoContent()->assertHeader('Access-Control-Allow-Origin', $origin);
        }
    }
}
