<x-mail::message>
# Account Successfully Created

<br>
<p>Hi {{ $user->fullname }},</p>

<p>Your {{ config('app.name') }} account has been successfully created by the system administrator.</p>

<p>To get started, please sign in <a target="__blank" href="{{ $login_url }}">here</a> using the following credentials:</p>

<x-mail::panel>
<x-mail::table>
|                 |                        |
| --------------- | -----------------------|
| Email:          | **{{$user->email}}**   |
| Password:       | **{{$temp_password}}** |
</x-mail::table>
</x-mail::panel>

<p>Once signed in, we advice you to change your password immediately for security purposes</p>

</x-mail::message>
