<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\NftTransactions;
use App\Models\Nft;

class CourseHistory extends Model
{
    use HasFactory;

    const ONGOING   = "Ongoing";

    const COMPLETED = "Completed";

    protected $fillable = [
        'user_id',
        'course_id',
        'course_schedule_id',
        'completed_at',
        'is_cancelled',
        'is_watched',
        'certificate_status',
        'certificate_tx_hash',
        'certificate_minted_at',
        'payment_status',
        'payment_tx_hash',
        'payment_ada_amount',
        'payment_submitted_at',
        'payment_confirmed_at',
        'rewards_invalidated_at',
        'rewards_notification_sent_at',
        'token_reward_status',
        'token_reward_tx_hash',
        'token_reward_minted_at',
        'enrolled_certificate_enabled',
        'enrolled_certificate_name',
        'enrolled_certificate_description',
        'enrolled_certificate_image_url',
        'enrolled_token_reward_enabled',
        'enrolled_token_reward_amount',
    ];

    protected $casts = [
        'certificate_minted_at' => 'datetime',
        'payment_submitted_at' => 'datetime',
        'payment_confirmed_at' => 'datetime',
        'rewards_invalidated_at' => 'datetime',
        'rewards_notification_sent_at' => 'datetime',
        'payment_ada_amount' => 'decimal:6',
        'token_reward_minted_at' => 'datetime',
        'enrolled_certificate_enabled' => 'boolean',
        'enrolled_token_reward_enabled' => 'boolean',
        'enrolled_token_reward_amount' => 'integer',
    ];

    public function courseSchedule()
    {
        return $this->belongsTo(CourseSchedule::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the NFT transaction record for this course completion certificate
     *
     * CRITICAL FIX for eager loading bug:
     *
     * Problem: The original used `->where('user_id', $this->user_id)` which fails during
     * eager loading because Laravel builds ONE query for ALL models, and $this->user_id
     * uses the LAST model's value for all records, causing students to see wrong certificates.
     *
     * Solution: Load ALL transactions for the course_ids, then manually match in PHP.
     * This is done via the getCertificateTransactionAttribute accessor below.
     *
     * Usage: CourseHistory::with('possibleCertificateTransactions')->get()
     * Then access: $history->certificateTransaction (uses accessor)
     */
    public function possibleCertificateTransactions()
    {
        // Load ALL transactions for this course - we'll filter in PHP
        return $this->hasMany(NftTransactions::class, 'course_id', 'course_id');
    }

    /**
     * Accessor to get the correct certificate transaction
     * This handles the composite key matching that Laravel can't do natively
     */
    public function getCertificateTransactionAttribute()
    {
        // If we've eager loaded possibleCertificateTransactions, filter them
        if ($this->relationLoaded('possibleCertificateTransactions')) {
            return $this->possibleCertificateTransactions->first(function ($transaction) {
                return $transaction->user_id == $this->user_id
                    && $transaction->schedule_id == $this->course_schedule_id;
            });
        }

        // Otherwise, query directly (lazy loading)
        return NftTransactions::where('user_id', $this->user_id)
            ->where('course_id', $this->course_id)
            ->where('schedule_id', $this->course_schedule_id)
            ->first();
    }

    /**
     * Get certificate image URL from NFT metadata or Nft model
     */
    public function getCertificateImageUrlAttribute()
    {
        $transaction = $this->certificateTransaction;

        if ($transaction) {
            if ($transaction->metadata) {
                $metadata = json_decode($transaction->metadata, true);
                if (isset($metadata['image'])) {
                    return $metadata['image'];
                }
            }

            if ($transaction->nft_id) {
                $nft = Nft::find($transaction->nft_id);
                if ($nft && $nft->image_url) {
                    return $nft->image_url;
                }
            }
        }

        return null;
    }

    /**
     * Get Cardano explorer URL for certificate transaction
     */
    public function getCertificateExplorerUrlAttribute()
    {
        if (!$this->certificate_tx_hash) {
            return null;
        }

        return config('services.cardano.explorer_url') . '/tx/' . $this->certificate_tx_hash;
    }

    /**
     * Return the certificate_enabled value that was active at enrollment time.
     * For post-migration rows (enrolled_certificate_enabled is not null), return the
     * snapshot. For pre-migration rows fall back to the current course setting.
     */
    public function effectiveCertificateEnabled(): bool
    {
        if ($this->enrolled_certificate_enabled !== null) {
            return (bool) $this->enrolled_certificate_enabled;
        }

        return (bool) ($this->course?->certificate_enabled ?? false);
    }

    /**
     * Return the certificate_name that was active at enrollment time.
     */
    public function effectiveCertificateName(): ?string
    {
        if ($this->enrolled_certificate_enabled !== null) {
            return $this->enrolled_certificate_name;
        }

        return $this->course?->certificate_name;
    }

    /**
     * Return the certificate_description that was active at enrollment time.
     */
    public function effectiveCertificateDescription(): ?string
    {
        if ($this->enrolled_certificate_enabled !== null) {
            return $this->enrolled_certificate_description;
        }

        return $this->course?->certificate_description;
    }

    /**
     * Return the certificate_image_url that was active at enrollment time.
     */
    public function effectiveCertificateImageUrl(): ?string
    {
        if ($this->enrolled_certificate_enabled !== null) {
            return $this->enrolled_certificate_image_url;
        }

        return $this->course?->certificate_image_url;
    }

    /**
     * Return the token_reward_enabled value that was active at enrollment time.
     */
    public function effectiveTokenRewardEnabled(): bool
    {
        if ($this->enrolled_certificate_enabled !== null) {
            return (bool) $this->enrolled_token_reward_enabled;
        }

        return (bool) ($this->course?->token_reward_enabled ?? false);
    }

    /**
     * Return the token_reward_amount that was active at enrollment time.
     */
    public function effectiveTokenRewardAmount(): ?int
    {
        if ($this->enrolled_certificate_enabled !== null) {
            return $this->enrolled_token_reward_amount;
        }

        return $this->course?->token_reward_amount;
    }

    public function getCreatedAtAttribute($value)
    {
        return Carbon::parse($value)->format('M j, Y');
    }
}
