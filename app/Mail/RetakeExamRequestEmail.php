<?php

namespace App\Mail;

use App\Models\User as UserModel;
use App\Repositories\SettingRepository;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RetakeExamRequestEmail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * The inquiry instance
     *
     * @var \App\Models\User
     */
    public $userExam;

    public $settingsRepository;
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
        // dd($this->userExam->course->professor->email);
        return new Envelope(
            subject: 'Exam Retake Request from '.$this->userExam->user->first_name . ' ' . $this->userExam->user->last_name,
            from: new Address($this->settingsRepository->getSetting('no-reply-email')),
            to: [$this->userExam->course->professor->email]
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
            markdown: 'emails.request_retake_exam',
            with: [
                'url' => route('schedules.view', [
                    'id' => $this->userExam->course_schedule_id,
                    'keyword' => $this->userExam->user->email
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
