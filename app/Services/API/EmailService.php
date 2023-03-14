<?php

namespace App\Services\API;

use App\Models\UserWallet;
use App\Models\WalletTransactionHistory;
use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\CourseApplicationUpdate;
use App\Mail\WalletUpdateNotification;
use App\Mail\AdminCreateUserNotification;
use App\Mail\DeniedTeacherApplication;
use App\Models\TeacherApplication;
use Exception;

class EmailService
{
    public function sendEmailCourseApplicationUpdate($courseApplication)
    {
        try {
            Mail::send(new CourseApplicationUpdate($courseApplication));
        } catch (\Exception $e) {
            Log::error($e);
        }
    }

    public function sendEmailNotificationUserCreated(User $user, $password)
    {
        $loginUrl = route('portal.login');

        try {
            Mail::send(new AdminCreateUserNotification($user, $password, $loginUrl));
        } catch (\Exception $e) {
            Log::error($e);
        }
    }

    public function sendDeniedTeacherApplicationNOtification(TeacherApplication $teacherApplication)
    {
        try {
            Mail::send(new DeniedTeacherApplication($teacherApplication));
        } catch (Exception $e) {
            Log::error($e->getMessage());
        }
    }

    public function sendEmailNotificationWalletUpdate(User $user, WalletTransactionHistory $walletTransactionHistory)
    {
        try {
            Mail::send(new WalletUpdateNotification($user, $walletTransactionHistory));
        } catch (\Exception $e) {
            Log::error($e);
        }
    }
}
