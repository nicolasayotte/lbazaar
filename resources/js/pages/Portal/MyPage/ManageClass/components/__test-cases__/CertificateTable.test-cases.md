# CertificateTable Component - Manual Test Cases

## Component: CertificateTable.jsx

### Props
- `students`: Array of student objects with certificate data
- `onMint`: Function callback for minting certificates
- `onRetry`: Function callback for retrying failed mints
- `minting`: Object mapping student IDs to boolean minting status
- `translatables`: Object containing i18n strings

### Test Case 1: Empty State
**Input:**
```jsx
<CertificateTable
  students={[]}
  onMint={() => {}}
  onRetry={() => {}}
  minting={{}}
  translatables={mockTranslatables}
/>
```
**Expected:** EmptyCard component displays with "No records found" message

### Test Case 2: Eligible Student - Shows Mint Button
**Input:**
```jsx
students={[{
  id: 1,
  name: "John Doe",
  completed_at: "2024-02-16",
  certificate_status: "eligible",
  certificate_tx_hash: null
}]}
```
**Expected:**
- Status badge shows "Eligible" (blue/info color)
- Mint button is visible and enabled
- No transaction hash displayed
- No retry button visible

### Test Case 3: Minting State - Shows Loading Spinner
**Input:**
```jsx
students={[{
  id: 1,
  name: "John Doe",
  certificate_status: "eligible",
  ...
}]}
minting={{ 1: true }}
```
**Expected:**
- Status badge shows "Eligible"
- Mint button shows loading spinner
- Button text changes to "Minting"
- Button is disabled during minting

### Test Case 4: Minted Certificate - Shows Explorer Link
**Input:**
```jsx
students={[{
  id: 1,
  name: "Jane Smith",
  completed_at: "2024-02-16",
  certificate_status: "minted",
  certificate_tx_hash: "abc123def456ghi789jkl012mno345pqr678"
}]}
```
**Expected:**
- Status badge shows "Minted" (green/success color)
- Transaction hash displays as "abc123de..." (first 8 chars)
- Transaction hash is a clickable link
- Link opens in new tab to: `https://preprod.cardanoscan.io/transaction/{full_hash}`
- Explorer icon button visible in Actions column
- Clicking explorer icon opens same link in new tab

### Test Case 5: Failed Certificate - Shows Retry Button
**Input:**
```jsx
students={[{
  id: 1,
  name: "Bob Johnson",
  completed_at: "2024-02-16",
  certificate_status: "failed",
  certificate_tx_hash: null
}]}
```
**Expected:**
- Status badge shows "Failed" (red/error color)
- Retry button (Replay icon) is visible
- No mint button visible
- No transaction hash displayed
- Clicking retry button calls `onRetry(1)`

### Test Case 6: Minting Status Badge
**Input:**
```jsx
students={[{
  id: 1,
  name: "Alice Wong",
  certificate_status: "minting"
}]}
```
**Expected:**
- Status badge shows "Minting" (orange/warning color)
- No action buttons visible (student is already being processed)

### Test Case 7: Multiple Students with Different Statuses
**Input:**
```jsx
students={[
  { id: 1, name: "Student A", certificate_status: "eligible", ... },
  { id: 2, name: "Student B", certificate_status: "minting", ... },
  { id: 3, name: "Student C", certificate_status: "minted", certificate_tx_hash: "abc123...", ... },
  { id: 4, name: "Student D", certificate_status: "failed", ... }
]}
minting={{ 2: true }}
```
**Expected:**
- Row 1: Mint button enabled
- Row 2: Mint button disabled with loading spinner
- Row 3: Explorer link and icon visible
- Row 4: Retry button visible

### Test Case 8: Button Click Callbacks
**Input:** Click actions on various students
**Expected:**
- Clicking "Mint" on eligible student calls `onMint(studentId)`
- Clicking "Retry" on failed student calls `onRetry(studentId)`
- Clicking explorer link opens new tab with correct URL
- All callbacks receive correct student ID

### Test Case 9: Status Badge Color Mapping
**Expected Colors:**
- `eligible` → Blue (info)
- `minting` → Orange (warning)
- `minted` → Green (success)
- `failed` → Red (error)

### Test Case 10: Table Structure
**Expected Columns:**
1. Student (name)
2. Completed Date (center-aligned)
3. Status (center-aligned, badge)
4. Transaction (center-aligned, truncated hash or "-")
5. Actions (center-aligned, buttons/icons)

## Visual Regression Checks
- Table uses Material-UI Paper container with elevation
- All text properly aligned (left for names, center for others)
- Icon buttons have proper hover states
- Links underlined on hover
- Buttons use proper MUI variant and size
- Loading spinner size matches button height
- Tooltips appear on icon button hover

## Accessibility Checks
- Buttons have proper tooltips
- Links have `target="_blank"` with `rel="noopener noreferrer"`
- All interactive elements are keyboard accessible
- Status colors provide semantic meaning
- Icon buttons have descriptive tooltips

## Integration Points
- Uses EmptyCard component for empty state
- Uses Material-UI components (Table, Button, Chip, IconButton, etc.)
- Uses Material Icons (OpenInNew, Replay)
- Uses Stack for layout
- Integrates with translatables for i18n
