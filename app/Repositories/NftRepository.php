<?php

namespace App\Repositories;

use App\Models\Nft;
use Carbon\Carbon;

class NftRepository extends BaseRepository
{
    public const PER_PAGE = 10;

    public function __construct()
    {
        parent::__construct(new Nft());
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
                            'image_url' => $item->image_url,
                            'points' => $item->points,
                            'for_sale' => $item->for_sale,
                            'created_at' => Carbon::parse($item->created_at)->format('Y-m-d')
                        ];
                    });
    }

    public function getDropdownData()
    {
        return $this->model
                    ->all()
                    ->filter(function ($data) {
                        return $data->for_sale != 0;
                    })
                    ->map(function($data) {
                        return [
                            'id'   => $data->id,
                            'name' => $data->name
                        ];
        });
    }

    public function firstOrCreate($nft)
    {
        return $this->model->firstOrCreate(['name' => $nft->name,
                                            'image_url' => $nft->image_url,
                                            'points' => $nft->points,
                                            'for_sale' => $nft->for_sale,
                                            ]);
    }
    
    public function getNameById($id)
    {
        return $this->model->find($id)->name;
    }

    public function getNftById($id)
    {
        return $this->model->find($id);
    }

    public function findByName($name)
    {
        return $this->model->where('name', $name)->first();
    }
}
