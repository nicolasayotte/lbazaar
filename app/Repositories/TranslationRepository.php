<?php

namespace App\Repositories;

use App\Models\Translation;
use Illuminate\Support\Facades\DB;

class TranslationRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Translation());
    }

    public function getAll()
    {
        return $this->model->orderBy('en', 'asc')->get()->map(function($item) {
            return [
                'key' => $item->key,
                'en'  => $item->en,
                'ja'  => $item->ja
            ];
        });
    }

    public function massUpdate($data)
    {
        foreach ($data as $key => $value) {
            DB::table('translations')
                ->where('key', $key)
                ->update(['ja' => $value]);
        }
    }
}
