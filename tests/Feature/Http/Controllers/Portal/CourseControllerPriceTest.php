<?php

namespace Tests\Feature\Http\Controllers\Portal;

use Tests\TestCase;
use Inertia\Testing\AssertableInertia as Assert;
use App\Services\API\ExchangeRateService;
use App\Services\API\StripeService;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use Mockery;

class CourseControllerPriceTest extends TestCase
{
    protected $exchangeRateService;
    protected $stripeService;
    protected User $teacher;
    protected Course $course;
    protected CourseSchedule $schedule;

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
        $this->disableUserModelEvents();
        $this->createRoles(['teacher', 'student']);
        $courseType = $this->createCourseType('general', 'general');

        $this->teacher = User::factory()->create([
            'email' => 'price-test-teacher@example.com',
            'custodial_address' => 'addr_test_price_teacher',
        ]);
        $this->teacher->attachRole('teacher');

        $this->course = Course::factory()->create([
            'title' => 'PRICE_TEST_COURSE_' . uniqid(),
            'professor_id' => $this->teacher->id,
            'course_type_id' => $courseType->id,
            'price' => 2500,
        ]);

        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id' => $this->teacher->id,
        ]);
    }

    // -------------------------------------------------------------------------
    // Task 01: ExchangeRateService returns price_in_ada = 25.0
    // -------------------------------------------------------------------------

    public function test_courses_index_includes_price_in_ada_when_exchange_rate_available()
    {
        // addPriceInAdaToCourses sets price_in_ada in $attributes so toArray() includes the key.
        // The getPriceInAdaAttribute accessor then calls jpyToAda() during serialization,
        // so we must mock both: the callback to seed the attribute, and jpyToAda for the value.
        $this->exchangeRateService
            ->shouldReceive('addPriceInAdaToCourses')
            ->once()
            ->andReturnUsing(function ($courses) {
                foreach ($courses as $c) {
                    $c->price_in_ada = 25.0;
                }
                return $courses;
            });
        $this->exchangeRateService->shouldReceive('jpyToAda')->andReturn(25.0);

        // Search by unique title so only our course appears (seeded courses have price=0).
        // json_encode(25.0) → "25" → decoded as int, so assert 25 not 25.0.
        $response = $this->get('/classes?search_text=' . urlencode($this->course->title));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Search', false)
            ->has('courses.data.0')
            ->where('courses.data.0.price_in_ada', 25)
        );
    }

    public function test_course_details_includes_price_in_ada_when_exchange_rate_available()
    {
        // The accessor calls jpyToAda() during serialization; mock it to return a known value.
        // addPriceInAdaToCourses seeds the attribute key so the accessor fires in toArray().
        $this->exchangeRateService
            ->shouldReceive('addPriceInAdaToCourses')
            ->once()
            ->andReturnUsing(function ($courses) {
                foreach ($courses as $c) { $c->price_in_ada = 0; }
                return $courses;
            });
        $this->exchangeRateService->shouldReceive('jpyToAda')->with(2500.0)->andReturn(25.0);

        $response = $this->get("/classes/{$this->course->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Course/Details', false)
            ->has('course')
            ->where('course.price_in_ada', 25)  // json_encode(25.0) → "25" → decoded as int
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

        $student = $this->createTestUser(['email' => 'student-null-status@example.com']);
        $student->attachRole('student');

        CourseHistory::factory()->create([
            'user_id'             => $student->id,
            'course_id'           => $this->course->id,
            'course_schedule_id'  => $this->schedule->id,
            'payment_status'      => null,
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

        $student = $this->createTestUser(['email' => 'student-confirmed@example.com']);
        $student->attachRole('student');

        CourseHistory::factory()->create([
            'user_id'             => $student->id,
            'course_id'           => $this->course->id,
            'course_schedule_id'  => $this->schedule->id,
            'payment_status'      => 'confirmed',
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

        $student = $this->createTestUser(['email' => 'student-pending@example.com']);
        $student->attachRole('student');

        CourseHistory::factory()->create([
            'user_id'             => $student->id,
            'course_id'           => $this->course->id,
            'course_schedule_id'  => $this->schedule->id,
            'payment_status'      => 'pending',
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

        $student = $this->createTestUser(['email' => 'student-failed@example.com']);
        $student->attachRole('student');

        CourseHistory::factory()->create([
            'user_id'             => $student->id,
            'course_id'           => $this->course->id,
            'course_schedule_id'  => $this->schedule->id,
            'payment_status'      => 'failed',
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

        $student = $this->createTestUser(['email' => 'student-no-pending@example.com']);
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

        $student = $this->createTestUser(['email' => 'student-has-pending@example.com']);
        $student->attachRole('student');

        $history = CourseHistory::factory()->create([
            'user_id'              => $student->id,
            'course_id'            => $this->course->id,
            'course_schedule_id'   => $this->schedule->id,
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
