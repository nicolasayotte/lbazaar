<?php

namespace App\Mail;

use App\Models\Inquiry as InquiryModel;
use App\Repositories\SettingRepository;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class Inquiry extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * The inquiry instance
     *
     * @var \App\Models\Inquiry
     */
    public $inquiry;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(InquiryModel $inquiry)
    {
        $this->inquiry = $inquiry;
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        $settingRepository = new SettingRepository();

        return new Envelope(
            subject: $this->inquiry->subject,
            from: new Address($settingRepository->getSetting('no-reply-email'), $this->inquiry->name),
            to: [$settingRepository->getSetting('inquiry-receiver-email')]
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
            markdown: 'emails.inquiry',
            with: [
                'inquiry' => $this->inquiry
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
