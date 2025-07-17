<?php

namespace Tests\Unit;

use App\Models\Course;
use App\Models\CourseFeedback;
use App\Models\CourseSchedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseFeedbackTest extends TestCase
{
  use RefreshDatabase;

  public function test_course_feedback_can_reference_course_and_schedule()
  {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $schedule = CourseSchedule::factory()->create(['course_id' => $course->id]);

    $feedback = CourseFeedback::create([
      'user_id' => $user->id,
      'course_id' => $course->id,
      'schedule_id' => $schedule->id,
      'rating' => 5,
      'comments' => 'Great class!'
    ]);

    $this->assertInstanceOf(Course::class, $feedback->course);
    $this->assertInstanceOf(CourseSchedule::class, $feedback->schedule);
    $this->assertEquals($course->id, $feedback->course->id);
    $this->assertEquals($schedule->id, $feedback->schedule->id);
  }
}
