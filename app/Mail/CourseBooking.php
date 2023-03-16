<?php

namespace App\Mail;

use App\Models\Course;
use App\Models\CourseApplication;
use App\Models\CourseSchedule;
use App\Repositories\SettingRepository;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CourseBooking extends Mailable
{
    use Queueable, SerializesModels;

    public $schedule;

    public $course;

    public $user;

    public $settingsRepository;

    public $url;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(CourseSchedule $schedule, $user, $url)
    {
        $this->settingsRepository = new SettingRepository();

        $this->schedule = $schedule;
        $this->course   = $schedule->course;
        $this->user     = $user;
        $this->url      = $url;
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: "Class Booking Details",
            from: new Address($this->settingsRepository->getSetting('no-reply-email')),
            to: [$this->user->email]
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
            markdown: 'emails.course_booking',
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
