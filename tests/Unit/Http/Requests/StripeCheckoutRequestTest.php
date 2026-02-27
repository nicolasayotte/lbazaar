<?php

namespace Tests\Unit\Http\Requests;

use Tests\TestCase;
use App\Http\Requests\StripeCheckoutRequest;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\CourseHistory;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Validator;

class StripeCheckoutRequestTest extends TestCase
{
    protected $student;
    protected $professor;
    protected $course;
    protected $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        $this->createRoles(['student', 'teacher']);

        // Create professor with unique email (withoutEvents to avoid Node.js observer)
        $this->professor = $this->createTestUser([
            'email' => 'professor_' . uniqid() . '@test.com',
            'first_name' => 'Test',
            'last_name' => 'Professor'
        ]);
        $this->professor->attachRole('teacher');

        // Create student with unique email (withoutEvents to avoid Node.js observer)
        $this->student = $this->createTestUser([
            'email' => 'student_' . uniqid() . '@test.com',
            'first_name' => 'Test',
            'last_name' => 'Student'
        ]);
        $this->student->attachRole('student');

        // Create course owned by professor
        $this->course = Course::factory()->create([
            'title' => 'Test Course',
            'professor_id' => $this->professor->id
        ]);

        // Create schedule for the course
        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id' => $this->professor->id
        ]);
    }

    public function test_authorize_returns_false_when_user_not_authenticated()
    {
        $request = new StripeCheckoutRequest();
        $request->setContainer($this->app);

        $this->assertFalse($request->authorize());
    }

    public function test_authorize_returns_false_when_course_not_provided()
    {
        $request = new StripeCheckoutRequest();
        $request->setUserResolver(fn() => $this->student);
        $request->setContainer($this->app);
        $request->setRouteResolver(function () {
            return new class {
                public function parameter($name) {
                    return null;
                }
            };
        });

        $this->assertFalse($request->authorize());
    }

    public function test_authorize_returns_false_when_user_is_course_professor()
    {
        $request = new StripeCheckoutRequest();
        $request->setUserResolver(fn() => $this->professor);
        $request->setContainer($this->app);
        $request->setRouteResolver(function () {
            return new class($this->course) {
                private $course;
                public function __construct($course) {
                    $this->course = $course;
                }
                public function parameter($name) {
                    return $name === 'course' ? $this->course : null;
                }
            };
        });

        $this->assertFalse($request->authorize());
    }

    public function test_authorize_returns_false_when_user_already_enrolled()
    {
        // Enroll the student in the course
        CourseHistory::factory()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'is_cancelled' => false
        ]);

        $request = new StripeCheckoutRequest();
        $request->setUserResolver(fn() => $this->student);
        $request->setContainer($this->app);
        $request->setRouteResolver(function () {
            return new class($this->course) {
                private $course;
                public function __construct($course) {
                    $this->course = $course;
                }
                public function parameter($name) {
                    return $name === 'course' ? $this->course : null;
                }
            };
        });

        $this->assertFalse($request->authorize());
    }

    public function test_authorize_returns_true_when_user_can_purchase_course()
    {
        $request = new StripeCheckoutRequest();
        $request->setUserResolver(fn() => $this->student);
        $request->setContainer($this->app);
        $request->setRouteResolver(function () {
            return new class($this->course) {
                private $course;
                public function __construct($course) {
                    $this->course = $course;
                }
                public function parameter($name) {
                    return $name === 'course' ? $this->course : null;
                }
            };
        });

        $this->assertTrue($request->authorize());
    }

    public function test_rules_allow_optional_course_schedule_id()
    {
        $request = new StripeCheckoutRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('course_schedule_id', $rules);
        $this->assertStringContainsString('nullable', $rules['course_schedule_id']);
        $this->assertStringContainsString('integer', $rules['course_schedule_id']);
        $this->assertStringContainsString('exists:course_schedules,id', $rules['course_schedule_id']);
    }

    public function test_validation_passes_without_course_schedule_id()
    {
        $request = new StripeCheckoutRequest();
        $validator = Validator::make(
            [],
            $request->rules()
        );

        $this->assertFalse($validator->fails());
    }

    public function test_validation_passes_with_valid_course_schedule_id()
    {
        $request = new StripeCheckoutRequest();
        $validator = Validator::make(
            ['course_schedule_id' => $this->schedule->id],
            $request->rules()
        );

        $this->assertFalse($validator->fails());
    }

    public function test_validation_fails_when_course_schedule_id_is_not_integer()
    {
        $request = new StripeCheckoutRequest();
        $validator = Validator::make(
            ['course_schedule_id' => 'not_an_integer'],
            $request->rules()
        );

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('course_schedule_id', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_course_schedule_does_not_exist()
    {
        $request = new StripeCheckoutRequest();
        $validator = Validator::make(
            ['course_schedule_id' => 999999],
            $request->rules()
        );

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('course_schedule_id', $validator->errors()->toArray());
    }

    public function test_failed_validation_behavior_through_reflection()
    {
        $request = new StripeCheckoutRequest();
        $validator = Validator::make(
            ['course_schedule_id' => 'invalid'],
            $request->rules()
        );

        // Use reflection to access protected method
        $reflection = new \ReflectionClass($request);
        $method = $reflection->getMethod('failedValidation');
        $method->setAccessible(true);

        try {
            $method->invoke($request, $validator);
            $this->fail('Expected HttpResponseException was not thrown');
        } catch (HttpResponseException $e) {
            $response = $e->getResponse();
            $data = json_decode($response->getContent(), true);

            $this->assertEquals(422, $response->getStatusCode());
            $this->assertArrayHasKey('success', $data);
            $this->assertFalse($data['success']);
            $this->assertArrayHasKey('message', $data);
            $this->assertEquals('Validation failed', $data['message']);
            $this->assertArrayHasKey('errors', $data);
        }
    }

    public function test_failed_authorization_behavior_through_reflection()
    {
        $request = new StripeCheckoutRequest();

        // Use reflection to access protected method
        $reflection = new \ReflectionClass($request);
        $method = $reflection->getMethod('failedAuthorization');
        $method->setAccessible(true);

        try {
            $method->invoke($request);
            $this->fail('Expected HttpResponseException was not thrown');
        } catch (HttpResponseException $e) {
            $response = $e->getResponse();
            $data = json_decode($response->getContent(), true);

            $this->assertEquals(403, $response->getStatusCode());
            $this->assertArrayHasKey('success', $data);
            $this->assertFalse($data['success']);
            $this->assertArrayHasKey('message', $data);
            $this->assertEquals('You are not authorized to purchase this course.', $data['message']);
        }
    }
}
