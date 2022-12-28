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
        if (@$filters['sort']) {
            $sortFilterArr = explode(':', $filters['sort']);

            $sortBy = $sortFilterArr[0];
            $sortOrder = $sortFilterArr[1];
        } else {
            $sortBy = 'created_at';
            $sortOrder = 'desc';
        }

        return $this->model
                    ->where(function($q) use($filters) {
                        $q->where('name', 'LIKE', '%'. @$filters['keyword'] .'%')
                            ->orWhere('subject', 'LIKE', '%'. @$filters['keyword'] .'%');
                    })
                    ->orderBy($sortBy, $sortOrder)
                    ->paginate(InquiryRepository::PER_PAGE)
                    ->through(function($item) {
                        return [
                            'id' => $item->id,
                            'name' => $item->name,
                            'subject' => $item->subject,
                            'created_at' => Carbon::parse($item->created_at)->format('Y-m-d')
                        ];
                    });
    }
}
