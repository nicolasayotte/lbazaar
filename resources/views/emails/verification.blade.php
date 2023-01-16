<x-mail::message>
# Email Verification

<br>
<p>Hello {{ @$user->first_name }}</p>

<p>You have successfully created your {{ config('app.name') }} account. Now you just need to verify your email to start using your account.</p>

<p>Please click the button below to verify your email address</p>

<x-mail::button :url="@$url">Verify Email</x-mail::button>

</x-mail::message>
