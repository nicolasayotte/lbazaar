<?php

namespace Tests\Integration;

use Stripe\StripeClient;
use Tests\TestCase;
use Tests\Traits\InteractsWithRealServices;

class StripeConnectivityTest extends TestCase
{
    use InteractsWithRealServices;

    protected function requiredServiceKeys(): array
    {
        return [
            'STRIPE_SECRET' => 'services.stripe.secret',
        ];
    }

    /** @test */
    public function stripe_api_accepts_payment_intent_creation()
    {
        $stripe = new StripeClient(config('services.stripe.secret'));

        $intent = $stripe->paymentIntents->create([
            'amount'   => 500,
            'currency' => 'jpy',
        ]);

        $this->assertStringStartsWith('pi_', $intent->id);
        $this->assertNotEmpty($intent->client_secret);
        $this->assertEquals('requires_payment_method', $intent->status);
    }
}
