<?php

namespace Database\Seeders;

use App\Models\Nft;
use Illuminate\Database\Seeder;

class CertificateNftSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        Nft::updateOrCreate(
            ['name' => 'Certificate'],
            [
                'name' => 'Certificate',
                'description' => 'Certificate of Completion NFT for course graduates',
                'image_url' => 'QmCertificateImageHashPlaceholder', // Replace with actual IPFS hash
                'points' => 0,
                'for_sale' => false,
                'mph' => '', // Derived at runtime from CERTIFICATE_LOCK_DATE
                'created_at' => now(),
                'updated_at' => now()
            ]
        );
    }
}
