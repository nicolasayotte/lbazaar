<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Status extends Model
{
    use HasFactory;

    public const PENDING  = 'pending';
    public const APPROVED = 'approved';
    public const DENIED   = 'denied';

    public static function getStatusNameByID($id)
    {
        switch ($id) {
            case 1:
                return ucfirst(self::PENDING);
            case 2:
                return ucfirst(self::APPROVED); 
            default:
                return ucfirst(self::DENIED);
        }
    }
}
