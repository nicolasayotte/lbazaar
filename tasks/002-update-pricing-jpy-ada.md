# Task 002: Update Pricing to JPY with ADA Display

## Overview

Change course pricing to use Japanese Yen (JPY) as the base currency, with ADA equivalent displayed alongside. This supports both Stripe (JPY) and Cardano (ADA) payment methods.

## Acceptance Criteria

- [ ] Course prices stored in JPY in the database
- [ ] All price displays show format: "¥X,XXX (~₳X.XX)"
- [ ] Teachers enter prices in JPY when creating course applications
- [ ] Exchange rate fetched from external API (CoinGecko)
- [ ] Exchange rate cached (5-15 minute refresh)
- [ ] ADA equivalent updates based on current exchange rate
- [ ] Admin panel shows prices in JPY

## Files to Modify

### Database

| File | Changes |
|------|---------|
| `database/migrations/xxxx_update_price_to_jpy.php` | NEW: Migration to update price column semantics (add comment/rename) |
| `database/seeders/` | Update any price seeders to use JPY values |

### Backend

| File | Changes |
|------|---------|
| `app/Services/API/ExchangeRateService.php` | NEW: Service to fetch and cache ADA/JPY rate |
| `app/Models/Course.php` | Add `getPriceInAdaAttribute()` accessor |
| `app/Models/CourseApplication.php` | Add `getPriceInAdaAttribute()` accessor |
| `app/Http/Controllers/Portal/CourseController.php` | Include ADA price in course data |
| `config/services.php` | Add CoinGecko API configuration |

### Frontend

| File | Changes |
|------|---------|
| `resources/js/components/cards/Course.jsx` | Display "¥{price} (~₳{adaPrice})" |
| `resources/js/pages/Portal/Course/Details.jsx` | Show both JPY and ADA prices |
| `resources/js/pages/Portal/MyPage/ClassApplications/Create.jsx` | JPY input field, show ADA preview |
| `resources/js/pages/Admin/ClassApplications/components/ClassApplicationTable.jsx` | Display JPY price |
| `resources/js/utils/currency.js` | NEW: Currency formatting helpers |

## Context Files (Read These First)

```
app/Models/Course.php                        # Course model with price field
app/Models/CourseApplication.php             # Course application with price field
database/migrations/2022_12_02_030137_create_courses_table.php  # Current price column definition
resources/js/components/cards/Course.jsx     # Current price display
resources/js/pages/Portal/Course/Details.jsx # Course details pricing section
```

## Implementation Notes

### Exchange Rate Service

```php
// app/Services/API/ExchangeRateService.php
class ExchangeRateService
{
    public function getAdaJpyRate(): float
    {
        return Cache::remember('ada_jpy_rate', 600, function () {
            // Fetch from CoinGecko API
            $response = Http::get('https://api.coingecko.com/api/v3/simple/price', [
                'ids' => 'cardano',
                'vs_currencies' => 'jpy'
            ]);
            return $response->json('cardano.jpy');
        });
    }

    public function jpyToAda(float $jpy): float
    {
        $rate = $this->getAdaJpyRate();
        return $rate > 0 ? round($jpy / $rate, 2) : 0;
    }
}
```

### Currency Formatting (Frontend)

```javascript
// resources/js/utils/currency.js
export const formatJpy = (amount) => `¥${amount.toLocaleString('ja-JP')}`;
export const formatAda = (amount) => `₳${amount.toFixed(2)}`;
export const formatDualPrice = (jpy, ada) => `${formatJpy(jpy)} (~${formatAda(ada)})`;
```

### Price Display Component

Consider creating a reusable `<PriceDisplay jpy={price} ada={adaPrice} />` component.

### Data Migration Strategy

Option A: Keep `price` column, treat as JPY (document the change)
Option B: Rename to `price_jpy` for clarity

Recommendation: Option A with a migration that adds a comment to the column.

## Expected Tests

### Unit Tests (PHPUnit)

```php
// tests/Unit/Services/ExchangeRateServiceTest.php
- test_fetches_ada_jpy_rate_from_coingecko()
- test_caches_exchange_rate()
- test_converts_jpy_to_ada_correctly()
- test_handles_api_failure_gracefully()

// tests/Unit/Models/CourseTest.php
- test_price_in_ada_accessor_returns_converted_value()
```

### Feature Tests

```php
// tests/Feature/CoursePricingTest.php
- test_course_api_returns_both_jpy_and_ada_prices()
- test_course_creation_accepts_jpy_price()
```

### Frontend Tests

```javascript
// Test currency formatting
- formatJpy formats with yen symbol and thousands separator
- formatAda formats with ada symbol and 2 decimals
- PriceDisplay shows both currencies
```

### Manual Testing Checklist

- [ ] Create course with JPY price (e.g., ¥5,000)
- [ ] View course card, verify shows "¥5,000 (~₳X.XX)"
- [ ] View course details, verify both prices displayed
- [ ] Verify ADA amount is reasonable (check current rate)
- [ ] Wait 10+ minutes, verify rate refreshes

## Dependencies

None - this task can be done independently.

## Environment Variables

Add to `.env.example`:

```
# Exchange Rate API
COINGECKO_API_URL=https://api.coingecko.com/api/v3
EXCHANGE_RATE_CACHE_TTL=600
```

## Estimated Scope

- Backend: ~4 files (1 new service)
- Frontend: ~5 files (1 new utility)
- Database: 1 migration
- Tests: ~3 test files
