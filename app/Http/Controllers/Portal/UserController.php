<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Repositories\ClassificationRepository;
use App\Repositories\CountryRepository;
use App\Repositories\RoleRepository;
use App\Repositories\TranslationRepository;
use App\Repositories\UserRepository;
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
        $user = $this->userRepository->getOne($id);

        if (!$user->hasRole(Role::TEACHER)) return abort(401);

        $title = TranslationRepository::getTranslation('title.users.view');

        return Inertia::render('Portal/Users/View', [
            'user' => $user,
            'title' => $title,
            'is_teacher' => $user->hasRole(Role::TEACHER)
        ])
        ->withViewData([
            'title' => $title
        ]);
    }

}
