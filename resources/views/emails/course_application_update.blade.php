<x-mail::message>
Hi {{ $courseApplication->professor->fullname }},

This is to inform you that your class application titled **"{{ $courseApplication->title }}"** has been **{{ strtoupper($courseApplication->status) }}**.

@if ($courseApplication->status == \App\Models\CourseApplication::APPROVED)
You may now create the class and fill out all the necessary information to start teaching!
@else
If you would like to try again, please create another class application.
@endif
</x-mail::message>
