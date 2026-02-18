<?php

namespace Tests\Unit\Http\Requests\API;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Http\Requests\API\MintSingleCertificateRequest;
use App\Models\User;
use App\Models\Course;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Validator;

class MintSingleCertificateRequestTest extends TestCase
{
    use DatabaseTransactions;

    protected $teacher;
    protected $student;
    protected $course;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        $this->createRoles(['teacher', 'student']);

        // Create teacher with unique email
        $this->teacher = User::factory()->create([
            'email' => 'teacher_' . uniqid() . '@test.com',
            'first_name' => 'Test',
            'last_name' => 'Teacher'
        ]);
        $this->teacher->attachRole('teacher');

        // Create student with unique email
        $this->student = User::factory()->create([
            'email' => 'student_' . uniqid() . '@test.com',
            'first_name' => 'Test',
            'last_name' => 'Student'
        ]);
        $this->student->attachRole('student');

        // Create course owned by teacher
        $this->course = Course::factory()->create([
            'title' => 'Test Course',
            'professor_id' => $this->teacher->id
        ]);
    }

    public function test_authorize_returns_false_when_user_not_authenticated()
    {
        $request = new MintSingleCertificateRequest();
        $request->setContainer($this->app);

        $this->assertFalse($request->authorize());
    }

    public function test_authorize_returns_false_when_user_is_not_teacher()
    {
        $request = new MintSingleCertificateRequest();
        $request->setUserResolver(fn() => $this->student);
        $request->merge(['course_id' => $this->course->id]);
        $request->setContainer($this->app);

        $this->assertFalse($request->authorize());
    }

    public function test_authorize_returns_false_when_teacher_does_not_own_course()
    {
        // Create another teacher and their course
        $otherTeacher = User::factory()->create();
        $otherTeacher->attachRole('teacher');
        $otherCourse = Course::factory()->create([
            'professor_id' => $otherTeacher->id
        ]);

        $request = new MintSingleCertificateRequest();
        $request->setUserResolver(fn() => $this->teacher);
        $request->merge(['course_id' => $otherCourse->id]);
        $request->setContainer($this->app);

        $this->assertFalse($request->authorize());
    }

    public function test_authorize_returns_true_when_teacher_owns_course()
    {
        $request = new MintSingleCertificateRequest();
        $request->setUserResolver(fn() => $this->teacher);
        $request->merge(['course_id' => $this->course->id]);
        $request->setContainer($this->app);

        $this->assertTrue($request->authorize());
    }

    public function test_authorize_returns_false_when_course_id_is_missing()
    {
        $request = new MintSingleCertificateRequest();
        $request->setUserResolver(fn() => $this->teacher);
        $request->setContainer($this->app);

        $this->assertFalse($request->authorize());
    }

    public function test_rules_require_course_id()
    {
        $request = new MintSingleCertificateRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('course_id', $rules);
        $this->assertStringContainsString('required', $rules['course_id']);
        $this->assertStringContainsString('integer', $rules['course_id']);
        $this->assertStringContainsString('exists:courses,id', $rules['course_id']);
    }

    public function test_rules_require_student_id()
    {
        $request = new MintSingleCertificateRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('student_id', $rules);
        $this->assertStringContainsString('required', $rules['student_id']);
        $this->assertStringContainsString('integer', $rules['student_id']);
        $this->assertStringContainsString('exists:users,id', $rules['student_id']);
    }

    public function test_rules_allow_optional_schedule_id()
    {
        $request = new MintSingleCertificateRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('schedule_id', $rules);
        $this->assertStringContainsString('nullable', $rules['schedule_id']);
        $this->assertStringContainsString('integer', $rules['schedule_id']);
        $this->assertStringContainsString('exists:course_schedules,id', $rules['schedule_id']);
    }

    public function test_validation_fails_when_course_id_is_missing()
    {
        $request = new MintSingleCertificateRequest();
        $validator = Validator::make(
            ['student_id' => $this->student->id],
            $request->rules()
        );

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('course_id', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_student_id_is_missing()
    {
        $request = new MintSingleCertificateRequest();
        $validator = Validator::make(
            ['course_id' => $this->course->id],
            $request->rules()
        );

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('student_id', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_course_does_not_exist()
    {
        $request = new MintSingleCertificateRequest();
        $validator = Validator::make(
            [
                'course_id' => 999999,
                'student_id' => $this->student->id
            ],
            $request->rules()
        );

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('course_id', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_student_does_not_exist()
    {
        $request = new MintSingleCertificateRequest();
        $validator = Validator::make(
            [
                'course_id' => $this->course->id,
                'student_id' => 999999
            ],
            $request->rules()
        );

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('student_id', $validator->errors()->toArray());
    }

    public function test_validation_passes_with_valid_data()
    {
        $request = new MintSingleCertificateRequest();
        $validator = Validator::make(
            [
                'course_id' => $this->course->id,
                'student_id' => $this->student->id
            ],
            $request->rules()
        );

        $this->assertFalse($validator->fails());
    }

    public function test_validation_passes_with_optional_schedule_id()
    {
        $schedule = \App\Models\CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id' => $this->teacher->id
        ]);

        $request = new MintSingleCertificateRequest();
        $validator = Validator::make(
            [
                'course_id' => $this->course->id,
                'student_id' => $this->student->id,
                'schedule_id' => $schedule->id
            ],
            $request->rules()
        );

        $this->assertFalse($validator->fails());
    }

    public function test_failed_validation_behavior_through_reflection()
    {
        $request = new MintSingleCertificateRequest();
        $validator = Validator::make(
            [],
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
        $request = new MintSingleCertificateRequest();

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
            $this->assertEquals('You do not have permission to mint certificates for this course.', $data['message']);
        }
    }
}
