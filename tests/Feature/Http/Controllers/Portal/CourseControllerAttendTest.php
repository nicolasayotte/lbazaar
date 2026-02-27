<?php

namespace Tests\Feature\Http\Controllers\Portal;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\CourseHistory;
use App\Models\CourseType;
use App\Services\API\ExchangeRateService;
use Mockery;

class CourseControllerAttendTest extends TestCase
{
    protected User $teacher;
    protected User $student;
    protected Course $course;
    protected CourseSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createRoles(['teacher', 'student']);

        // Create a General-type course type (name must match CourseType::GENERAL constant)
        $courseType = CourseType::where('name', CourseType::GENERAL)->first()
            ?? CourseType::create(['name' => CourseType::GENERAL, 'type' => 'general']);

        $this->teacher = $this->createTestUser([
            'email' => 'attend-test-teacher@example.com',
        ]);
        $this->teacher->attachRole('teacher');

        $this->student = $this->createTestUser([
            'email' => 'attend-test-student@example.com',
        ]);
        $this->student->attachRole('student');

        $this->course = Course::factory()->create([
            'professor_id'   => $this->teacher->id,
            'course_type_id' => $courseType->id,
            'price'          => 1000,
        ]);

        // Schedule with start/end in the past so status is Ongoing or Done;
        // use start in the past and end in the future so status = Ongoing.
        $this->schedule = CourseSchedule::factory()->create([
            'course_id'      => $this->course->id,
            'start_datetime' => now()->subHour(),
            'end_datetime'   => now()->addHour(),
        ]);
    }

    // -------------------------------------------------------------------------
    // test_attend_blocked_when_payment_pending
    // -------------------------------------------------------------------------

    public function test_attend_blocked_when_payment_pending()
    {
        CourseHistory::factory()->create([
            'user_id'            => $this->student->id,
            'course_id'          => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'payment_status'     => 'pending',
        ]);

        $response = $this->actingAs($this->student)
            ->get("/classes/{$this->course->id}/attend/{$this->schedule->id}");

        $response->assertStatus(401);
    }

    // -------------------------------------------------------------------------
    // test_attend_blocked_when_payment_failed
    // -------------------------------------------------------------------------

    public function test_attend_blocked_when_payment_failed()
    {
        CourseHistory::factory()->create([
            'user_id'            => $this->student->id,
            'course_id'          => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'payment_status'     => 'failed',
        ]);

        $response = $this->actingAs($this->student)
            ->get("/classes/{$this->course->id}/attend/{$this->schedule->id}");

        $response->assertStatus(401);
    }

    // -------------------------------------------------------------------------
    // test_attend_allowed_when_payment_confirmed
    // -------------------------------------------------------------------------

    public function test_attend_allowed_when_payment_confirmed()
    {
        CourseHistory::factory()->create([
            'user_id'            => $this->student->id,
            'course_id'          => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'payment_status'     => 'confirmed',
        ]);

        $response = $this->actingAs($this->student)
            ->get("/classes/{$this->course->id}/attend/{$this->schedule->id}");

        $response->assertStatus(200);
    }

    // -------------------------------------------------------------------------
    // test_attend_allowed_for_free_course_with_null_payment_status
    // -------------------------------------------------------------------------

    public function test_attend_allowed_for_free_course_with_null_payment_status()
    {
        // Create a Free course type (non-General) so the payment guard is skipped
        $freeCourseType = CourseType::where('name', CourseType::FREE)->first()
            ?? CourseType::create(['name' => CourseType::FREE, 'type' => 'free']);

        $freeCourse = Course::factory()->create([
            'professor_id'   => $this->teacher->id,
            'course_type_id' => $freeCourseType->id,
            'price'          => 0,
        ]);

        $freeSchedule = CourseSchedule::factory()->create([
            'course_id'      => $freeCourse->id,
            'start_datetime' => now()->subHour(),
            'end_datetime'   => now()->addHour(),
        ]);

        CourseHistory::factory()->create([
            'user_id'            => $this->student->id,
            'course_id'          => $freeCourse->id,
            'course_schedule_id' => $freeSchedule->id,
            'payment_status'     => null,
        ]);

        $response = $this->actingAs($this->student)
            ->get("/classes/{$freeCourse->id}/attend/{$freeSchedule->id}");

        $response->assertStatus(200);
    }
}
