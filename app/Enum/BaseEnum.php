<?php

namespace App\Enum;

abstract class BaseEnum{

    public static function toString($val){
        $tmp = new \ReflectionClass(get_called_class());
        $a = $tmp->getConstants();
        $b = array_flip($a);

        return isset($b[$val]) ? $b[$val] : null;
    }

    public static function parse($value)
    {
        $class = new \ReflectionClass(get_called_class());
        $constants = array_flip($class->getConstants());
        return $constants[$value];
    }
}
