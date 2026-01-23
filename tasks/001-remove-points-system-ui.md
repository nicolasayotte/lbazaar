# Task 001: Remove Points System UI

## Overview

Remove all points-related UI components and simplify course types by hiding/removing the "Earn" course type.

## Acceptance Criteria

- [ ] No points balance displayed anywhere in the UI
- [ ] No "Feed Points" or "Exchange Points" buttons visible
- [ ] No "Earn" course type option in course application forms
- [ ] No `points_earned` field displayed in course forms or details
- [ ] Wallet history tables show transaction info without points columns
- [ ] All existing functionality (ADA payments, NFT courses) continues working

## Files to Modify

### Frontend (Remove/Refactor)

| File | Changes |
|------|---------|
| `resources/js/components/cards/UserPoints.jsx` | Remove entirely OR refactor to show only ADA balance (no points) |
| `resources/js/pages/Portal/MyPage/WalletHistory/components/WalletHistoryTable.jsx` | Remove `points_after` column display |
| `resources/js/pages/Admin/WalletHistory/components/WalletHistoryTable.jsx` | Remove points-related columns |
| `resources/js/pages/Portal/Course/Details.jsx` | Remove points display in pricing info (lines ~387-389) |
| `resources/js/pages/Portal/MyPage/ClassApplications/Create.jsx` | Remove "Earn" type option, remove `points_earned` field (lines ~149-159) |
| `resources/js/pages/Portal/MyPage/ManageClass/components/ClassInformationHeader.jsx` | Remove `points_earned` chip (lines ~100-101) |

### Backend (Update)

| File | Changes |
|------|---------|
| `app/Models/CourseType.php` | Hide "Earn" type from available options (keep in DB for backwards compat) |
| `app/Http/Controllers/Portal/CourseController.php` | Remove/disable points logic in `giveRewards()` method |
| `app/Http/Controllers/Portal/CourseApplicationController.php` | Exclude "Earn" type from available course types |

## Context Files (Read These First)

```
app/Models/CourseType.php                    # Course type definitions (General, Free, Earn, Special)
app/Models/UserWallet.php                    # User wallet with points field
app/Models/WalletTransactionHistory.php      # Transaction types and points tracking
app/Http/Controllers/Portal/CourseController.php  # Course booking and rewards logic
resources/js/components/cards/UserPoints.jsx # Main points UI component
```

## Implementation Notes

1. **Keep database columns** - Don't drop `points`, `points_earned`, or `points_before`/`points_after` columns. They may contain historical data and removing them requires a migration + data handling.

2. **Hide vs Remove** - For the "Earn" course type, hide it from the UI but keep it in the database. Existing "Earn" courses should still function (just can't create new ones).

3. **UserPoints.jsx decision** - Two options:
   - Option A: Delete entirely if wallet balance display isn't needed elsewhere
   - Option B: Refactor to show only ADA balance from connected Cardano wallet (no internal points)

4. **Test existing flows** - After changes, verify:
   - General course booking still works
   - Free course enrollment still works
   - Special/NFT course booking still works

## Expected Tests

### Unit Tests (PHPUnit)

```php
// tests/Feature/CourseTypeTest.php
- test_earn_course_type_hidden_from_available_types()
- test_existing_earn_courses_still_accessible()
```

### Frontend Tests (if Jest/Vitest configured)

```javascript
// Test that points-related UI elements are not rendered
- UserPoints component doesn't show points balance
- WalletHistoryTable doesn't have points columns
- ClassApplication form doesn't show Earn type option
```

### Manual Testing Checklist

- [ ] Login as student, verify no points balance shown
- [ ] Navigate to wallet history, verify no points columns
- [ ] Login as teacher, create new course application
- [ ] Verify "Earn" type is not available
- [ ] Verify existing courses of all types still display correctly
- [ ] Book a General course, verify flow works without points

## Dependencies

None - this task can be done independently.

## Estimated Scope

- Frontend: ~6 files
- Backend: ~3 files
- Tests: ~2-3 test files
