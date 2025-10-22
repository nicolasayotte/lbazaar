<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\AdminSettingsRequest;
use Inertia\Inertia;
use App\Models\Setting;

class SettingsController extends Controller
{

    public function index()
    {
        return Inertia::render('Admin/Settings/General/Index', [
            'title' => getTranslation('title.general'),
            'general_settings' => Setting::all(),
        ])->withViewData([
            'title' => getTranslation('title.general'),
        ]);
    }
    public function update(AdminSettingsRequest $request)
    {
        // dd($request);
        $general_settings = $request->has('general_settings') ? $request->get('general_settings') : [];

        if(count($general_settings) > 0) {
            foreach($general_settings as $general_setting_slug => $general_setting_value) {
                $setting = Setting::where('slug', $general_setting_slug)->first();
                if($setting != null) {
                    $setting->update(['value' => $general_setting_value]);
                }
            }
        }
        return redirect()->back();
    }

}
