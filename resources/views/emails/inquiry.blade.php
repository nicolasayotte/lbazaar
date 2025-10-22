<x-mail::message>
# Inquiry

<br>
<p>A new inquiry has been posted.</p>

<x-mail::panel>
<x-mail::table>
| Inquiry Details          |
| ------------------------ |
| **Sender Name:**         |
| {{ @$inquiry->name }}    |
| **Sender Email:**        |
| {{ @$inquiry->email }}   |
| **Subject:**             |
| {{ @$inquiry->subject }} |
| **Message:**             |
| {{ @$inquiry->message }} |
</x-mail::table>
</x-mail::panel>
</x-mail::message>
