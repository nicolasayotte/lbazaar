<?php

namespace App\Http\Middleware;

use App\Models\Role;
use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
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
            return redirect()->route('admin.login');
        }

        // Check if authenticated is not admin, then redirect to top page
        if (!$request->user()->hasRole(Role::ADMIN)) {
            return redirect()->route('top');
        }

        return $next($request);
    }
}
