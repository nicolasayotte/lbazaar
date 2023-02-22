<?php

use App\Repositories\TranslationRepository;

function getTranslation($key = '')
{
    return TranslationRepository::getTranslation($key);
}
