# Task 007: Multi-Category Tag Selection for Class Browsing

## Overview

Replace the single-category dropdown filter with a multi-tag selection interface on the class browsing page. The backend already supports multiple categories per course (via `course_category_course` pivot table) - this task updates the frontend to leverage that capability.

## Acceptance Criteria

- [ ] Category filter changes from single dropdown to multi-select tag picker
- [ ] Selected categories display as removable chips/tags
- [ ] Users can add multiple category tags to filter
- [ ] Users can remove individual tags by clicking X on the chip
- [ ] Filtering works with AND logic (course must have ALL selected categories)
- [ ] Clear all tags option available
- [ ] Mobile-responsive tag selection
- [ ] Maintains existing search functionality integration

## Files to Modify

### Backend

| File | Changes |
|------|---------|
| `app/Http/Requests/SearchClassRequest.php` | Change `category_id` validation from `integer` to `array` |
| `app/Repositories/CourseRepository.php` | Update `whereHas` to handle array of category IDs |

### Frontend

| File | Changes |
|------|---------|
| `resources/js/pages/Portal/Course/Search.jsx` | Replace dropdown with Autocomplete multi-select + Chip display |
| `resources/js/helpers/form.helper.jsx` | Add helper for multi-select change handling |

## Context Files (Read These First)

```
resources/js/pages/Portal/Course/Search.jsx           # Main search page (lines 117-132 for current dropdown)
app/Http/Requests/SearchClassRequest.php              # Current validation rules
app/Repositories/CourseRepository.php                 # Category filter logic (lines 52-56)
resources/js/components/forms/Input.jsx               # Current Input component
resources/js/pages/Portal/Course/Create.jsx           # Has Autocomplete example (lines 130-147)
database/migrations/2025_07_14_193348_create_course_category_course_table.php  # Pivot table
```

## Implementation Notes

### Backend Changes

#### SearchClassRequest.php

```php
// Change from:
'category_id' => 'integer|nullable',

// Change to:
'category_ids'   => 'array|nullable',
'category_ids.*' => 'integer|exists:course_categories,id',
```

#### CourseRepository.php (search method)

```php
// Change from:
->when($request->filled('category_id'), fn($q) =>
    $q->whereHas('categories', fn($q2) =>
        $q2->where('id', $request->category_id)
    )
)

// Change to (AND logic - course must have ALL selected categories):
->when($request->filled('category_ids'), function($q) use ($request) {
    foreach ($request->category_ids as $categoryId) {
        $q->whereHas('categories', fn($q2) => $q2->where('id', $categoryId));
    }
    return $q;
})
```

### Frontend Changes

#### Search.jsx - Replace Category Dropdown

```jsx
// Import Autocomplete and Chip from MUI
import { Autocomplete, Chip, TextField } from '@mui/material';

// Replace lines 117-132 with:
<Grid item xs={12} sm={12}>
    <Autocomplete
        multiple
        options={course_categories}
        getOptionLabel={(option) => option.name}
        value={course_categories.filter(cat =>
            (filters.category_ids || []).includes(cat.id)
        )}
        onChange={(e, newValue) => {
            const ids = newValue.map(v => v.id);
            transform(() => ({
                ...filters,
                page: 1,
                category_ids: ids
            }));
            handleFilterSubmit(e);
        }}
        renderTags={(value, getTagProps) =>
            value.map((option, index) => (
                <Chip
                    label={option.name}
                    size="small"
                    {...getTagProps({ index })}
                />
            ))
        }
        renderInput={(params) => (
            <TextField
                {...params}
                label={translatables.texts.category}
                size="small"
                placeholder={filters.category_ids?.length ? '' : 'All'}
            />
        )}
    />
</Grid>
```

#### Update Initial Filter State

```jsx
// In useForm initial values, change:
category_id: filters.category_id || '',

// To:
category_ids: filters.category_ids || [],
```

### Translation Updates

Add to both `lang/en/texts.php` and `lang/ja/texts.php`:

```php
'categories' => 'Categories',  // en
'categories' => 'カテゴリー',   // ja
```

## Expected Tests

### Backend Tests (PHPUnit)

```php
// tests/Feature/CourseSearchTest.php
- test_can_filter_courses_by_single_category()
- test_can_filter_courses_by_multiple_categories_with_and_logic()
- test_course_without_all_categories_excluded_from_results()
- test_invalid_category_id_returns_validation_error()
- test_empty_category_ids_returns_all_courses()
```

### Manual Testing Checklist

- [ ] Navigate to /classes
- [ ] Click category filter field
- [ ] Select multiple categories from dropdown
- [ ] Verify chips appear for each selection
- [ ] Click X on chip to remove category
- [ ] Verify filtered results update correctly
- [ ] Test with 0, 1, 2, 3+ categories selected
- [ ] Verify pagination resets when filter changes
- [ ] Test on mobile viewport

## Dependencies

- Requires migration `2025_07_14_193348_create_course_category_course_table.php` to be run
- MUI Autocomplete component (already available in project)

## Design Decisions

1. **Filter Logic**: AND logic - course must have ALL selected categories to appear in results
2. **URL Parameters**: Will use Laravel's array syntax `?category_ids[]=5&category_ids[]=3` (handled automatically by Inertia)
