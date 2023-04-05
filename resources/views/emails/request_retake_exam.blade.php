<x-mail::message>
# Retake Exam Request

<p>Hi {{ @$userExam->course->professor->fullname }},</p>

We are writing to inform you that **{{ @$userExam->user->fullname }}** ({{ @$userExam->user->email }})  has requested a retake of the **{{ @$userExam->exam->name }}** exam that they failed. To enable the student to retake the exam, we have to clear their previous attempt.

To confirm the clearing of the exam, please click on the **Clear Exam** button, then click the icon below **{{ @$userExam->exam->name }}** and confirm.

Once you have cleared the exam, the student will be able to retake it. Please let us know if you require any further assistance.

Thank you for your time and consideration.

<p>Best regards,</p>
{{ config('app.name') }} Team

<x-mail::button :url="@$url">
Clear Exam
</x-mail::button>

</x-mail::message>
