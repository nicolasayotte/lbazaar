<?php

namespace App\Repositories;

use App\Models\CourseCategory;
use Carbon\Carbon;

class CourseCategoryRepository extends BaseRepository
{
    public const PER_PAGE = 10;

    public function __construct()
    {
        parent::__construct(new CourseCategory());
    }

    public function get($filters)
    {
        $sortFilterArr = explode(':', @$filters['sort'] ?? 'created_at:desc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];

        return $this->model
                    ->where('name', 'LIKE', '%'. @$filters['keyword'] .'%')
                    ->orderBy($sortBy, $sortOrder)
                    ->paginate(self::PER_PAGE)
                    ->through(function($item) {
                        return [
                            'id' => $item->id,
                            'name' => $item->name,
                            'created_at' => Carbon::parse($item->created_at)->format('Y-m-d')
                        ];
                    });
    }

    public function delete($id)
    {
        return $this->model->where('id', $id)->delete();
    }

    public function getDropdownData()
    {
        return $this->model->all()->map(function($data) {
            return [
                'id'   => $data->id,
                'name' => $data->name
            ];
        });
    }
}
