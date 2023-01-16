<x-mail::message>
# Class Application Update

<br>
<p>Hi {{ $courseApplication->professor->fullname }},</p>

This is to inform you that your class application titled **"{{ $courseApplication->title }}"** has been **{{ strtoupper($courseApplication->status) }}**.

<x-mail::panel>
<x-mail::table>
|             |                                                 |
| ----------- | ----------------------------------------------- |
| Title       | {{ @$courseApplication->title }}                |
| Type        | {{ @$courseApplication->courseType->name }}     |
| Category    | {{ @$courseApplication->courseCategory->name }} |
</x-mail::table>
</x-mail::panel>

@if ($courseApplication->status == \App\Models\CourseApplication::APPROVED)
<p>You may now create the class and fill out all the necessary information to start teaching!</p>
@else
<p>If you would like to try again, please create another class application.</p>
@endif
</x-mail::message>
