<?php

namespace Tests\Feature\Http\Controllers\Portal;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia as Assert;
use App\Services\API\ExchangeRateService;
use App\Services\API\StripeService;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseHistory;
use Mockery;

class CourseControllerPriceTest extends TestCase
{
    use DatabaseTransactions;

    protected $exchangeRateService;
    protected $stripeService;
    protected User $teacher;
    protected Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        // Create and bind mock ExchangeRateService to container
        $this->exchangeRateService = Mockery::mock(ExchangeRateService::class);
        $this->app->instance(ExchangeRateService::class, $this->exchangeRateService);

        // Create and bind mock StripeService to container
        $this->stripeService = Mockery::mock(StripeService::class);
        $this->stripeService->shouldReceive('isAvailable')->andReturn(true)->byDefault();
        $this->app->instance(StripeService::class, $this->stripeService);

        // Create roles and test teacher
        $this->createRoles(['teacher', 'student']);
        $courseType = $this->createCourseType('general', 'general');

        $this->teacher = User::factory()->create([
            'email' => 'price-test-teacher@example.com',
        ]);
        $this->teacher->attachRole('teacher');

        $this->course = Course::factory()->create([
            'professor_id' => $this->teacher->id,
            'course_type_id' => $courseType->id,
            'price' => 2500,
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    // -------------------------------------------------------------------------
    // Task 01: ExchangeRateService returns price_in_ada = 25.0
    // -------------------------------------------------------------------------

    public function test_courses_index_includes_price_in_ada_when_exchange_rate_available()
    {
        // Mock addPriceInAdaToCourses to set price_in_ada = 25.0 on each course
        $this->exchangeRateService
            ->shouldReceive('addPriceInAdaToCourses')
            ->once()
            ->andReturnUsing(function ($courses) {
                foreach ($courses as $c) {
                    $c->price_in_ada = 25.0;
                }
                return $courses;
            });

        $response = $this->get('/classes');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Search', false)
            ->has('courses.data.0')
            ->where('courses.data.0.price_in_ada', 25.0)
        );
    }

    public function test_course_details_includes_price_in_ada_when_exchange_rate_available()
    {
        // Mock addPriceInAdaToCourses to set price_in_ada = 25.0 on course
        $this->exchangeRateService
            ->shouldReceive('addPriceInAdaToCourses')
            ->once()
            ->andReturnUsing(function ($courses) {
                foreach ($courses as $c) {
                    $c->price_in_ada = 25.0;
                }
                return $courses;
            });

        $response = $this->get("/classes/{$this->course->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Details', false)
            ->has('course')
            ->where('course.price_in_ada', 25.0)
        );
    }

    // -------------------------------------------------------------------------
    // Task 03: ExchangeRateService returns price_in_ada = null (no crash)
    // -------------------------------------------------------------------------

    public function test_courses_index_handles_null_price_in_ada_without_crash()
    {
        // Mock addPriceInAdaToCourses to set price_in_ada = null (API unavailable)
        $this->exchangeRateService
            ->shouldReceive('addPriceInAdaToCourses')
            ->once()
            ->andReturnUsing(function ($courses) {
                foreach ($courses as $c) {
                    $c->price_in_ada = null;
                }
                return $courses;
            });

        $response = $this->get('/classes');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Search', false)
            ->has('courses.data.0')
            ->where('courses.data.0.price_in_ada', null)
        );
    }

    public function test_course_details_handles_null_price_in_ada_without_crash()
    {
        // Mock addPriceInAdaToCourses to set price_in_ada = null (API unavailable)
        $this->exchangeRateService
            ->shouldReceive('addPriceInAdaToCourses')
            ->once()
            ->andReturnUsing(function ($courses) {
                foreach ($courses as $c) {
                    $c->price_in_ada = null;
                }
                return $courses;
            });

        $response = $this->get("/classes/{$this->course->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Details', false)
            ->has('course')
            ->where('course.price_in_ada', null)
        );
    }

    // -------------------------------------------------------------------------
    // Task 09: isBooked excludes pending/failed; pendingPayment prop
    // -------------------------------------------------------------------------

    protected function mockExchangeRateOnce(): void
    {
        $this->exchangeRateService
            ->shouldReceive('addPriceInAdaToCourses')
            ->once()
            ->andReturnUsing(function ($courses) {
                foreach ($courses as $c) {
                    $c->price_in_ada = null;
                }
                return $courses;
            });
    }

    public function test_is_booked_true_when_payment_status_is_null()
    {
        $this->mockExchangeRateOnce();

        $student = User::factory()->create(['email' => 'student-null-status@example.com']);
        $student->attachRole('student');

        CourseHistory::factory()->create([
            'user_id'        => $student->id,
            'course_id'      => $this->course->id,
            'payment_status' => null,
        ]);

        $response = $this->actingAs($student)->get("/classes/{$this->course->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Details', false)
            ->where('isBooked', true)
        );
    }

    public function test_is_booked_true_when_payment_status_is_confirmed()
    {
        $this->mockExchangeRateOnce();

        $student = User::factory()->create(['email' => 'student-confirmed@example.com']);
        $student->attachRole('student');

        CourseHistory::factory()->create([
            'user_id'        => $student->id,
            'course_id'      => $this->course->id,
            'payment_status' => 'confirmed',
        ]);

        $response = $this->actingAs($student)->get("/classes/{$this->course->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Details', false)
            ->where('isBooked', true)
        );
    }

    public function test_is_booked_false_when_payment_status_is_pending()
    {
        $this->mockExchangeRateOnce();

        $student = User::factory()->create(['email' => 'student-pending@example.com']);
        $student->attachRole('student');

        CourseHistory::factory()->create([
            'user_id'        => $student->id,
            'course_id'      => $this->course->id,
            'payment_status' => 'pending',
        ]);

        $response = $this->actingAs($student)->get("/classes/{$this->course->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Details', false)
            ->where('isBooked', false)
        );
    }

    public function test_is_booked_false_when_payment_status_is_failed()
    {
        $this->mockExchangeRateOnce();

        $student = User::factory()->create(['email' => 'student-failed@example.com']);
        $student->attachRole('student');

        CourseHistory::factory()->create([
            'user_id'        => $student->id,
            'course_id'      => $this->course->id,
            'payment_status' => 'failed',
        ]);

        $response = $this->actingAs($student)->get("/classes/{$this->course->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Details', false)
            ->where('isBooked', false)
        );
    }

    public function test_pending_payment_is_null_when_unauthenticated()
    {
        $this->mockExchangeRateOnce();

        $response = $this->get("/classes/{$this->course->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Details', false)
            ->where('pendingPayment', null)
        );
    }

    public function test_pending_payment_is_null_when_no_pending_history_exists()
    {
        $this->mockExchangeRateOnce();

        $student = User::factory()->create(['email' => 'student-no-pending@example.com']);
        $student->attachRole('student');

        $response = $this->actingAs($student)->get("/classes/{$this->course->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Details', false)
            ->where('pendingPayment', null)
        );
    }

    public function test_pending_payment_returned_when_pending_history_exists()
    {
        $this->mockExchangeRateOnce();

        $student = User::factory()->create(['email' => 'student-has-pending@example.com']);
        $student->attachRole('student');

        $history = CourseHistory::factory()->create([
            'user_id'              => $student->id,
            'course_id'            => $this->course->id,
            'payment_status'       => 'pending',
            'payment_tx_hash'      => 'abc123txhash',
            'payment_submitted_at' => now()->subMinutes(5),
        ]);

        $response = $this->actingAs($student)->get("/classes/{$this->course->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Details', false)
            ->has('pendingPayment')
            ->where('pendingPayment.id', $history->id)
            ->where('pendingPayment.payment_tx_hash', 'abc123txhash')
        );
    }

    // -------------------------------------------------------------------------
    // Task 06: stripe_available prop reflects StripeService::isAvailable()
    // -------------------------------------------------------------------------

    public function test_course_details_stripe_available_true(): void
    {
        $this->mockExchangeRateOnce();
        $this->stripeService->shouldReceive('isAvailable')->once()->andReturn(true);
        $this->get("/classes/{$this->course->id}")
            ->assertInertia(fn (Assert $page) => $page
                ->component('Portal/Course/Details', false)
                ->where('stripe_available', true));
    }

    public function test_course_details_stripe_available_false(): void
    {
        $this->mockExchangeRateOnce();
        $this->stripeService->shouldReceive('isAvailable')->once()->andReturn(false);
        $this->get("/classes/{$this->course->id}")
            ->assertInertia(fn (Assert $page) => $page
                ->component('Portal/Course/Details', false)
                ->where('stripe_available', false));
    }
}
