<x-mail::message>
# Retake Exam Request Approved

<p>Hi {{ @$userExam->user->fullname }},</p>

This is to inform you that your request to retake **"{{ @$userExam->exam->name }}"** has been approved.

To retake the exam, click the button below

<x-mail::button :url="@$url">
Retake Exam
</x-mail::button>

</x-mail::message>
