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

class DeniedTeacherApplication extends Mailable
{
    use Queueable, SerializesModels;

    public $teacherApplication;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($teacherApplication)
    {
        $this->teacherApplication = $teacherApplication;
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        $settingsRepository = new SettingRepository();

        return new Envelope(
            subject: 'Your application has been denied',
            from: new Address($settingsRepository->getSetting('no-reply-email')),
            to: [$this->teacherApplication->email]
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
            markdown: 'emails.denied_teacher_application',
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
