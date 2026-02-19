<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\User;
use App\Models\UserWallet;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ManageClassCertificatesTest extends TestCase
{
    protected User $teacher;
    protected User $otherTeacher;
    protected Course $course;
    protected Course $otherCourse;

    /**
     * Helper method to create users without custodial address generation
     */
    protected function createTestUser(array $attributes = []): User
    {
        // Get first country or create one
        $country = DB::table('countries')->first();
        if (!$country) {
            $countryId = DB::table('countries')->insertGetId(['name' => 'Japan', 'code' => 'JP']);
            $country = DB::table('countries')->find($countryId);
        }

        $defaults = [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
            'country_id' => $country->id,
            'is_temp_password' => false,
            'is_enabled' => true,
            'custodial_address' => 'addr_test_dummy_' . uniqid(),
            'commission_rate' => 10,
            'commission_earn_rate' => 10,
        ];

        $userData = array_merge($defaults, $attributes);

        $userId = DB::table('users')->insertGetId($userData);
        return User::find($userId);
    }

    protected function setUp(): void
    {
        parent::setUp();

        // Create translations needed by controller
        DB::table('translations')->insertOrIgnore([
            ['key' => 'title.class.manage.view', 'en' => 'Manage Class', 'ja' => 'クラス管理'],
            ['key' => 'title.certificates', 'en' => 'Certificates', 'ja' => '証明書'],
            ['key' => 'title.feedbacks', 'en' => 'Feedbacks', 'ja' => 'フィードバック'],
        ]);

        // Create roles
        $this->createRoles(['teacher', 'student']);

        // Create teachers
        $this->teacher = $this->createTestUser();
        $this->teacher->attachRole('teacher');

        $this->otherTeacher = $this->createTestUser();
        $this->otherTeacher->attachRole('teacher');

        // Create courses
        $this->course = Course::factory()->create([
            'professor_id' => $this->teacher->id,
            'certificate_enabled' => true
        ]);

        $this->otherCourse = Course::factory()->create([
            'professor_id' => $this->otherTeacher->id,
            'certificate_enabled' => true
        ]);
    }

    /** @test */
    public function teacher_can_access_own_course_certificates_page()
    {
        // Create a completed student with certificate
        $student = $this->createTestUser();
        $student->attachRole('student');

        UserWallet::factory()->create([
            'user_id' => $student->id,
            'address' => 'addr_test1234567890abcdef'
        ]);

        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id' => $this->teacher->id
        ]);

        CourseHistory::create([
            'user_id' => $student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now(),
            'certificate_status' => 'minted',
            'certificate_tx_hash' => 'abc123def456',
            'certificate_minted_at' => now()
        ]);

        // Teacher accesses their own course certificates page
        $response = $this->actingAs($this->teacher)
            ->get("/mypage/manage-class/{$this->course->id}/certificates");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/MyPage/ManageClass/Certificates')
            ->has('course')
            ->has('students')
            ->where('tabValue', 'certificates')
            ->where('courseId', $this->course->id)
        );
    }

    /** @test */
    public function teacher_cannot_access_other_teachers_certificates_page()
    {
        // Teacher tries to access another teacher's course certificates
        $response = $this->actingAs($this->teacher)
            ->get("/mypage/manage-class/{$this->otherCourse->id}/certificates");

        $response->assertStatus(404);
    }

    /** @test */
    public function certificates_page_shows_correct_student_data()
    {
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id' => $this->teacher->id
        ]);

        // Create completed students with different certificate statuses
        $student1 = $this->createTestUser([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com'
        ]);
        $student1->attachRole('student');

        UserWallet::factory()->create([
            'user_id' => $student1->id,
            'address' => 'addr_test1111111111'
        ]);

        CourseHistory::create([
            'user_id' => $student1->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(5),
            'certificate_status' => 'minted',
            'certificate_tx_hash' => 'tx_hash_123',
            'certificate_minted_at' => now()->subDays(4)
        ]);

        $student2 = $this->createTestUser([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane@example.com'
        ]);
        $student2->attachRole('student');

        CourseHistory::create([
            'user_id' => $student2->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now()->subDays(2),
            'certificate_status' => null,
            'certificate_tx_hash' => null,
            'certificate_minted_at' => null
        ]);

        // Access certificates page
        $response = $this->actingAs($this->teacher)
            ->get("/mypage/manage-class/{$this->course->id}/certificates");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/MyPage/ManageClass/Certificates')
            ->has('students', 2)
            ->where('students.0.name', 'John Doe')
            ->where('students.0.email', 'john@example.com')
            ->where('students.0.wallet_address', 'addr_test1111111111')
            ->where('students.0.certificate_status', 'minted')
            ->where('students.0.certificate_tx_hash', 'tx_hash_123')
            ->where('students.1.name', 'Jane Smith')
            ->where('students.1.email', 'jane@example.com')
            ->where('students.1.certificate_status', 'eligible')
        );
    }

    /** @test */
    public function certificates_page_only_shows_completed_students()
    {
        $schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id' => $this->teacher->id
        ]);

        // Create one completed student
        $completedStudent = $this->createTestUser([
            'first_name' => 'Completed',
            'last_name' => 'Student'
        ]);
        $completedStudent->attachRole('student');

        CourseHistory::create([
            'user_id' => $completedStudent->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => now(),
            'certificate_status' => 'minted'
        ]);

        // Create one ongoing student (not completed)
        $ongoingStudent = $this->createTestUser([
            'first_name' => 'Ongoing',
            'last_name' => 'Student'
        ]);
        $ongoingStudent->attachRole('student');

        CourseHistory::create([
            'user_id' => $ongoingStudent->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $schedule->id,
            'completed_at' => null,
            'certificate_status' => null
        ]);

        // Access certificates page
        $response = $this->actingAs($this->teacher)
            ->get("/mypage/manage-class/{$this->course->id}/certificates");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/MyPage/ManageClass/Certificates')
            ->has('students', 1)
            ->where('students.0.name', 'Completed Student')
        );
    }

    /** @test */
    public function guest_cannot_access_certificates_page()
    {
        $response = $this->get("/mypage/manage-class/{$this->course->id}/certificates");

        $response->assertRedirect('/portal/login');
    }

    /** @test */
    public function non_teacher_cannot_access_certificates_page()
    {
        $student = $this->createTestUser();
        $student->attachRole('student');

        $response = $this->actingAs($student)
            ->get("/mypage/manage-class/{$this->course->id}/certificates");

        // Middleware redirects non-teachers rather than returning 403
        $response->assertStatus(302);
    }
}
