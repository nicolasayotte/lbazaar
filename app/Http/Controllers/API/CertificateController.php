<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\User;
use App\Models\UserWallet;
use App\Models\UserExam;
use App\Models\Role;
use App\Services\API\CertificateService;
use Exception;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CertificateController extends Controller
{
    protected $certificateService;

    public function __construct(CertificateService $certificateService)
    {
        $this->middleware('auth');
        $this->middleware('teacher');
        $this->certificateService = $certificateService;
    }

    /**
     * Mint and airdrop certificates to students who successfully completed a course
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function mintAndAirdropCertificates(Request $request)
    {
        try {
            $request->validate([
                'course_id' => 'required|integer|exists:courses,id',
                'schedule_id' => 'nullable|integer|exists:course_schedules,id' // Optional: for specific schedule
            ]);

            $courseId = $request->input('course_id');
            $scheduleId = $request->input('schedule_id');
            $teacherId = Auth::id();

            // Verify the teacher owns this course
            $course = Course::where('id', $courseId)
                          ->where('professor_id', $teacherId)
                          ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to mint certificates for this course.'
                ], 403);
            }

            // Get eligible students who completed the course successfully
            $eligibleStudents = $this->getEligibleStudents($courseId, $scheduleId);

            if ($eligibleStudents->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No eligible students found for certificate minting.',
                    'data' => [
                        'course_id' => $courseId,
                        'eligible_students_count' => 0
                    ]
                ], 404);
            }

            // Process certificate minting and airdrop for each eligible student
            $results = [];
            $successCount = 0;
            $failureCount = 0;

            foreach ($eligibleStudents as $student) {
                try {
                    $result = $this->certificateService->mintAndAirdropCertificate(
                        $course,
                        $student,
                        $scheduleId
                    );

                    $results[] = [
                        'student_id' => $student->id,
                        'student_name' => $student->fullname,
                        'student_email' => $student->email,
                        'success' => $result['success'],
                        'transaction_id' => $result['transaction_id'] ?? null,
                        'wallet_address' => $result['wallet_address'] ?? null,
                        'message' => $result['message'] ?? null
                    ];

                    if ($result['success']) {
                        $successCount++;
                    } else {
                        $failureCount++;
                    }

                } catch (Exception $e) {
                    $failureCount++;
                    $results[] = [
                        'student_id' => $student->id,
                        'student_name' => $student->fullname,
                        'student_email' => $student->email,
                        'success' => false,
                        'transaction_id' => null,
                        'wallet_address' => null,
                        'message' => 'Failed to mint certificate: ' . $e->getMessage()
                    ];

                    Log::error('Certificate minting failed for student ' . $student->id, [
                        'course_id' => $courseId,
                        'student_id' => $student->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Certificate minting completed. Success: {$successCount}, Failed: {$failureCount}",
                'data' => [
                    'course_id' => $courseId,
                    'course_title' => $course->title,
                    'total_eligible_students' => $eligibleStudents->count(),
                    'success_count' => $successCount,
                    'failure_count' => $failureCount,
                    'results' => $results
                ]
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors()
            ], 422);
        } catch (Exception $e) {
            Log::error('Certificate minting API error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing certificate minting: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get students who are eligible for certificates (completed course and passed all exams)
     * 
     * @param int $courseId
     * @param int|null $scheduleId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    protected function getEligibleStudents($courseId, $scheduleId = null)
    {
        $query = CourseHistory::with(['user', 'user.userWallet', 'courseSchedule'])
            ->where('course_id', $courseId)
            ->whereNotNull('completed_at') // Course must be completed
            ->where(function($q) {
                $q->where('is_cancelled', false)
                  ->orWhere('is_cancelled', 0)
                  ->orWhereNull('is_cancelled');
            }); // Not cancelled

        // If schedule_id is provided, filter by specific schedule
        if ($scheduleId) {
            $query->where('course_schedule_id', $scheduleId);
        }

        $completedCourseHistories = $query->get();

        // Filter students who have passed all required exams
        $eligibleStudents = collect();

        foreach ($completedCourseHistories as $courseHistory) {
            $student = $courseHistory->user;
            $schedule = $courseHistory->courseSchedule;

            // Check if student has passed all exams for this course schedule
            if ($this->hasPassedAllExams($student->id, $schedule->id)) {
                $eligibleStudents->push($student);
            }
        }

        return $eligibleStudents->unique('id');
    }

    /**
     * Check if a student has passed all exams for a specific course schedule
     * 
     * @param int $studentId
     * @param int $scheduleId
     * @return bool
     */
    protected function hasPassedAllExams($studentId, $scheduleId)
    {
        // Get total exams for this schedule
        $totalExams = UserExam::where('user_id', $studentId)
            ->where('course_schedule_id', $scheduleId)
            ->count();

        // Get passed exams for this schedule
        $passedExams = UserExam::where('user_id', $studentId)
            ->where('course_schedule_id', $scheduleId)
            ->where('is_passed', 1)
            ->count();

        // If no exams exist, consider it as passed (some courses might not have exams)
        if ($totalExams === 0) {
            return true;
        }

        // All exams must be passed
        return $totalExams === $passedExams;
    }

    /**
     * Get course completion summary for a teacher
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCourseCompletionSummary(Request $request)
    {
        try {
            $teacherId = Auth::id();
            
            // Get all courses for this teacher
            $courses = Course::where('professor_id', $teacherId)
                ->with(['schedules.courseHistories.user'])
                ->get();

            $summary = [];

            foreach ($courses as $course) {
                $courseData = [
                    'course_id' => $course->id,
                    'course_title' => $course->title,
                    'schedules' => []
                ];

                foreach ($course->schedules as $schedule) {
                    $eligibleStudents = $this->getEligibleStudents($course->id, $schedule->id);
                    
                    $courseData['schedules'][] = [
                        'schedule_id' => $schedule->id,
                        'start_datetime' => $schedule->start_datetime,
                        'eligible_students_count' => $eligibleStudents->count(),
                        'eligible_students' => $eligibleStudents->map(function ($student) {
                            return [
                                'id' => $student->id,
                                'name' => $student->fullname,
                                'email' => $student->email
                            ];
                        })
                    ];
                }

                $summary[] = $courseData;
            }

            return response()->json([
                'success' => true,
                'data' => $summary
            ], 200);

        } catch (Exception $e) {
            Log::error('Course completion summary error', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching course completion summary: ' . $e->getMessage()
            ], 500);
        }
    }
}
