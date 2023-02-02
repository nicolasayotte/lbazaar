<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Models\Country;
use App\Repositories\TranslationRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class ProfileController extends Controller
{
    private $userRepository;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
    }

    public function index()
    {
        $countries = Country::all();

        $title = TranslationRepository::getTranslation('texts.profile');

        return Inertia::render('Admin/Profile/Index', [
            'countries' => $countries,
            'title'     => $title
        ])->withViewData([
            'title' => $title
        ]);
    }

    public function update(ProfileRequest $request)
    {
        $user = $this->userRepository->findOrFail(auth()->user()->id);

        $user->update($request->all());

        return redirect()->route('admin.profile.index');
    }

}
