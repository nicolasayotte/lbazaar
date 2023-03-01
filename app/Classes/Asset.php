<?php

namespace App\Classes;

use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class Asset
{
    private $disk;

    private $storage;

    private $base_url = 'uploads/';

    public function __construct()
    {
        $this->disk = env('APP_ENV') == 'local' ? 'uploads' : 's3';
        $this->storage = Storage::disk($this->disk);
    }

    public function upload(UploadedFile $file)
    {
        $extension = $file->getClientOriginalExtension();
        $filename = md5($file->getClientOriginalName() . uniqid()) . '.' . $extension;

        $filePath = ($this->disk == 's3' ? $this->base_url : '') . $filename;

        try {
            $path = $this->storage->put($filePath, $file->getContent());
        } catch (Exception $e) {
            Log::error($e->getMessage());
        }

        return @$path ? $filePath : false;
    }

    public function get($path)
    {
        if (strpos($path, 'https://') > -1) {
            return $path;
        }

        if ($this->storage->exists($path)) {

            return $this->disk == 's3'
            ? $this->storage->temporaryUrl($path, Carbon::now()->addHours(5))
            : $this->storage->url($path);
        }

        return null;
    }
}
