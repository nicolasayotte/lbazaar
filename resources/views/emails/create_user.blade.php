<x-mail::message>
## Hi {{ $user->fullname }},

Your L-Earning Bazaar account has been successfully created by the system administrator.

To get started, please sign in <a href="{{ $login_url }}">here</a> using the following credentials:

<x-mail::panel>
<x-mail::table>
|                 |                        |
| --------------- | -----------------------|
| Email:          | **{{$user->email}}**   |
| Password:       | **{{$temp_password}}** |
</x-mail::table>
</x-mail::panel>

Once signed in, we advice you to change your password immediately for security purposes

Thanks
</x-mail::message>
