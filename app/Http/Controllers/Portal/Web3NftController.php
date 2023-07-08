<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Web3NftRequest;
use App\Http\Requests\Web3NftCheckRequest;
use App\Http\Requests\Web3NftVerifyRequest;
use App\Http\Requests\Web3NftVerifyHwRequest;
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
    public function check(Web3NftCheckRequest $request)
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
    public function verify(Web3NftVerifyRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $userId = Auth::user()->id;
            Log::debug($userId);
 
            $signature = $request->input('signature');
            $spendingKey = $request->input('spending_key');
            $message = $request->input('message');
            $walletAddr = $request->input('wallet_addr');
            $nftName = $request->input('nft_name');
            $mph = Nft::where('name', $nftName)->first()->mph;
            $serialNum = $request->input('serial_num');
            $user = UserWallet::where('user_id', $userId)->first(); 
            $stakeKeyHash = $user->stake_key_hash;
            $cmd = '(cd ../web3/;node ./run/nft-verify.mjs '
                        .escapeshellarg($signature).' '
                        .escapeshellarg($spendingKey).' '
                        .escapeshellarg($message).' '
                        .escapeshellarg($walletAddr).' '
                        .escapeshellarg($nftName).' '
                        .escapeshellarg($mph).' '
                        .escapeshellarg($serialNum).' '
                        .escapeshellarg($stakeKeyHash).') 2>> ../storage/logs/web3.log'; 
            
            $response = exec($cmd);
            $responseJSON = json_decode($response, false);
            
            if ($responseJSON->status == 200)
            {
                // Record the NFT transaction with serial number
                //$serialNum = $responseJSON->serialNum;
                $nftId = NFT::where('name', $nftName)->first()->id;
                Log::debug("nftId: " . $nftId);

                $nftTrans = NftTransactions::updateOrCreate(
                    ['user_id'      => $userId,
                     'nft_id'       => $nftId,
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
     * web3 wallet hardware verify
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyHw(Web3NftVerifyHwRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $userId = Auth::user()->id;
            Log::debug($userId);
 
            $walletSig = $request->input('walletSig');
            $cborTx = $request->input('cborTx');
            $walletAddr = $request->input('wallet_addr');
            $nftName = $request->input('nft_name');
            $mph = Nft::where('name', $nftName)->first()->mph;
            $serialNum = $request->input('serial_num');
            $user = UserWallet::where('user_id', $userId)->first(); 
            $stakeKeyHash = $user->stake_key_hash;
            $cmd = '(cd ../web3/;node ./run/nft-verify-hw.mjs '
                        .escapeshellarg($walletSig).' '
                        .escapeshellarg($cborTx).' '
                        .escapeshellarg($walletAddr).' '
                        .escapeshellarg($nftName).' '
                        .escapeshellarg($mph).' '
                        .escapeshellarg($serialNum).' '
                        .escapeshellarg($stakeKeyHash).') 2>> ../storage/logs/web3.log'; 
            
            $response = exec($cmd);
            $responseJSON = json_decode($response, false);
            
            if ($responseJSON->status == 200)
            {
                // Record the NFT transaction with serial number
                //$serialNum = $responseJSON->serialNum;
                $nftId = NFT::where('name', $nftName)->first()->id;
                Log::debug("nftId: " . $nftId);

                $nftTrans = NftTransactions::updateOrCreate(
                    ['user_id'      => $userId,
                     'nft_id'       => $nftId,
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
}
