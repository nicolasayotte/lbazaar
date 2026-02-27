<?php

namespace Tests\Feature\Http\Controllers\Portal;

use Tests\TestCase;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\StripePayment;
use App\Models\User;

class PurchaseHistoryControllerTest extends TestCase
{
    private User $user;
    private Course $course;
    private CourseSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createRoles(['student', 'teacher']);
        $this->createCourseType();

        $this->user = $this->createTestUser();
        $this->user->attachRole('student');

        $this->course = Course::factory()->create([
            'title' => 'Test Purchase Course',
        ]);

        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
        ]);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get('/mypage/purchase-history');

        $response->assertRedirect('/portal/login');
    }

    public function test_authenticated_user_with_no_purchases_returns_empty_data(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/mypage/purchase-history');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Portal/MyPage/PurchaseHistory/Index')
                ->where('purchases.data', [])
                ->where('purchases.total', 0)
            );
    }

    public function test_ada_confirmed_purchase_appears_with_correct_type_and_status(): void
    {
        $txHash = 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1';

        CourseHistory::factory()->create([
            'user_id'              => $this->user->id,
            'course_id'            => $this->course->id,
            'course_schedule_id'   => $this->schedule->id,
            'payment_status'       => 'confirmed',
            'payment_tx_hash'      => $txHash,
            'payment_ada_amount'   => '10.500000',
            'payment_submitted_at' => now()->subDays(2),
        ]);

        $response = $this->actingAs($this->user)
            ->get('/mypage/purchase-history');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Portal/MyPage/PurchaseHistory/Index')
                ->where('purchases.total', 1)
                ->has('purchases.data', 1, fn ($item) => $item
                    ->where('type', 'ADA')
                    ->where('status', 'confirmed')
                    ->where('tx_hash', $txHash)
                    ->etc()
                )
            );
    }

    public function test_stripe_succeeded_purchase_appears_with_correct_type_and_status(): void
    {
        StripePayment::factory()->create([
            'user_id'   => $this->user->id,
            'course_id' => $this->course->id,
            'status'    => 'succeeded',
            'amount'    => 3000,
            'currency'  => 'jpy',
        ]);

        $response = $this->actingAs($this->user)
            ->get('/mypage/purchase-history');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Portal/MyPage/PurchaseHistory/Index')
                ->where('purchases.total', 1)
                ->has('purchases.data', 1, fn ($item) => $item
                    ->where('type', 'CC')
                    ->where('status', 'succeeded')
                    ->etc()
                )
            );
    }

    public function test_other_users_purchases_are_not_visible(): void
    {
        $otherUser = $this->createTestUser();
        $otherUser->attachRole('student');

        CourseHistory::factory()->create([
            'user_id'              => $otherUser->id,
            'course_id'            => $this->course->id,
            'course_schedule_id'   => $this->schedule->id,
            'payment_status'       => 'confirmed',
            'payment_submitted_at' => now()->subDay(),
        ]);

        StripePayment::factory()->create([
            'user_id'   => $otherUser->id,
            'course_id' => $this->course->id,
            'status'    => 'succeeded',
        ]);

        $response = $this->actingAs($this->user)
            ->get('/mypage/purchase-history');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('purchases.total', 0)
                ->where('purchases.data', [])
            );
    }

    public function test_course_history_without_payment_status_is_excluded(): void
    {
        // Point enrollment — no payment_status set
        CourseHistory::factory()->create([
            'user_id'             => $this->user->id,
            'course_id'           => $this->course->id,
            'course_schedule_id'  => $this->schedule->id,
            'payment_status'      => null,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/mypage/purchase-history');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('purchases.total', 0)
                ->where('purchases.data', [])
            );
    }

    public function test_pending_ada_payment_appears_with_pending_status(): void
    {
        CourseHistory::factory()->create([
            'user_id'              => $this->user->id,
            'course_id'            => $this->course->id,
            'course_schedule_id'   => $this->schedule->id,
            'payment_status'       => 'pending',
            'payment_submitted_at' => now()->subHour(),
        ]);

        $response = $this->actingAs($this->user)
            ->get('/mypage/purchase-history');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('purchases.total', 1)
                ->has('purchases.data', 1, fn ($item) => $item
                    ->where('type', 'ADA')
                    ->where('status', 'pending')
                    ->etc()
                )
            );
    }

    public function test_refunded_stripe_payment_appears_with_refunded_status(): void
    {
        StripePayment::factory()->create([
            'user_id'   => $this->user->id,
            'course_id' => $this->course->id,
            'status'    => 'refunded',
            'amount'    => 5000,
            'currency'  => 'jpy',
        ]);

        $response = $this->actingAs($this->user)
            ->get('/mypage/purchase-history');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('purchases.total', 1)
                ->has('purchases.data', 1, fn ($item) => $item
                    ->where('type', 'CC')
                    ->where('status', 'refunded')
                    ->etc()
                )
            );
    }

    public function test_pagination_returns_correct_page_size(): void
    {
        // Create 16 stripe payments to exceed the 15-per-page limit
        StripePayment::factory()->count(16)->create([
            'user_id'   => $this->user->id,
            'course_id' => $this->course->id,
            'status'    => 'succeeded',
        ]);

        // Page 1 should have 15 items
        $responsePage1 = $this->actingAs($this->user)
            ->get('/mypage/purchase-history?page=1');

        $responsePage1->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('purchases.total', 16)
                ->where('purchases.last_page', 2)
                ->has('purchases.data', 15)
            );

        // Page 2 should have 1 item
        $responsePage2 = $this->actingAs($this->user)
            ->get('/mypage/purchase-history?page=2');

        $responsePage2->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('purchases.total', 16)
                ->has('purchases.data', 1)
            );
    }

    public function test_explorer_url_prop_is_present(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/mypage/purchase-history');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('explorerUrl')
            );
    }
}
