# Task Files

This directory contains task files created by the planner agent for the builder agent to execute.

## Workflow

```
1. User requests feature → Planner explores codebase → Creates task file
2. Builder reads task file → Implements → Runs tests → Marks complete
```

## Naming Convention

```
XXX-short-description.md
```

Where `XXX` is a zero-padded number (001, 002, etc.) and `short-description` is a kebab-case summary.

## Task File Format

```markdown
# XXX-task-name

## Summary
One-line description of what this task accomplishes.

## Requirements
- Specific requirement 1
- Specific requirement 2

## Implementation

### Backend Changes
**Files:**
- `app/Http/Controllers/API/ExampleController.php:45-60` - Add method
- `app/Services/API/ExampleService.php:120-150` - Modify logic

**Details:**
Specific implementation details, method signatures, patterns to follow.

### Frontend Changes
**Files:**
- `resources/js/pages/Example/Index.jsx` - Add component

**Details:**
Component structure, state management approach.

### Database Changes
**Migration:** `database/migrations/YYYY_MM_DD_HHMMSS_create_example_table.php`
**Model updates:** `app/Models/Example.php` - Add to $fillable

### Web3 Changes
**Files:**
- `web3/run/example-script.mjs` - New entry point
- `web3/common/example-helper.mjs` - Helper function

**Details:**
Blockfrost queries, tx building approach, env vars needed.

## Tests

### Backend Tests
- Create: `tests/Feature/API/ExampleTest.php`
- Test cases:
  - Test successful case
  - Test validation errors
  - Test authorization
- Run: `sail test --filter ExampleTest`

### Web3 Tests
- Create: `web3/common/__tests__/example-helper.test.mjs`
- Test cases:
  - Test helper function
  - Test error handling
- Run: `cd web3 && npm test`

## Completion Criteria
- [ ] API endpoint returns expected response
- [ ] Frontend component renders correctly
- [ ] All tests pass
- [ ] No linting errors

## Context References
- Similar implementation: `app/Services/API/SimilarService.php`
- API docs: `docs/related-api.md`
- Existing pattern: `web3/run/similar-script.mjs`
```

## Parallelization

Multiple builders can work on different task files simultaneously:

```bash
claude --agent builder "tasks/001-feature-a.md" &
claude --agent builder "tasks/002-feature-b.md" &
```

Ensure tasks don't have conflicting file changes before running in parallel.
