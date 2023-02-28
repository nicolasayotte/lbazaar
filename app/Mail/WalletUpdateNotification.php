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

class WalletUpdateNotification extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Instance of the \User model
     */
    public $user;


    public $walletTransactionHistory;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($user, $walletTransactionHistory)
    {
        $this->user = $user;
        $this->walletTransactionHistory = $walletTransactionHistory;
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
            subject: 'Wallet Updated',
            from: new Address($settingsRepository->getSetting('no-reply-email')),
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
            markdown: 'emails.wallet_update'
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
