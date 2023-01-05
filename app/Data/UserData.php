<?php

namespace App\Data;

use App\Models\User;
use Carbon\Carbon;

class UserData
{
    private $id;

    private $name;

    private $email;

    private $roles;

    private $status;

    private $date_joined;

    private $is_active;

    private $country;

    public function setId($id)
    {
        $this->id = $id;
    }

    public function setName($name)
    {
        $this->name = $name;
    }

    public function setEmail($email)
    {
        $this->email = $email;
    }

    public function setRoles($roles)
    {
        $this->roles = $roles;
    }

    public function setStatus($status)
    {
        $this->status = $status;
    }

    public function setDateJoined($date_joined)
    {
        $this->date_joined = $date_joined;
    }

    public function setIsActive($is_active)
    {
        $this->is_active = $is_active;
    }

    public function setCountry($country)
    {
        $this->country = $country;
    }

    public function getId()
    {
        return $this->id;
    }

    public function getName()
    {
        return $this->name;
    }

    public function getEmail()
    {
        return $this->email;
    }

    public function getRoles()
    {
        return $this->roles;
    }

    public function getStatus()
    {
        return $this->status;
    }

    public function getDateJoined()
    {
        return $this->date_joined;
    }

    public function getIsActive()
    {
        return $this->is_active;
    }

    public function getCountry()
    {
        return $this->country;
    }

    public static function fromModel(User $user)
    {
        $userData = new UserData();

        $userData->setId($user->id);
        $userData->setName($user->fullname);
        $userData->setEmail($user->email);
        $userData->setStatus($user->is_enabled ? ucfirst(User::ACTIVE) : ucfirst(User::DISABLED));
        $userData->setDateJoined(Carbon::parse($user->created_at)->format('Y-m-d'));
        $userData->setIsActive($user->is_enabled ? true : false);
        $userData->setCountry($user->country->name);

        $userRoles = $user->roles()->pluck('name');
        $userData->setRoles($userRoles->map(function($role) {
            return ucfirst($role);
        }));

        return $userData->convertToArray();
    }

    private function convertToArray()
    {
        $objectArray = [];

        foreach ($this as $key => $value) {
            $objectArray[$key] = $value;
        }

        return $objectArray;
    }
}
