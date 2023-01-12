<?php

namespace App\Repositories;

use App\Models\Inquiry;
use Carbon\Carbon;

class InquiryRepository extends BaseRepository
{
    public const PER_PAGE = 10;

    public function __construct()
    {
        parent::__construct(new Inquiry());
    }

    public function get($filters)
    {
        $sortFilterArr = explode(':', @$filters['sort'] ?? 'created_at:desc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];

        return $this->model
                    ->where(function($q) use($filters) {
                        $q->where('name', 'LIKE', '%'. @$filters['keyword'] .'%')
                            ->orWhere('email', 'LIKE', '%'. @$filters['keyword'] .'%')
                            ->orWhere('subject', 'LIKE', '%'. @$filters['keyword'] .'%');
                    })
                    ->orderBy($sortBy, $sortOrder)
                    ->paginate(InquiryRepository::PER_PAGE)
                    ->through(function($item) {
                        return [
                            'id'         => $item->id,
                            'name'       => $item->name,
                            'email'      => $item->email,
                            'subject'    => $item->subject,
                            'created_at' => Carbon::parse($item->created_at)->format('Y-m-d')
                        ];
                    });
    }
}
