<?php

namespace App\Http\Controllers\Admin;

use App\Exports\ExportBadges;
use App\Exports\ExportCourseHistory;
use App\Exports\ExportTeachingHistory;
use App\Repositories\CourseHistoryRepository;
use Exception;
use Carbon\Carbon;
use App\Models\Role;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use App\Exports\ExportWalletHistory;
use App\Exports\FromArrayCollection;
use App\Http\Controllers\Controller;
use App\Repositories\RoleRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Maatwebsite\Excel\Facades\Excel;
use App\Repositories\CountryRepository;
use App\Http\Requests\CreateUserRequest;
use App\Models\WalletTransactionHistory;
use App\Mail\AdminCreateUserNotification;
use App\Repositories\TranslationRepository;
use App\Repositories\ClassificationRepository;

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

    public function index(Request $request)
    {
        $title = TranslationRepository::getTranslation('title.users.index');

        $roleDropDown = $this->roleRepository->getDropdownData();

        $filteredRoleDropDown = $roleDropDown->filter(function($role) {
            return $role['name'] !== ucfirst(Role::ADMIN);
        });

        return Inertia::render('Admin/Users/Index', [
            'users'          => $this->userRepository->get($request->all()),
            'roleOptions'    => $filteredRoleDropDown,
            'statusOptions'  => $this->userRepository->getStatusFilterData(),
            'keyword'        => @$request['keyword'] ?? '',
            'role'           => @$request['role'] ?? '',
            'status'         => @$request['status'] ?? '',
            'sort'           => @$request['sort'] ?? 'created_at:desc',
            'page'           => @$request['page'] ?? 1,
            'export_type'    => @$request['export_type'] ?? 1,
            'export_options' => User::EXPORT_OPTIONS,
            'title'          => $title
        ])->withViewData([
            'title'          => $title
        ]);
    }

    public function view($id)
    {
        $title = TranslationRepository::getTranslation('title.users.view');

        return Inertia::render('Admin/Users/View', [
            'user' => $this->userRepository->findOne($id),
            'title' => $title
        ])
        ->withViewData([
            'title' => $title
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Users/Create', [
            'roleOptions'           => $this->roleRepository->getDropdownData(),
            'countryOptions'        => $this->countryRepository->getDropdownData(),
            'classificationOptions' => $this->classificationRepository->getDropdownData(),
            'title'                 => 'Create'
        ])->withViewData([
            'title' => 'Create'
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

    public function exportCsv(Request $request)
    {
        if ($request->has('user_id')) {
            $users = User::where('id', $request->get('user_id'))->get();
        } else {
            $users = $this->userRepository->search($request->all());
        }

        if($request->has('export_type')) {
            switch($request->get('export_type')) {
                case(User::EXPORT_OPTIONS_WALLET_TRANSACTION_ID):
                    $excel = Excel::download(new ExportWalletHistory($users), 'Wallet History.xlsx', \Maatwebsite\Excel\Excel::XLSX);
                    break;
                case(User::EXPORT_OPTIONS_CLASS_HISTORY_ID):
                    $excel = Excel::download(new ExportCourseHistory($users), 'Class History.xlsx', \Maatwebsite\Excel\Excel::XLSX);
                    break;
                case(User::EXPORT_OPTIONS_TEACHING_HISTORY_ID):
                    $excel = Excel::download(new ExportTeachingHistory($users), 'Teaching History.xlsx', \Maatwebsite\Excel\Excel::XLSX);
                    break;
                case(User::EXPORT_OPTIONS_BADGES_HISTORY_ID):
                    $excel = Excel::download(new ExportBadges($users), 'Badges.xlsx', \Maatwebsite\Excel\Excel::XLSX);
                    break;
                default:
                    $excel = Excel::download(new ExportCourseHistory($users), 'Class History.xlsx', \Maatwebsite\Excel\Excel::XLSX);
            }
        }

        return $excel;
    }
}
