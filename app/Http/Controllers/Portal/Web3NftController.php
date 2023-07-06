<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Web3NftRequest;
use App\Models\Nft;
use App\Models\UserWallet;
use App\Models\NftTransactions;
use App\Models\User;
use App\Models\Role;
use App\Models\Setting;
use Exception;
use App\Services\API\EmailService;
use App\Services\API\WalletService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class Web3NftController extends Controller
{
    protected $emailService;
    protected $walletService;

    /**
     * Apply middleware to all of these routes
     */
    public function __construct () {
        $this->middleware('auth');
        $this->walletService = new WalletService();
        $this->emailService = new EmailService();
    }

    /**
     * web3 nft check
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function check(Web3NftRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $userId = Auth::user()->id;
            Log::debug($userId);
            $user = UserWallet::where('user_id', $userId)->first();
            Log::debug('stake_key: ' . $user->stake_key_hash);
            $nftName = $request->input('nft_name'); 
            $stakeKeyHash = $user->stake_key_hash;
            $utxos = $request->input('utxos');
            $strUtxos = implode(",",$utxos);

            $cmd = '(cd ../web3/;node ./run/nft-check.mjs '
                                .escapeshellarg($nftName).' '
                                .escapeshellarg($stakeKeyHash).' '
                                .escapeshellarg($strUtxos).') 2>> ../storage/logs/web3.log'; 
            
            $response = exec($cmd);
            $responseJSON = json_decode($response, false);
                
            return [
                $response
            ];

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }

    }

    /**
     * web3 wallet verify
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verify(Web3NftRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $userId = Auth::user()->id;
            Log::debug($userId);
 
            $signature = $request->input('signature');
            $spendingKey = $request->input('spending_key');
            $message = $request->input('message');
            $nftName = $request->input('nft_name');
            $walletAddr = $request->input('wallet_addr');
            $user = UserWallet::where('user_id', $userId)->first(); 
            $stakeKeyHash = $user->stake_key_hash;
            $cmd = '(cd ../web3/;node ./run/nft-verify.mjs '
                        .escapeshellarg($signature).' '
                        .escapeshellarg($spendingKey).' '
                        .escapeshellarg($message).' '
                        .escapeshellarg($nftName).' '
                        .escapeshellarg($walletAddr).' '
                        .escapeshellarg($stakeKeyHash).') 2>> ../storage/logs/web3.log'; 
            
            $response = exec($cmd);
            $responseJSON = json_decode($response, false);
            
            if ($responseJSON->status == 200)
            {
                // Record the NFT transaction with serial number
                $serialNum = $responseJSON->serialNum;

                $nftTrans = NftTransactions::updateOrCreate(
                    ['user_id'      => $userId,
                     'nft_name'     => $nftName,
                     'serial_num'   => $serialNum,
                     'used'         => 0],
                    ['updated_at' => $responseJSON->date] 
                );
                    return [
                        $response
                    ];
            } else {
                return [
                    '{"status": "501", "msg": "NFT verify not successful"}'
                ];
            }

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * web3 wallet build exchange tx
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function buildExchangeTx(Web3WalletRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $userId = Auth::user()->id;
            Log::debug($userId);
            
            $skateKeyHash = UserWallet::where('user_id', $userId)->first()->stake_key_hash;
            $changeAddr = $request->input('changeAddr');
            $nft = $request->input('nft');
            $utxos = $request->input('utxos');
            $strUtxos = implode(",",$utxos);
           
            Log::debug('skateKeyHash: ' . $skateKeyHash);
            Log::debug('changeAddr: ' . $changeAddr);
            Log::debug('nft: ' . $nft);
            Log::debug('strUtxos: ' . $strUtxos);

            // TODO
            // check that nft name is in the transaction table
            // check that nft is available for sale in the nfts table
            // check that user has enough points to cover the cost in user table
            // add new draft entry in the transaction table

            $cmd = '(cd ../web3/;node ./run/build-exchange-tx.mjs '
                        .escapeshellarg($skateKeyHash).' '
                        .escapeshellarg($changeAddr).' '
                        .escapeshellarg($nft).' '
                        .escapeshellarg($strUtxos).') 2>> ../storage/logs/web3.log'; 
            
            $response = exec($cmd);
            $responseJSON = json_decode($response, false);

            if ($responseJSON->status == 200)
            {
                return [
                    $response
                ];
            } else {
                return [
                    '{"status": "502", "msg": "Wallet exchange failed"}'
                ];
            }

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * web3 wallet submitExchangeTx
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function submitExchangeTx(Web3WalletRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $userId = Auth::user()->id;
            Log::debug($userId);
            $user = User::where('id', $userId)->first();
            $userWallet = $user->userWallet()->first();

            // TODO, pull the points for the NFT from the transaction table
            // indexed by trans id and user
            $nft = $request->input('nft');
            Log::debug("nft: ". $nft);
            // TODO - Check that the nft name matches the order table, if so calc points
            $pointsToNFT = Nft::where('name', $nft)->first()->points;

            // Only submit if there is enought points to cover the cost
            if ($userWallet->points > $pointsToNFT) {
            
                $cborSig = $request->input('cborSig');
                $cborTx = $request->input('cborTx');
                
                $cmd = '(cd ../web3/;node ./run/submit-exchange-tx.mjs '
                            .escapeshellarg($cborSig).' '
                            .escapeshellarg($cborTx).') 2>> ../storage/logs/web3.log'; 
                
                $response = exec($cmd);
                $responseJSON = json_decode($response, false);

                if ($responseJSON->status == 200)
                {
                    try {
                        $userEmail = $user->email;
                        Log::debug('txId: ' . $responseJSON->txId);
                        $walletTransactionHistory = $this->walletService->exchange($userWallet, $pointsToNFT, $responseJSON->txId, 'pending');
                        $this->emailService->sendEmailNotificationWalletUpdate($user, $walletTransactionHistory);

                        return [
                            $response
                        ];
            
                    } catch (Exception $e) {
                        return response()->json([
                            'message' => $e->getMessage()
                        ], 500);
                    }

                } else {
                    return [
                        '{"status": "503", "msg": "SubmitExchange failed"}'
                    ];
                }
            } else {
                return [
                    '{"status": "504", "msg": "SubmitExchange failed"}'
                ];
            }

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * web3 wallet build feed tx
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function buildFeedTx(Web3WalletRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $userId = Auth::user()->id;
            Log::debug($userId);
            
            $skateKeyHash = UserWallet::where('user_id', $userId)->first()->stake_key_hash;
            $changeAddr = $request->input('changeAddr');
            $utxos = $request->input('utxos');
            $strUtxos = implode(",",$utxos);
            $points = $request->input('points');
            $adaToPoints = Setting::where('slug', 'ada-to-points')->first()->value;
            $adaAmount = $points * $adaToPoints;
             
            Log::debug('skateKeyHash: ' . $skateKeyHash);
            Log::debug('changeAddr: ' . $changeAddr);
            Log::debug('strUtxos: ' . $strUtxos);
            Log::debug('adaAmount: ' . $adaAmount);
            
            $cmd = '(cd ../web3/;node ./run/build-feed-tx.mjs '
                        .escapeshellarg($skateKeyHash).' '
                        .escapeshellarg($changeAddr).' '
                        .escapeshellarg($strUtxos).' '
                        .escapeshellarg($adaAmount).') 2>> ../storage/logs/web3.log'; 
            
            $response = exec($cmd);
            $responseJSON = json_decode($response, false);

            if ($responseJSON->status == 200)
            {
                return [
                    $response
                ];
            } else {
                return [
                    '{"status": "502", "msg": "Wallet feed failed"}'
                ];
            }

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * web3 wallet submitFeedTx
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function submitFeedTx(Web3WalletRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            
            $cborSig = $request->input('cborSig');
            $cborTx = $request->input('cborTx');
            
            $cmd = '(cd ../web3/;node ./run/submit-feed-tx.mjs '
                        .escapeshellarg($cborSig).' '
                        .escapeshellarg($cborTx).') 2>> ../storage/logs/web3.log'; 
            
            $response = exec($cmd);
            $responseJSON = json_decode($response, false);

            if ($responseJSON->status == 200)
            {
                try {
                    $userId = Auth::user()->id;
                    Log::debug($userId);
                    $user = User::where('id', $userId)->first();
                    $adaAmount = $responseJSON->adaAmount;
            
                    //$user = User::where('email', $inputs['email'])->first();
                    $userWallet = $user->userWallet()->first();
                    $userEmail = $user->email;
                    // Determin the number of points to credit based on the Ada that was sent
                    $adaToPoints = Setting::where('slug', 'ada-to-points')->first()->value;
                    $points = $adaAmount / $adaToPoints;
                 
                    Log::debug('txId: ' . $responseJSON->txId);
                    $walletTransactionHistory = $this->walletService->feed($userWallet, $points, $responseJSON->txId, 'pending');
                    $this->emailService->sendEmailNotificationWalletUpdate($user, $walletTransactionHistory);

                    return [
                        $response
                    ];
             
                } catch (Exception $e) {
                    return response()->json([
                        'message' => $e->getMessage()
                    ], 500);
                }

            } else {
                return [
                    '{"status": "503", "msg": "SubmitExchange failed"}'
                ];
            }

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
