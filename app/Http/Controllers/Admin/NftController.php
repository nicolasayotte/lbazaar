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
        $this->nftRepository->create($request->all());

        return redirect()->back();
    }

    public function update(NftFormRequest $request, $id)
    {
        $input = $request->all();

        $nft = $this->nftRepository->findOrFail($id);

        $nft->update(['name' => @$input['name']]);
        $nft->update(['points' => @$input['points']]);
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
