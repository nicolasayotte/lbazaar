<?php

namespace App\Mail;

use App\Repositories\SettingRepository;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ExamCleared extends Mailable
{
    use Queueable, SerializesModels;

    public $userExam;

    private $settingsRepository;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($userExam)
    {
        $this->settingsRepository = new SettingRepository();
        $this->userExam = $userExam;
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: 'Retake Exam Request Approved',
            from: new Address($this->settingsRepository->getSetting('no-reply-email')),
            to: $this->userExam->user->email
        );
    }

    /**
     * Get the message content definition.
     *
     * @return \Illuminate\Mail\Mailables\Content
     */
    public function content()
    {
        return new Content(
            markdown: 'emails.exam_cleared',
            with: [
                'url' => route('course.attend.exams.view', [
                    'course_id'   => $this->userExam->course->id,
                    'schedule_id' => $this->userExam->course_schedule_id,
                    'id'          => $this->userExam->exam_id
                ])
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array
     */
    public function attachments()
    {
        return [];
    }
}
