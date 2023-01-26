<?php

namespace Database\Seeders;

use App\Models\Translation;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TranslationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $locales = Translation::LOCALES;

        $insertData = [];

        foreach ($locales as $locale) {
            app()->setLocale($locale);

            $messagesArr = trans('messages');

            $flatMessagesArr = $this->flatten($messagesArr, '');

            $this->formatForInsert($flatMessagesArr, $insertData);
        }

        Translation::insert($insertData);
    }

    /**
     * Flatten multidimensional arrays
     *
     * ex. $array['key1']['key2'] = $array['key1.key2']
     *
     * @param array $array The multidimensional array that will be flattened
     * @param string $prefix The prefix for array keys
     * @return array
     */
    private function flatten($array, $prefix = '')
    {
        $result = [];

        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $result = array_merge($result, $this->flatten($value, $prefix . $key . '.'));
            } else {
                $result[$prefix . $key] = $value;
            }
        }

        return $result;
    }

    /**
     * Format the given array to be ready for mass insertion to translations table
     *
     * @param array $array The array that will be formatted
     * @param array $resultArray The result array containing all previous values
     */
    private function formatForInsert($array, &$resultArray)
    {
        $locale = app()->getLocale();

        foreach ($array as $key => $value) {

            $value = $value . ($locale === 'ja' ? ' (JA)' : '');

            if (array_key_exists($key, $resultArray)) {
                $resultArray[$key][$locale] = $value;
            } else {
                $resultArray[$key] = [
                    'key'   => $key,
                    $locale => $value
                ];
            }
        }
    }
}
