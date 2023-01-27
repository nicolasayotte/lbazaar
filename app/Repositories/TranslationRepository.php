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


    /**
     * Imitates the output of the trans('messages') function.
     * The only difference is the data is from the database
     */
    public function getTranslations()
    {
        $translations = $this->getAll();

        if (@$translations && @$translations->count() <= 0) {
            return trans('messages');
        }

        $returnData = [];

        foreach ($translations as $translation) {
            $translationKeys = explode('.', $translation['key']);

            $row = [];

            for ($index = count($translationKeys) - 1; $index >= 0; $index--) {
                $row = [
                    "{$translationKeys[$index]}" => count($translationKeys) - 1 == $index ? $translation[app()->getLocale()] : $row
                ];
            }

            $returnData = array_merge_recursive($returnData, $row);
        }

        return $returnData;
    }
}
