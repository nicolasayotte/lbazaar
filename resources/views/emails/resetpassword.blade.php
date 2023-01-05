@extends('emails.layout')

@section('content')
<h4>Hello!</h4>
<p>You are receiving this email because we received a password reset request for your account.</p>

<p>Reset Password Link: <a href="{{ $url }}">{{ $url }}</a></p>

@endsection
