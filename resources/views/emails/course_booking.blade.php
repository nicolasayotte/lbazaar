<x-mail::message>
# Class Booking

<br>
<p>Hi {{ $user->first_name }},</p>

This is to inform you that you booked a class titled **"{{ $course->title }}"**.

<x-mail::panel>
<x-mail::table>
|             |                                                 |
| ----------- | ----------------------------------------------- |
| Title       | {{ @$course->title }}                |
| Type        | {{ @$course->courseType->name }}     |
| Category    | {{ @$course->courseCategory->name }} |
</x-mail::table>
</x-mail::panel>
<p>You may now attend the class!</p>


@if ($course->is_live)
<x-mail::button :url="@$course->zoom_link">Zoom link</x-mail::button>
<x-mail::button :url="@$url">Attend Class</x-mail::button>
@else
<x-mail::button :url="@$url">Attend Class</x-mail::button>
@endif
</x-mail::message>
