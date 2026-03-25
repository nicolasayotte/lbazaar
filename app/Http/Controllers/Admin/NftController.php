<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\NftFormRequest;
use App\Models\Nft;
use App\Repositories\NftRepository;
use App\Repositories\TranslationRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NftController extends Controller
{
    private $nftRepository;

    public function __construct()
    {
        $this->nftRepository = new NftRepository();
    }

    public function index(Request $request)
    {
        $title = TranslationRepository::getTranslation('title.nft');

        return Inertia::render('Admin/Settings/Nft/Index', [
            'nfts' => $this->nftRepository->get($request->all()),
            'keyword'    => @$request['keyword'] ?? '',
            'sort'       => @$request['sort'] ?? 'created_at:desc',
            'page'       => @$request['page'] ?? 1,
            'title'      => $title
        ])->withViewData([
            'title' => $title,
        ]);
    }

    public function store(NftFormRequest $request)
    {
        // Store NFT minting policy hash in the nft table
        $web3Dir = base_path('web3');
        $logPath = storage_path('logs/web3.log');
        $cmd = sprintf('(cd %s; node ./run/get-mph.mjs) 2>> %s', escapeshellarg($web3Dir), escapeshellarg($logPath));
        $response = exec($cmd);
        $responseJSON = json_decode($response, false);

        if ($responseJSON === null || !isset($responseJSON->mph)) {
            $errorCode = $responseJSON->error ?? 'script_error';
            logger()->error('get-mph.mjs failed', ['response' => $response]);
            return back()->withErrors(['mph' => __('Failed to retrieve minting policy hash. Check web3 configuration.')]);
        }

        $request['mph'] = $responseJSON->mph;
        $request->merge(['points' => $request->input('points', 0)]);

        $this->nftRepository->create($request->all());

        return redirect()->back();
    }

    public function update(NftFormRequest $request, $id)
    {
        $input = $request->all();

        $nft = $this->nftRepository->findOrFail($id);

        $nft->update(['name' => @$input['name']]);
        if (isset($input['points'])) {
            $nft->update(['points' => $input['points']]);
        }
        $nft->update(['for_sale' => @$input['for_sale']]);
        $nft->update(['image_url' => @$input['image_url']]);

        return redirect()->back();
    }

    public function delete($id)
    {
        $this->nftRepository->destroy($id);

        return redirect()->back();
    }
}
