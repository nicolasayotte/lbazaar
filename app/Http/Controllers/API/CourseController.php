<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Services\API\ExchangeRateService;
use Illuminate\Http\JsonResponse;

class CourseController extends Controller
{
    public function __construct(protected ExchangeRateService $exchangeRateService) {}

    /** GET /api/courses/{course}/ada-price — public, no auth */
    public function getAdaPrice(Course $course): JsonResponse
    {
        if (!$this->exchangeRateService->isAvailable()) {
            return response()->json(['available' => false, 'data' => ['price_in_ada' => null]]);
        }
        $price = $this->exchangeRateService->jpyToAda((float) $course->getRawOriginal('price'));
        return response()->json(['available' => true, 'data' => ['price_in_ada' => $price]]);
    }
}
