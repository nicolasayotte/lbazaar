<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class ExportCourseHistorySheet implements FromCollection, WithHeadings, WithTitle
{

    public function title(): string
    {
        return $this->sheetName;
    }

    private $collectionArray;

    private $sheetName;

    public function __construct($collection, $sheetName)
    {
        $this->collectionArray = $collection;
        $this->sheetName = $sheetName;
    }

    public function collection()
    {
        return $this->collectionArray;
    }

    public function headings() : array
    {
        $attributes = $this->collectionArray->first();
        return empty($attributes) ? [] : array_keys($attributes);
    }
}
