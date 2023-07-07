<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Web3WalletRequest;
use App\Models\Nft;
use App\Models\UserWallet;
use App\Models\User;
use App\Models\Role;
use App\Models\Setting;
use Exception;
use App\Services\API\EmailService;
use App\Services\API\WalletService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class Web3WalletController extends Controller
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
     * web3 wallet info
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function info(Web3WalletRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $userId = Auth::user()->id;
            Log::debug($userId);
            $user = UserWallet::where('user_id', $userId)->first();
            Log::debug('stake_key: ' . $user->stake_key_hash);
            $changeAddr = $request->input('changeAddr'); 
            $stakeKeyHash = $user->stake_key_hash;

            $cmd = '(cd ../web3/;node ./run/wallet-info.mjs '.escapeshellarg($changeAddr).' '.escapeshellarg($stakeKeyHash).') 2>> ../storage/logs/web3.log'; 
            
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
    public function verify(Web3WalletRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $userId = Auth::user()->id;
            Log::debug($userId);
 
            $signature = $request->input('signature');
            $stake_key = $request->input('stake_key');
            $message = $request->input('message');
            $stake_addr = $request->input('stake_addr');
            $cmd = '(cd ../web3/;node ./run/wallet-verify.mjs '
                        .escapeshellarg($signature).' '
                        .escapeshellarg($stake_key).' '
                        .escapeshellarg($message).' '
                        .escapeshellarg($stake_addr).') 2>> ../storage/logs/web3.log'; 
            
            $response = exec($cmd);
            $responseJSON = json_decode($response, false);

            if ($responseJSON->status == 200)
            {
                // Update user_wallets table with stake key only
                // if it has been successfully verified
                $userId = Auth::user()->id;
                $user_wallets = UserWallet::where('user_id', $userId)
                ->update(['stake_key_hash' => $responseJSON->stakeKeyHash,
                          'updated_at' => $responseJSON->date]);
                
                          return [
                    $response
                ];
            } else {
                return [
                    '{"status": "501", "msg": "Wallet verify not successful"}'
                ];
            }

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * web3 hardware wallet verify
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyHw(Web3WalletRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $userId = Auth::user()->id;
            Log::debug($userId);
 
            $walletSig = $request->input('walletSig');
            $cborTx = $request->input('cborTx');
            //$stake_key = $request->input('stake_key');
            //$message = $request->input('message');
            $stakeAddr = $request->input('stakeAddr');
            $cmd = '(cd ../web3/;node ./run/wallet-verify-hw.mjs '
                        .escapeshellarg($walletSig).' '
                        .escapeshellarg($cborTx).' '
                        .escapeshellarg($stakeAddr).') 2>> ../storage/logs/web3.log'; 
            
            $response = exec($cmd);
            $responseJSON = json_decode($response, false);

            if ($responseJSON->status == 200)
            {
                // Update user_wallets table with stake key only
                // if it has been successfully verified
                $userId = Auth::user()->id;
                $user_wallets = UserWallet::where('user_id', $userId)
                ->update(['stake_key_hash' => $responseJSON->stakeKeyHash,
                          'updated_at' => $responseJSON->date]);
                
                          return [
                    $response
                ];
            } else {
                return [
                    '{"status": "501", "msg": "Wallet verify not successful"}'
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
            $imageUrl = Nft::where('name', $nft)->first()->image_url;
            $mph = Nft::where('name', $nft)->first()->mph;
            $utxos = $request->input('utxos');
            $strUtxos = implode(",",$utxos);
           
            Log::debug('skateKeyHash: ' . $skateKeyHash);
            Log::debug('changeAddr: ' . $changeAddr);
            Log::debug('imageUrl: ' . $imageUrl);
            Log::debug('nft: ' . $nft);
            Log::debug('mph: ' . $mph);
            Log::debug('strUtxos: ' . $strUtxos);

            $cmd = '(cd ../web3/;node ./run/build-exchange-tx.mjs '
                        .escapeshellarg($skateKeyHash).' '
                        .escapeshellarg($changeAddr).' '
                        .escapeshellarg($imageUrl).' '
                        .escapeshellarg($nft).' '
                        .escapeshellarg($mph).' '
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

    /**
     * web3 build hardware wallet tx
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function buildHwTx(Web3WalletRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $userId = Auth::user()->id;
            Log::debug($userId);
            
            $changeAddr = $request->input('changeAddr');
            $utxos = $request->input('utxos');
            $strUtxos = implode(",",$utxos);

            Log::debug('changeAddr: ' . $changeAddr);
            
            $cmd = '(cd ../web3/;node ./run/build-wallet-hw-tx.mjs '
                        .escapeshellarg($changeAddr).' '
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
                    '{"status": "502", "msg": "Wallet hardware tx failed"}'
                ];
            }

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
