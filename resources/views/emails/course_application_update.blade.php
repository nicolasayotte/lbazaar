<x-mail::message>
Hi {{ $courseApplication->professor->fullname }},

This is to inform you that your class application titled **"{{ $courseApplication->title }}"** has been **{{ strtoupper($courseApplication->status) }}**.

@if ($courseApplication->status == \App\Models\CourseApplication::APPROVED)
You may now proceed to creating the class and start teaching!
@else
If you would like to try again, please create another class application.
@endif
</x-mail::message>
