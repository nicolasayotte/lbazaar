@extends('emails.layout')

@section('content')
    <b>Hello, {{ @$user->first_name }}!</b><br><br>
    <a>Please click the link below to verify your email address</a><br><br>
    <b>Verification Link:</b>
    <a href="{{ @$url }}">{{ @$url }}</a>
@endsection
