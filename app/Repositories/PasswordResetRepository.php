<?php

namespace App\Repositories;

use App\Models\CourseType;
use App\Models\PasswordReset;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class PasswordResetRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new PasswordReset());
    }

    public function findByToken($token)
    {
        $this->model->where('token', Hash::make($token))->first();
    }
}
