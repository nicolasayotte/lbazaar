<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use App\Exports\ExportWalletHistorySheet;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ExportWalletHistory implements WithMultipleSheets
{

    private $users;

    public function __construct($users)
    {
        $this->users = $users;
    }

    public function sheets(): array
    {
        $sheets = [];
        $walletData = new Collection();
        foreach($this->users as $user) {
            // $walletData = new Collection();
            $walletTransactionHistory = $user->userWallet()->first()->userWalletTransactions()->orderBy('id', 'DESC')->get()->toArray();

            foreach ($walletTransactionHistory as $walletTransaction) {
                $walletData->add([
                    'Email' => $user->email,
                    'Transaction ID'=> $walletTransaction['id'],
                    'Transaction Type'=>$walletTransaction['type'],
                    'Points +-'=>$walletTransaction['amount'],
                    'Content'=>$walletTransaction['transaction_details'],
                    'Wallet balance'=> $walletTransaction['points_after'],
                    'Transaction Date'=> $walletTransaction['transaction_datetime'],
                ]);
            }
            if (count($walletTransactionHistory) > 0 ) {
                // $sheets[] = new ExportWalletHistorySheet($walletData, $user->email);
            }
        }
        $sheets[] = new ExportWalletHistorySheet($walletData, 'Wallet History');
        if (!(count($sheets)  > 0)) {
            $sheets[] = new ExportWalletHistorySheet(new Collection(), 'no data');
        }

        return $sheets;
    }
}
