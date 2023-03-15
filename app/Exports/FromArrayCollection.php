<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;

class FromArrayCollection implements FromCollection
{

    private $collecitonArray;

    public function __construct($collection)
    {
        $this->collecitonArray = $collection;
    }

    public function collection()
    {
        return $this->collecitonArray;
    }
}
