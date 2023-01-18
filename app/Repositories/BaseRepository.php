<?php

namespace App\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

abstract class BaseRepository
{
    protected $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    public function findOrFail(int $id)
    {
        return $this->model->findOrFail($id);
    }

    public function count()
    {
        return $this->model->count();
    }

    public function findOne(int $id)
    {
        return $this->model->find($id);
    }

    public function getAll()
    {
        return $this->model->all();
    }

    public function getAllPaginated()
    {
        return $this->model->paginate(10);
    }

    // Eager load database relationships
    public function with($relations)
    {
        return $this->model->with($relations);
    }

    public function create($data)
    {
        return $this->model->create($data);
    }

    public function destroy($id)
    {
        return $this->model->destroy($id);
    }
}
