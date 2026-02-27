<x-mail::message>
# User wallet Update

<br>
<p>Hi {{ $user->first_name }},</p>

This is to inform you that your wallet has been updated.

<x-mail::panel>
<x-mail::table>
|             |                                                 |
| ----------- | ----------------------------------------------- |
| Transaction ID       | {{ @$walletTransactionHistory->id }}                |
| Transaction Type    | {{ @$walletTransactionHistory->type }} |
</x-mail::table>
</x-mail::panel>

</x-mail::message>
