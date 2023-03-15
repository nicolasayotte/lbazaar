<?php

namespace App\Http\Controllers\Admin;

use App\Exports\FromArrayCollection;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateUserRequest;
use App\Mail\AdminCreateUserNotification;
use App\Models\Role;
use App\Models\User;
use App\Models\WalletTransactionHistory;
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
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Collection;

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
            'users'         => $this->userRepository->get($request->all()),
            'roleOptions'   => $filteredRoleDropDown,
            'statusOptions' => $this->userRepository->getStatusFilterData(),
            'keyword'       => @$request['keyword'] ?? '',
            'role'          => @$request['role'] ?? '',
            'status'        => @$request['status'] ?? '',
            'sort'          => @$request['sort'] ?? 'created_at:desc',
            'page'          => @$request['page'] ?? 1,
            'export_type'   => @$request['export_type'] ?? 1,
            'export_options'=> User::EXPORT_OPTIONS,
            'title'         => $title
        ])->withViewData([
            'title' => $title
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
        // dd($request);
        // $fileName = 'tasks.csv';

        // $headers = array(
        //     "Content-type"        => "text/csv",
        //     "Content-Disposition" => "attachment; filename=$fileName",
        //     "Pragma"              => "no-cache",
        //     "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
        //     "Expires"             => "0"
        // );

        // $columns = array('Title', 'Assign', 'Description', 'Start Date', 'Due Date');

        // $callback = function() use($columns) {
        //     $file = fopen('php://output', 'w');
        //     fputcsv($file, $columns);

        //     fclose($file);
        // };

        // return response()->stream($callback, 200, $headers);
        //  dd($request);
         $users = $this->userRepository->search($request->all());
            // dd($users);
         // $courseHistories = $this->courseHistoryRepository->search($request, Auth::user()->id);
         // $userBadges = auth()->user()->badges()->paginate(10);
         // $this->courseScheduleRepository->get($request['course'], $request, auth()->user()->id);

         foreach($users as $user) {
            $walletTransactionHistory = $user->userWallet()->first()->userWalletTransactions()->orderBy('id', 'DESC')->get();
            $userName = array('Name', $user->first_name ." ".$user->last_name);
            $userEmail = array('Email', $user->email);
            $columns = array('Transaction ID', 'Transaction Type', 'Points +-', 'Content', 'Wallet balance', 'Transaction Date');
            $walletData = new Collection();
            foreach ($walletTransactionHistory as $walletTransaction) {
                $walletData->add([
                    'Transaction ID'=> $walletTransaction->id,
                    'Transaction Type'=>$walletTransaction->type,
                    'Points +-'=>$walletTransaction->amount,
                    'Content'=>$walletTransaction->transaction_details,
                    'Wallet balance'=> $walletTransaction->points_after,
                    'Transaction Date'=> $walletTransaction->transaction_datetime,
                ]);
            }
            // $walletData = [];
            // foreach ($walletTransactionHistory as $walletTransaction) {
            //     $row['Transaction ID']  = $walletTransaction->id;
            //     $row['Transaction Type']    = $walletTransaction->type;
            //     $row['Points +-']    = $walletTransaction->amount;
            //     $row['Content']  = $walletTransaction->transaction_details;
            //     $row['Wallet balance']  = $walletTransaction->points_after;
            //     $row['Transaction Date']  = $walletTransaction->transaction_datetime;
            // }
        }
        // $excel->sheet($user->first_name ." ". $user->last_name, function($sheet) use($walletData) {

        //     $sheet->fromArray($walletData);

        // });

        return Excel::download($walletTransactionHistory, 'WalletHistory.csv', \Maatwebsite\Excel\Excel::CSV);
        //  return response()->stream($callback, 200, $headers);
         // return redirect()->back();

    }
}
