# Task 003: Fix Wallet Flow for ADA Purchases

## Overview

Complete the ADA payment flow for course booking. The current implementation has TODO comments indicating incomplete transaction handling. This task ensures students can pay for courses using their connected Cardano wallet.

## Acceptance Criteria

- [ ] Students can click "Buy with ADA" on course details page
- [ ] System converts JPY price to ADA using current exchange rate
- [ ] Transaction is built with correct ADA amount
- [ ] User can sign transaction with connected wallet (Eternl/Flint/Nami)
- [ ] Transaction submits successfully to Cardano blockchain
- [ ] Webhook confirms payment on-chain
- [ ] Course enrollment is created after payment confirmation
- [ ] Error handling for failed transactions
- [ ] Loading states during transaction process

## Files to Modify

### Backend

| File | Changes |
|------|---------|
| `app/Http/Controllers/Portal/CourseController.php` | Fix `book()` method (lines 198-236), complete ADA transaction flow |
| `app/Http/Controllers/Portal/Web3WalletController.php` | Verify/fix transaction building methods |
| `app/Services/API/WalletService.php` | Add course purchase transaction handling |
| `routes/web.php` | Verify wallet transaction routes exist |

### Frontend

| File | Changes |
|------|---------|
| `resources/js/pages/Portal/Course/Details.jsx` | Add "Buy with ADA" flow, loading states, error handling |
| `resources/js/components/cards/WalletConnector.jsx` | Verify transaction signing works |

### Web3 Module

| File | Changes |
|------|---------|
| `web3/run/build-purchase-tx.mjs` | May need to create or verify purchase transaction builder |
| `web3/run/submit-purchase-tx.mjs` | May need to create or verify transaction submitter |

## Context Files (Read These First)

```
app/Http/Controllers/Portal/CourseController.php    # Current book() method with TODOs
app/Http/Controllers/Portal/Web3WalletController.php # Existing wallet operations
app/Services/API/WalletService.php                  # Wallet transaction service
resources/js/pages/Portal/Course/Details.jsx        # Course purchase UI
resources/js/components/cards/WalletConnector.jsx   # Wallet connection component
web3/run/                                           # Existing web3 scripts
```

## Implementation Notes

### Current State Analysis

The `CourseController@book()` method (lines 198-236) currently has:
- TODO comments for ADA transaction implementation
- Point balance checking (being removed in Task 001)
- Needs to be refactored for actual ADA payments

### Required Flow

```
1. Frontend: User clicks "Buy with ADA"
   └── POST /course/{id}/build-purchase-tx
       └── Backend calculates ADA amount from JPY price
       └── Backend calls web3 script to build unsigned tx
       └── Returns unsigned tx to frontend

2. Frontend: Prompt wallet to sign
   └── wallet.signTx(unsignedTx)
   └── Returns signed tx

3. Frontend: Submit signed transaction
   └── POST /course/{id}/submit-purchase-tx
       └── Backend submits to Cardano via Blockfrost
       └── Creates pending CourseHistory record
       └── Returns txHash

4. Webhook: Blockfrost confirms transaction
   └── POST /api/webhook/blockfrost
       └── Verify webhook signature
       └── Update CourseHistory status to confirmed
       └── Send confirmation email
```

### Backend Controller Methods Needed

```php
// app/Http/Controllers/Portal/CourseController.php

public function buildPurchaseTx(Course $course)
{
    // 1. Verify user has connected wallet
    // 2. Get JPY price, convert to ADA
    // 3. Call web3 script: build-purchase-tx.mjs
    // 4. Return unsigned transaction
}

public function submitPurchaseTx(Request $request, Course $course)
{
    // 1. Receive signed transaction
    // 2. Submit via Blockfrost
    // 3. Create pending CourseHistory
    // 4. Return txHash for tracking
}
```

### Web3 Script Structure

```javascript
// web3/run/build-purchase-tx.mjs
// Input: { studentAddress, teacherAddress, amountLovelace }
// Output: { unsignedTx, txHash }

// web3/run/submit-purchase-tx.mjs
// Input: { signedTx }
// Output: { txHash, confirmed }
```

### Frontend Transaction Flow

```javascript
// In Course/Details.jsx

const handleBuyWithAda = async () => {
  setLoading(true);
  try {
    // 1. Build transaction
    const { unsignedTx } = await axios.post(`/course/${course.id}/build-purchase-tx`);

    // 2. Sign with wallet
    const signedTx = await wallet.signTx(unsignedTx);

    // 3. Submit transaction
    const { txHash } = await axios.post(`/course/${course.id}/submit-purchase-tx`, { signedTx });

    // 4. Show success, redirect to course
    showSuccess(`Payment submitted! TX: ${txHash}`);
    router.visit(`/course/${course.id}/attend`);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
};
```

## Expected Tests

### Unit Tests (PHPUnit)

```php
// tests/Unit/Services/WalletServiceTest.php
- test_builds_purchase_transaction_with_correct_amount()
- test_converts_jpy_to_lovelace_correctly()

// tests/Feature/CoursePurchaseTest.php
- test_build_purchase_tx_requires_connected_wallet()
- test_build_purchase_tx_returns_unsigned_transaction()
- test_submit_purchase_tx_creates_pending_enrollment()
- test_webhook_confirms_enrollment_on_valid_tx()
```

### Web3 Tests (Vitest)

```javascript
// web3/run/build-purchase-tx.test.mjs
- builds transaction with correct ADA amount
- includes correct recipient address
- handles insufficient funds error

// web3/run/submit-purchase-tx.test.mjs
- submits signed transaction to Blockfrost
- returns transaction hash on success
```

### Manual Testing Checklist

- [ ] Connect wallet (Eternl/Flint/Nami)
- [ ] Navigate to a General course with price
- [ ] Click "Buy with ADA"
- [ ] Verify correct ADA amount shown
- [ ] Sign transaction in wallet
- [ ] Verify transaction submitted
- [ ] Check enrollment created (pending status)
- [ ] Verify webhook confirms enrollment
- [ ] Access course content after confirmation

## Dependencies

- **Task 002** (Update Pricing to JPY) - needed for JPY→ADA conversion
- ExchangeRateService must be implemented first

## Environment Variables

Verify these exist in `.env`:

```
BLOCKFROST_API_KEY=preprod_xxx
NETWORK=preprod
OWNER_PKH=xxx
```

## Estimated Scope

- Backend: ~3-4 files
- Frontend: ~2 files
- Web3: ~2 files (may need creation)
- Tests: ~4 test files
