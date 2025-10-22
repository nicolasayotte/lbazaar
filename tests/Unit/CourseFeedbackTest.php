<?php

namespace Tests\Unit;

use App\Models\Course;
use App\Models\CourseFeedback;
use App\Models\CourseSchedule;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class CourseFeedbackTest extends TestCase
{
  use DatabaseTransactions;

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


    /** @test */
    public function it_can_associate_feedback_with_a_specific_schedule()
    {
        $schedule = CourseSchedule::factory()->create();
        $feedback = CourseFeedback::factory()->create([
            'schedule_id' => $schedule->id,
        ]);

        $this->assertEquals($schedule->id, $feedback->schedule->id);
    }

    /** @test */
    public function it_can_give_feedback_without_a_schedule()
    {
        $feedback = CourseFeedback::factory()->create([
            'schedule_id' => null,
        ]);

        $this->assertNull($feedback->schedule);
    }
}
