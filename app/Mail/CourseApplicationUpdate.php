<?php

namespace App\Mail;

use App\Models\CourseApplication;
use App\Repositories\SettingRepository;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CourseApplicationUpdate extends Mailable
{
    use Queueable, SerializesModels;

    public $courseApplication;

    public $settingsRepository;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(CourseApplication $courseApplication, $status)
    {
        $this->settingsRepository = new SettingRepository();
        $this->courseApplication  = $courseApplication;
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: "Course Application Update",
            from: new Address($this->settingsRepository->getSetting('no-reply-email')),
            to: [$this->courseApplication->professor->email]
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
            markdown: 'emails.course_application_update',
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
