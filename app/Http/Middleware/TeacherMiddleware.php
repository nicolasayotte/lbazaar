<?php

namespace App\Http\Middleware;

use App\Models\Role;
use Closure;
use Illuminate\Http\Request;

class TeacherMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Check if not authenticated, then redirect to login
        if (is_null(@$request->user())) {
            return redirect()->route('portal.login');
        }

        // Check if authenticated is not teacher, then redirect to top page
        if (!$request->user()->hasRole(Role::TEACHER)) {
            return redirect()->route('top');
        }

        return $next($request);
    }
}
