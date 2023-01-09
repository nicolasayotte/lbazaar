<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminCreateUserNotification extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Instance of the \User model
     */
    public $user;

    /**
     * The random generated password string (not hashed)
     */
    public $temp_password;

    /**
     * The login url which the user will be redirect to
     */
    public $login_url;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(User $user, string $temp_password, string $login_url)
    {
        $this->user          = $user;
        $this->temp_password = $temp_password;
        $this->login_url     = $login_url;
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: 'Account successfully created',
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
            markdown: 'emails.create_user'
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
