<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateUserRequest;
use App\Mail\AdminCreateUserNotification;
use App\Models\Role;
use App\Models\User;
use App\Repositories\ClassificationRepository;
use App\Repositories\CountryRepository;
use App\Repositories\RoleRepository;
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

    private $title = 'Users | Admin';

    public function __construct()
    {
        $this->userRepository           = new UserRepository();
        $this->roleRepository           = new RoleRepository();
        $this->countryRepository        = new CountryRepository();
        $this->classificationRepository = new ClassificationRepository();
    }

    public function index(Request $request)
    {
        return Inertia::render('Admin/Users/Index', [
            'users'         => $this->userRepository->get($request->all()),
            'roleOptions'   => $this->roleRepository->getDropdownData(),
            'statusOptions' => $this->userRepository->getStatusFilterData(),
            'keyword'       => @$request['keyword'] ?? '',
            'role'          => @$request['role'] ?? '',
            'status'        => @$request['status'] ?? '',
            'sort'          => @$request['sort'] ?? 'created_at:desc',
            'page'          => @$request['page'] ?? 1,
            'title'         => $this->title
        ])->withViewData([
            'title' => $this->title
        ]);
    }

    public function view($id)
    {
        return Inertia::render('Admin/Users/View', [
            'user' => $this->userRepository->findOne($id),
            'title' => $this->title
        ])
        ->withViewData([
            'title' => $this->title
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Users/Create', [
            'roleOptions'           => $this->roleRepository->getDropdownData(),
            'countryOptions'        => $this->countryRepository->getDropdownData(),
            'classificationOptions' => $this->classificationRepository->getDropdownData(),
            'title'                 => $this->title
        ])->withViewData([
            'title' => $this->title
        ]);
    }

    public function store(CreateUserRequest $request)
    {
        $inputs = $request->all();

        // Generate temporary password
        $randomPasswordString = Str::random(User::RANDOM_PASSWORD_STRING_LENGTH);

        // Set password as hashed $randomPasswordString
        $inputs['password'] = Hash::make($randomPasswordString);

        $user = User::create($inputs);

        // Attach role for created user
        $user->attachRole($inputs['role']);

        // Set defaults for admin created user
        $user->update([
            'is_temp_password'  => true,
            'is_enabled'        => true,
            'email_verified_at' => Carbon::now()
        ]);

        $this->sendEmailNotification($user, $randomPasswordString);

        return redirect()->route('admin.users.index');
    }

    public function updateStatus($id, $status)
    {
        $user = $this->userRepository->findOrFail($id);

        $user->update(['is_enabled' => $status == User::ACTIVE ? 1 : 0]);

        return redirect()->back();
    }

    private function sendEmailNotification($user, $password)
    {
        $loginUrl = $user->hasRole(Role::ADMIN) ? route('admin.login') : route('portal.login');

        try {
            Mail::send(new AdminCreateUserNotification($user, $password, $loginUrl));
        } catch (Exception $e) {
            Log::error($e);
        }
    }
}
