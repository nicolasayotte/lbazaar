<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\Role;
use App\Models\User;
use App\Models\UserWallet;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class StudentCertificateTest extends TestCase
{
    use DatabaseTransactions;

    protected User $student;
    protected User $otherStudent;
    protected Course $course;
    protected CourseSchedule $schedule;

    /**
     * Helper method to create users without custodial address generation
     */
    protected function createTestUser(array $attributes = []): User
    {
        // Ensure at least one country exists
        $country = DB::table('countries')->first();
        if (!$country) {
            $countryId = DB::table('countries')->insertGetId([
                'name' => 'Japan',
                'code' => 'JP',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $countryId = $country->id;
        }

        $defaults = [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
            'country_id' => $countryId,
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
            ['key' => 'texts.mypage', 'en' => 'My Page', 'ja' => 'マイページ'],
            ['key' => 'texts.certificates', 'en' => 'Certificates', 'ja' => '証明書'],
        ]);

        // Create roles
        Role::firstOrCreate(['name' => 'student'], ['display_name' => 'Student']);
        Role::firstOrCreate(['name' => 'teacher'], ['display_name' => 'Teacher']);

        // Create test users
        $this->student = $this->createTestUser([
            'first_name' => 'Test',
            'last_name' => 'Student',
            'email' => 'student@example.com'
        ]);
        $this->student->attachRole('student');

        $this->otherStudent = $this->createTestUser([
            'first_name' => 'Other',
            'last_name' => 'Student',
            'email' => 'other@example.com'
        ]);
        $this->otherStudent->attachRole('student');

        // Create course and schedule
        $teacher = $this->createTestUser();
        $teacher->attachRole('teacher');

        $this->course = Course::factory()->create([
            'professor_id' => $teacher->id,
            'certificate_enabled' => true,
            'title' => 'Test Course'
        ]);

        $this->schedule = CourseSchedule::factory()->create([
            'course_id' => $this->course->id,
            'user_id' => $teacher->id
        ]);
    }

    /** @test */
    public function test_student_can_view_their_certificates()
    {
        // Create a completed course with certificate
        CourseHistory::factory()->minted()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        $response = $this->actingAs($this->student)
            ->get('/mypage/certificates');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/MyPage/Badges/Index')
            ->has('certificates')
            ->where('hasButtons', true)
        );
    }

    /** @test */
    public function test_student_only_sees_own_certificates()
    {
        // Create certificate for current student
        CourseHistory::factory()->minted()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        // Create certificate for other student
        CourseHistory::factory()->minted()->create([
            'user_id' => $this->otherStudent->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        $response = $this->actingAs($this->student)
            ->get('/mypage/certificates');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/MyPage/Badges/Index')
            ->has('certificates', 1)
            ->where('certificates.0.course_name', 'Test Course')
        );
    }

    /** @test */
    public function test_certificates_include_correct_status()
    {
        // Create certificates with explicit dates to control ordering
        CourseHistory::factory()->completedEligible()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => now()->subDays(30),
        ]);

        CourseHistory::factory()->minting()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => now()->subDays(20),
        ]);

        CourseHistory::factory()->minted()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => now()->subDays(10),
        ]);

        $response = $this->actingAs($this->student)
            ->get('/mypage/certificates');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/MyPage/Badges/Index')
            ->has('certificates', 3)
            ->where('certificates.0.certificate_status', 'minted')
            ->where('certificates.1.certificate_status', 'minting')
            ->where('certificates.2.certificate_status', 'eligible')
        );
    }

    /** @test */
    public function test_minted_certificates_include_explorer_url()
    {
        // Create minted certificate
        $history = CourseHistory::factory()->minted()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        $response = $this->actingAs($this->student)
            ->get('/mypage/certificates');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/MyPage/Badges/Index')
            ->has('certificates', 1)
            ->where('certificates.0.certificate_status', 'minted')
            ->where('certificates.0.certificate_tx_hash', $history->certificate_tx_hash)
            ->has('certificates.0.certificate_explorer_url')
        );
    }

    /** @test */
    public function test_only_completed_courses_show_certificates()
    {
        // Create completed course
        CourseHistory::factory()->minted()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        // Create incomplete course (no completed_at)
        CourseHistory::create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
            'completed_at' => null,
            'certificate_status' => null,
        ]);

        $response = $this->actingAs($this->student)
            ->get('/mypage/certificates');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/MyPage/Badges/Index')
            ->has('certificates', 1)
            ->where('certificates.0.certificate_status', 'minted')
        );
    }

    /** @test */
    public function test_courses_without_certificate_enabled_excluded()
    {
        // Create course without certificate enabled
        $noCertCourse = Course::factory()->create([
            'professor_id' => $this->course->professor_id,
            'certificate_enabled' => false,
            'title' => 'No Certificate Course'
        ]);

        $noCertSchedule = CourseSchedule::factory()->create([
            'course_id' => $noCertCourse->id,
            'user_id' => $this->course->professor_id
        ]);

        // Create completed history for non-certificate course
        CourseHistory::factory()->completed()->create([
            'user_id' => $this->student->id,
            'course_id' => $noCertCourse->id,
            'course_schedule_id' => $noCertSchedule->id,
        ]);

        // Create completed history for certificate-enabled course
        CourseHistory::factory()->minted()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        $response = $this->actingAs($this->student)
            ->get('/mypage/certificates');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/MyPage/Badges/Index')
            ->has('certificates', 1)
            ->where('certificates.0.course_name', 'Test Course')
        );
    }

    /** @test */
    public function test_guest_cannot_access_certificates_page()
    {
        $response = $this->get('/mypage/certificates');

        $response->assertRedirect();
    }

    /** @test */
    public function test_student_can_get_certificate_status_via_ajax()
    {
        $history = CourseHistory::factory()->minted()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        $response = $this->actingAs($this->student)
            ->getJson("/mypage/certificates/{$history->id}/status");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'certificate_status' => 'minted',
                    'certificate_tx_hash' => $history->certificate_tx_hash,
                ]
            ]);
    }

    /** @test */
    public function test_student_cannot_access_other_students_certificate_status()
    {
        // Create certificate for other student
        $otherHistory = CourseHistory::factory()->minted()->create([
            'user_id' => $this->otherStudent->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        // Current student tries to access other student's certificate
        $response = $this->actingAs($this->student)
            ->getJson("/mypage/certificates/{$otherHistory->id}/status");

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Certificate not found'
            ]);
    }

    /** @test */
    public function test_eager_loading_shows_correct_certificate_transactions()
    {
        // Create NFT transactions for both students
        $transaction1 = \App\Models\NftTransactions::factory()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id,
            'nft_name' => 'Student1_Certificate',
            'metadata' => json_encode(['image' => 'https://example.com/cert1.png'])
        ]);

        $transaction2 = \App\Models\NftTransactions::factory()->create([
            'user_id' => $this->otherStudent->id,
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id,
            'nft_name' => 'Student2_Certificate',
            'metadata' => json_encode(['image' => 'https://example.com/cert2.png'])
        ]);

        // Create course histories
        CourseHistory::factory()->minted()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        CourseHistory::factory()->minted()->create([
            'user_id' => $this->otherStudent->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        // Test that student1 sees only their certificate (eager loading happens in controller)
        $response = $this->actingAs($this->student)
            ->get('/mypage/certificates');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/MyPage/Badges/Index')
            ->has('certificates', 1)
            ->where('certificates.0.course_name', 'Test Course')
        );
    }

    /** @test */
    public function test_certificate_image_url_from_nft_transaction()
    {
        $imageUrl = 'https://example.com/certificate-student1.png';

        // Create NFT transaction with metadata
        \App\Models\NftTransactions::factory()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'schedule_id' => $this->schedule->id,
            'metadata' => json_encode(['image' => $imageUrl])
        ]);

        // Create course history
        $history = CourseHistory::factory()->minted()->create([
            'user_id' => $this->student->id,
            'course_id' => $this->course->id,
            'course_schedule_id' => $this->schedule->id,
        ]);

        // Load history with relationship
        $loadedHistory = CourseHistory::with('possibleCertificateTransactions')->find($history->id);

        // Verify image URL is retrieved correctly
        $this->assertEquals($imageUrl, $loadedHistory->certificate_image_url);
    }

    /** @test */
    public function test_multiple_students_see_own_certificates_with_eager_loading()
    {
        // Create 3 more students for comprehensive test
        $students = [$this->student, $this->otherStudent];

        for ($i = 3; $i <= 5; $i++) {
            $student = $this->createTestUser([
                'first_name' => "Student{$i}",
                'last_name' => 'Test',
                'email' => "student{$i}@example.com"
            ]);
            $student->attachRole('student');
            $students[] = $student;
        }

        // Create course histories and NFT transactions for all students
        foreach ($students as $index => $student) {
            CourseHistory::factory()->minted()->create([
                'user_id' => $student->id,
                'course_id' => $this->course->id,
                'course_schedule_id' => $this->schedule->id,
            ]);

            \App\Models\NftTransactions::factory()->create([
                'user_id' => $student->id,
                'course_id' => $this->course->id,
                'schedule_id' => $this->schedule->id,
                'nft_name' => "Certificate_Student_{$index}",
            ]);
        }

        // Each student should see only their own certificate when using eager loading
        foreach ($students as $index => $student) {
            $response = $this->actingAs($student)
                ->get('/mypage/certificates');

            $response->assertStatus(200);
            $response->assertInertia(fn ($page) => $page
                ->component('Portal/MyPage/Badges/Index')
                ->has('certificates', 1)
                ->where('certificates.0.course_name', 'Test Course')
            );
        }
    }
}
