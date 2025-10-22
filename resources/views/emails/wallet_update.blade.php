<x-mail::message>
# User wallet Update

<br>
<p>Hi {{ $user->first_name }},</p>

This is to inform you that your wallet has been updated, from **{{ $walletTransactionHistory->points_before }}** to **{{ $walletTransactionHistory->points_after }}**.

<x-mail::panel>
<x-mail::table>
|             |                                                 |
| ----------- | ----------------------------------------------- |
| Transaction ID       | {{ @$walletTransactionHistory->id }}                |
| Wallet Current Points        | {{ @$walletTransactionHistory->points_after}}     |
| Transaction Type    | {{ @$walletTransactionHistory->type }} |
</x-mail::table>
</x-mail::panel>

</x-mail::message>
