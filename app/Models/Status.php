<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Status extends Model
{
    use HasFactory;

    public const PENDING   = 'pending';

    public const APPROVED  = 'approved';

    public const DENIED    = 'denied';

    public const DRAFT     = 'draft';

    public const PUBLISHED = 'published';

    public const COMPLETED = 'completed';

    public const ACTIVE    = 'active';

    public const DISABLED  = 'disabled';

    public const UPCOMING = 'upcoming';

    public const ONGOING = 'ongoing';

    public const DONE = 'done';
}
