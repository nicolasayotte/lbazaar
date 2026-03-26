<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{

    /**
     * Login The User
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function authenticate(Request $request)
    {
        try {
            $validateUser = Validator::make($request->all(),
            [
                'email' => 'required|email',
                'password' => 'required'
            ]);

            if($validateUser->fails()){
                return response()->json([
                    'status' => false,
                    'message' => 'validation error',
                    'errors' => $validateUser->errors()
                ], 401);
            }

            if (!Auth::attempt([
                'email'     => $request['email'],
                'password'  => $request['password'],
                fn ($query) => $query->whereRoleIs(Role::ADMIN)
            ])) {
                return response()->json([
                    'status' => false,
                    'message' => getTranslation('error'),
                ], 401);
            }

            $user = User::where('email', $request->email)->first();

            return response()->json([
                'status' => true,
                'message' => getTranslation('success.user.login'),
                'token' => $user->createToken(
                    'admin-api-' . now()->format('Ymd-His'),
                    ['*'],
                    now()->addDay()
                )->plainTextToken
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => true,
            'message' => 'Token revoked',
        ]);
    }

    public function refresh(Request $request)
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();

        return response()->json([
            'status' => true,
            'token' => $user->createToken(
                'admin-api-' . now()->format('Ymd-His'),
                ['*'],
                now()->addDay()
            )->plainTextToken,
        ]);
    }
}
