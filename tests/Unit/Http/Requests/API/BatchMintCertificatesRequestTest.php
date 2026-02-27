<?php

namespace Tests\Unit\Http\Requests\API;

use Tests\TestCase;
use App\Http\Requests\API\BatchMintCertificatesRequest;
use App\Models\User;
use App\Models\Course;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Validator;

class BatchMintCertificatesRequestTest extends TestCase
{
    protected $teacher;
    protected $students;
    protected $course;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        $this->createRoles(['teacher', 'student']);

        // Create teacher with unique email (withoutEvents to avoid Node.js observer)
        $this->teacher = $this->createTestUser([
            'email' => 'teacher_' . uniqid() . '@test.com',
            'first_name' => 'Test',
            'last_name' => 'Teacher'
        ]);
        $this->teacher->attachRole('teacher');

        // Create multiple students with unique emails (withoutEvents to avoid Node.js observer)
        $this->students = collect();
        for ($i = 0; $i < 3; $i++) {
            $student = $this->createTestUser([
                'email' => 'student_' . uniqid() . '_' . $i . '@test.com'
            ]);
            $student->attachRole('student');
            $this->students->push($student);
        }

        // Create course owned by teacher
        $this->course = Course::factory()->create([
            'title' => 'Test Course',
            'professor_id' => $this->teacher->id
        ]);
    }

    public function test_authorize_returns_false_when_user_not_authenticated()
    {
        $request = new BatchMintCertificatesRequest();
        $request->setContainer($this->app);

        $this->assertFalse($request->authorize());
    }

    public function test_authorize_returns_false_when_user_is_not_teacher()
    {
        $student = $this->students->first();

        $request = new BatchMintCertificatesRequest();
        $request->setUserResolver(fn() => $student);
        $request->merge(['course_id' => $this->course->id]);
        $request->setContainer($this->app);

        $this->assertFalse($request->authorize());
    }

    public function test_authorize_returns_false_when_teacher_does_not_own_course()
    {
        // Create another teacher and their course
        $otherTeacher = $this->createTestUser();
        $otherTeacher->attachRole('teacher');
        $otherCourse = Course::factory()->create([
            'professor_id' => $otherTeacher->id
        ]);

        $request = new BatchMintCertificatesRequest();
        $request->setUserResolver(fn() => $this->teacher);
        $request->merge(['course_id' => $otherCourse->id]);
        $request->setContainer($this->app);

        $this->assertFalse($request->authorize());
    }

    public function test_authorize_returns_true_when_teacher_owns_course()
    {
        $request = new BatchMintCertificatesRequest();
        $request->setUserResolver(fn() => $this->teacher);
        $request->merge(['course_id' => $this->course->id]);
        $request->setContainer($this->app);

        $this->assertTrue($request->authorize());
    }

    public function test_authorize_returns_false_when_course_id_is_missing()
    {
        $request = new BatchMintCertificatesRequest();
        $request->setUserResolver(fn() => $this->teacher);
        $request->setContainer($this->app);

        $this->assertFalse($request->authorize());
    }

    public function test_rules_require_course_id()
    {
        $request = new BatchMintCertificatesRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('course_id', $rules);
        $this->assertStringContainsString('required', $rules['course_id']);
        $this->assertStringContainsString('integer', $rules['course_id']);
        $this->assertStringContainsString('exists:courses,id', $rules['course_id']);
    }

    public function test_rules_require_student_ids_array()
    {
        $request = new BatchMintCertificatesRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('student_ids', $rules);
        $this->assertStringContainsString('required', $rules['student_ids']);
        $this->assertStringContainsString('array', $rules['student_ids']);
        $this->assertStringContainsString('min:1', $rules['student_ids']);
    }

    public function test_rules_validate_each_student_id()
    {
        $request = new BatchMintCertificatesRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('student_ids.*', $rules);
        $this->assertStringContainsString('required', $rules['student_ids.*']);
        $this->assertStringContainsString('integer', $rules['student_ids.*']);
        $this->assertStringContainsString('exists:users,id', $rules['student_ids.*']);
    }

    public function test_rules_allow_optional_schedule_id()
    {
        $request = new BatchMintCertificatesRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('schedule_id', $rules);
        $this->assertStringContainsString('nullable', $rules['schedule_id']);
        $this->assertStringContainsString('integer', $rules['schedule_id']);
        $this->assertStringContainsString('exists:course_schedules,id', $rules['schedule_id']);
    }

    public function test_validation_fails_when_course_id_is_missing()
    {
        $request = new BatchMintCertificatesRequest();
        $validator = Validator::make(
            ['student_ids' => [$this->students->first()->id]],
            $request->rules()
        );

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('course_id', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_student_ids_is_missing()
    {
        $request = new BatchMintCertificatesRequest();
        $validator = Validator::make(
            ['course_id' => $this->course->id],
            $request->rules()
        );

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('student_ids', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_student_ids_is_empty_array()
    {
        $request = new BatchMintCertificatesRequest();
        $validator = Validator::make(
            [
                'course_id' => $this->course->id,
                'student_ids' => []
            ],
            $request->rules()
        );

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('student_ids', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_student_ids_is_not_array()
    {
        $request = new BatchMintCertificatesRequest();
        $validator = Validator::make(
            [
                'course_id' => $this->course->id,
                'student_ids' => 'not-an-array'
            ],
            $request->rules()
        );

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('student_ids', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_course_does_not_exist()
    {
        $request = new BatchMintCertificatesRequest();
        $validator = Validator::make(
            [
                'course_id' => 999999,
                'student_ids' => [$this->students->first()->id]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('course_id', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_student_does_not_exist()
    {
        $request = new BatchMintCertificatesRequest();
        $validator = Validator::make(
            [
                'course_id' => $this->course->id,
                'student_ids' => [999999]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('student_ids.0', $validator->errors()->toArray());
    }

    public function test_validation_passes_with_valid_single_student()
    {
        $request = new BatchMintCertificatesRequest();
        $validator = Validator::make(
            [
                'course_id' => $this->course->id,
                'student_ids' => [$this->students->first()->id]
            ],
            $request->rules()
        );

        $this->assertFalse($validator->fails());
    }

    public function test_validation_passes_with_valid_multiple_students()
    {
        $request = new BatchMintCertificatesRequest();
        $studentIds = $this->students->pluck('id')->toArray();

        $validator = Validator::make(
            [
                'course_id' => $this->course->id,
                'student_ids' => $studentIds
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

        $request = new BatchMintCertificatesRequest();
        $validator = Validator::make(
            [
                'course_id' => $this->course->id,
                'student_ids' => [$this->students->first()->id],
                'schedule_id' => $schedule->id
            ],
            $request->rules()
        );

        $this->assertFalse($validator->fails());
    }

    public function test_custom_messages_exist()
    {
        $request = new BatchMintCertificatesRequest();
        $messages = $request->messages();

        $this->assertArrayHasKey('student_ids.required', $messages);
        $this->assertArrayHasKey('student_ids.array', $messages);
        $this->assertArrayHasKey('student_ids.min', $messages);
        $this->assertArrayHasKey('student_ids.*.required', $messages);
        $this->assertArrayHasKey('student_ids.*.integer', $messages);
        $this->assertArrayHasKey('student_ids.*.exists', $messages);
    }

    public function test_custom_message_for_student_ids_required()
    {
        $request = new BatchMintCertificatesRequest();
        $messages = $request->messages();

        $this->assertEquals(
            'At least one student must be selected for certificate minting.',
            $messages['student_ids.required']
        );
    }

    public function test_custom_message_for_student_ids_min()
    {
        $request = new BatchMintCertificatesRequest();
        $messages = $request->messages();

        $this->assertEquals(
            'At least one student must be selected for certificate minting.',
            $messages['student_ids.min']
        );
    }

    public function test_failed_validation_behavior_through_reflection()
    {
        $request = new BatchMintCertificatesRequest();
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
        $request = new BatchMintCertificatesRequest();

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

    public function test_validation_fails_with_custom_message_when_no_students_selected()
    {
        $request = new BatchMintCertificatesRequest();
        $validator = Validator::make(
            [
                'course_id' => $this->course->id,
                'student_ids' => []
            ],
            $request->rules(),
            $request->messages()
        );

        $this->assertTrue($validator->fails());
        $errors = $validator->errors();
        $this->assertTrue($errors->has('student_ids'));
        $this->assertEquals(
            'At least one student must be selected for certificate minting.',
            $errors->first('student_ids')
        );
    }
}
