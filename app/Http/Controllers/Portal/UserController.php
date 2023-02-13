<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateUserRequest;
use App\Mail\AdminCreateUserNotification;
use App\Models\Role;
use App\Models\User;
use App\Repositories\ClassificationRepository;
use App\Repositories\CountryRepository;
use App\Repositories\RoleRepository;
use App\Repositories\TranslationRepository;
use App\Repositories\UserRepository;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class UserController extends Controller
{
    private $userRepository;

    private $roleRepository;

    private $countryRepository;

    private $classificationRepository;

    public function __construct()
    {
        $this->userRepository           = new UserRepository();
        $this->roleRepository           = new RoleRepository();
        $this->countryRepository        = new CountryRepository();
        $this->classificationRepository = new ClassificationRepository();
    }

    public function view($id)
    {
        $title = TranslationRepository::getTranslation('title.users.view');
        $user = $this->userRepository->getOne($id);
        $students = $user->hasRole(Role::TEACHER) ? $this->userRepository->getStudents($id) : "";
        return Inertia::render('Portal/Users/View', [
            'user' => $user,
            'title' => $title,
            'is_teacher' => $user->hasRole(Role::TEACHER),
            'students' => $students
        ])
        ->withViewData([
            'title' => $title
        ]);
    }

}
