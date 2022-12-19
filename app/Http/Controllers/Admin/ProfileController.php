<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfileController extends Controller
{

    public function view()
    {
        $countries = Country::pluck('name', 'id')->toArray();

        return Inertia::render('admin/Profile', [
            'countries' => $countries
        ])->withViewData([
            'title' => 'Profile'
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'first_name' => 'required|alpha',
            'last_name'  => 'required|alpha',
            'country_id' => 'required'
        ]);
    }
}
