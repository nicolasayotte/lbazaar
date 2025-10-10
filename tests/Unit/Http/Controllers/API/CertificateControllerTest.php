<?php

namespace Tests\Unit\Http\Controllers\API;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\WithFaker;
use App\Http\Controllers\API\CertificateController;
use App\Services\API\CertificateService;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\UserExam;
use App\Models\UserWallet;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Mockery;

class CertificateControllerTest extends TestCase
{
    use DatabaseTransactions, WithFaker;

    protected $certificateService;
    protected $controller;
    protected $teacher;
    protected $student;
    protected $course;
    protected $schedule;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->certificateService = Mockery::mock(CertificateService::class);
        $this->controller = new CertificateController($this->certificateService);
        
        // Create test data
        $this->setupTestData();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function setupTestData()
    {
        // Create roles
        Role::firstOrCreate(['name' => 'teacher'], ['display_name' => 'Teacher']);
        Role::firstOrCreate(['name' => 'student'], ['display_name' => 'Student']);

        // Create teacher
        $this->teacher = User::factory()->create([
            'email' => 'teacher@example.com',
            'first_name' => 'John',
            'last_name' => 'Teacher'
        ]);
        $this->teacher->attachRole('teacher');

        // Create student
        $this->student = User::factory()->create([
            'email' => 'student@example.com',
            'first_name' => 'Jane',
            'last_name' => 'Student'
        ]);
        $this->student->attachRole('student');

        // Create user wallet for student
        UserWallet::factory()->create([
            'user_id' => $this->student->id,
            'points' => 100,
            'stake_key_hash' => 'abc123def456'
        ]);

        // Create course
        $this->course = Course::factory()->create([
            'title' => 'Test Course',
            'professor_id' => $this->teacher->id,
            'price' => 50
        ]);

        // Create course schedule
        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id' => $this->teacher->id,
            'start_datetime' => now(),
            'end_datetime' => now()->addHours(2)
        ]);

        // Create completed course history
        CourseHistory::factory()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false
        ]);
    }

    public function test_mint_and_airdrop_certificates_requires_authentication()
    {
        // Test that without authentication, Auth::id() returns null
        $request = Request::create('/api/certificates/mint-and-airdrop', 'POST', [
            'course_id' => $this->course->id
        ]);

        // Without authentication, Auth::id() should return null
        $this->assertNull(Auth::id());
        
        // This should fail because teacherId will be null and course lookup will fail
        $response = $this->controller->mintAndAirdropCertificates($request);
        
        $this->assertEquals(403, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertFalse($data['success']);
        $this->assertStringContainsString('You do not have permission', $data['message']);
    }

    public function test_mint_and_airdrop_certificates_validates_required_parameters()
    {
        Auth::login($this->teacher);

        $request = Request::create('/api/certificates/mint-and-airdrop', 'POST', []);

        $response = $this->controller->mintAndAirdropCertificates($request);

        $this->assertEquals(422, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('errors', $responseData);
    }

    public function test_mint_and_airdrop_certificates_rejects_unauthorized_teacher()
    {
        $otherTeacher = User::factory()->create();
        $otherTeacher->attachRole('teacher');
        Auth::login($otherTeacher);

        $request = Request::create('/api/certificates/mint-and-airdrop', 'POST', [
            'course_id' => $this->course->id
        ]);

        $response = $this->controller->mintAndAirdropCertificates($request);

        $this->assertEquals(403, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertFalse($responseData['success']);
        $this->assertStringContainsString('permission', $responseData['message']);
    }

    public function test_mint_and_airdrop_certificates_returns_empty_when_no_eligible_students()
    {
        Auth::login($this->teacher);

        // Create a course with no completed students
        $emptyCourse = Course::factory()->create([
            'title' => 'Empty Course',
            'professor_id' => $this->teacher->id
        ]);

        $request = Request::create('/api/certificates/mint-and-airdrop', 'POST', [
            'course_id' => $emptyCourse->id
        ]);

        $response = $this->controller->mintAndAirdropCertificates($request);

        $this->assertEquals(404, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertFalse($responseData['success']);
        $this->assertStringContainsString('No eligible students', $responseData['message']);
    }

    public function test_mint_and_airdrop_certificates_processes_eligible_students_successfully()
    {
        Auth::login($this->teacher);

        // Mock successful certificate service response
        $this->certificateService
            ->shouldReceive('mintAndAirdropCertificate')
            ->once()
            ->with(
                \Mockery::on(function($course) {
                    return $course instanceof \App\Models\Course && $course->id === $this->course->id;
                }),
                \Mockery::on(function($student) {
                    return $student instanceof \App\Models\User && $student->id === $this->student->id;
                }),
                null
            )
            ->andReturn([
                'success' => true,
                'transaction_id' => 'tx123abc',
                'wallet_address' => 'addr1test123',
                'message' => null
            ]);

        $request = Request::create('/api/certificates/mint-and-airdrop', 'POST', [
            'course_id' => $this->course->id
        ]);

        $response = $this->controller->mintAndAirdropCertificates($request);

        $this->assertEquals(200, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals(1, $responseData['data']['success_count']);
        $this->assertEquals(0, $responseData['data']['failure_count']);
        $this->assertCount(1, $responseData['data']['results']);
    }

    public function test_mint_and_airdrop_certificates_handles_service_failures()
    {
        Auth::login($this->teacher);

        // Mock failed certificate service response
        $this->certificateService
            ->shouldReceive('mintAndAirdropCertificate')
            ->once()
            ->with($this->course, $this->student, null)
            ->andReturn([
                'success' => false,
                'message' => 'Minting failed'
            ]);

        $request = Request::create('/api/certificates/mint-and-airdrop', 'POST', [
            'course_id' => $this->course->id
        ]);

        $response = $this->controller->mintAndAirdropCertificates($request);

        $this->assertEquals(200, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals(0, $responseData['data']['success_count']);
        $this->assertEquals(1, $responseData['data']['failure_count']);
    }

    public function test_mint_and_airdrop_certificates_filters_by_schedule_id()
    {
        Auth::login($this->teacher);

        // Create another schedule
        $otherSchedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id' => $this->teacher->id
        ]);

        // Create another student with different schedule
        $otherStudent = User::factory()->create();
        $otherStudent->attachRole('student');
        UserWallet::factory()->create(['user_id' => $otherStudent->id]);
        
        CourseHistory::factory()->create([
            'user_id' => $otherStudent->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $otherSchedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => false
        ]);

        // Mock service call - should only be called once for the specific schedule
        $this->certificateService
            ->shouldReceive('mintAndAirdropCertificate')
            ->once()
            ->with($this->course, $this->student, $this->schedule->id)
            ->andReturn(['success' => true, 'transaction_id' => 'tx123']);

        $request = Request::create('/api/certificates/mint-and-airdrop', 'POST', [
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id
        ]);

        $response = $this->controller->mintAndAirdropCertificates($request);

        $this->assertEquals(200, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals(1, $responseData['data']['total_eligible_students']);
    }

    public function test_get_course_completion_summary_returns_teacher_courses()
    {
        Auth::login($this->teacher);

        $request = Request::create('/api/certificates/completion-summary', 'GET');

        $response = $this->controller->getCourseCompletionSummary($request);

        $this->assertEquals(200, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertCount(1, $responseData['data']); // One course
        $this->assertEquals($this->course->id, $responseData['data'][0]['course_id']);
    }

    public function test_has_passed_all_exams_returns_true_when_no_exams()
    {
        Auth::login($this->teacher);

        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('hasPassedAllExams');
        $method->setAccessible(true);

        $result = $method->invokeArgs($this->controller, [$this->student->id, $this->schedule->id]);

        $this->assertTrue($result);
    }

    public function test_has_passed_all_exams_returns_true_when_all_passed()
    {
        Auth::login($this->teacher);

        // Create passed exam
        UserExam::factory()->create([
            'user_id' => $this->student->id,
            'course_schedule_id' => $this->schedule->id,
            'is_passed' => 1
        ]);

        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('hasPassedAllExams');
        $method->setAccessible(true);

        $result = $method->invokeArgs($this->controller, [$this->student->id, $this->schedule->id]);

        $this->assertTrue($result);
    }

    public function test_has_passed_all_exams_returns_false_when_some_failed()
    {
        Auth::login($this->teacher);

        // Create passed and failed exams
        UserExam::factory()->create([
            'user_id' => $this->student->id,
            'course_schedule_id' => $this->schedule->id,
            'is_passed' => 1
        ]);
        
        UserExam::factory()->create([
            'user_id' => $this->student->id,
            'course_schedule_id' => $this->schedule->id,
            'is_passed' => 0
        ]);

        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('hasPassedAllExams');
        $method->setAccessible(true);

        $result = $method->invokeArgs($this->controller, [$this->student->id, $this->schedule->id]);

        $this->assertFalse($result);
    }

    public function test_get_eligible_students_filters_completed_courses()
    {
        Auth::login($this->teacher);

        // Create student with incomplete course
        $incompleteStudent = User::factory()->create();
        $incompleteStudent->attachRole('student');
        UserWallet::factory()->create(['user_id' => $incompleteStudent->id]);
        
        CourseHistory::factory()->create([
            'user_id' => $incompleteStudent->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => null, // Not completed
            'is_cancelled' => false
        ]);

        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('getEligibleStudents');
        $method->setAccessible(true);

        $result = $method->invokeArgs($this->controller, [$this->course->id, null]);

        $this->assertCount(1, $result); // Only the completed student
        $this->assertEquals($this->student->id, $result->first()->id);
    }

    public function test_get_eligible_students_filters_cancelled_courses()
    {
        Auth::login($this->teacher);

        // Create student with cancelled course
        $cancelledStudent = User::factory()->create();
        $cancelledStudent->attachRole('student');
        UserWallet::factory()->create(['user_id' => $cancelledStudent->id]);
        
        CourseHistory::factory()->create([
            'user_id' => $cancelledStudent->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => now()->subDays(1),
            'is_cancelled' => true // Cancelled
        ]);

        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('getEligibleStudents');
        $method->setAccessible(true);

        $result = $method->invokeArgs($this->controller, [$this->course->id, null]);

        $this->assertCount(1, $result); // Only the non-cancelled student
        $this->assertEquals($this->student->id, $result->first()->id);
    }

    public function test_controller_handles_service_exceptions()
    {
        Auth::login($this->teacher);

        // Mock service to throw exception
        $this->certificateService
            ->shouldReceive('mintAndAirdropCertificate')
            ->once()
            ->andThrow(new \Exception('Service error'));

        $request = Request::create('/api/certificates/mint-and-airdrop', 'POST', [
            'course_id' => $this->course->id
        ]);

        $response = $this->controller->mintAndAirdropCertificates($request);

        $this->assertEquals(200, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals(0, $responseData['data']['success_count']);
        $this->assertEquals(1, $responseData['data']['failure_count']);
        $this->assertStringContainsString('Service error', $responseData['data']['results'][0]['message']);
    }
}
