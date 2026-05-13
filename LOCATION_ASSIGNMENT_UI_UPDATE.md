# Location Assignment UI Update

## Summary

Added location assignment fields to the user create/edit modal in the Admin > Users page, allowing admins to assign specific locations to users directly from the UI.

---

## Changes Made

### 1. Backend Updates

**File:** `pos_inflix_backend/src/controllers/adminController.js`

- ✅ Updated `listUsers` to include `assignedLocationIds` and `defaultLocationId` in the response
- ✅ `createUser` and `updateUser` already support location fields (from Phase 4)

### 2. Frontend API Updates

**File:** `pos_inflix_frontend/src/app/(routes)/settings/admin/service/adminApi.ts`

- ✅ Added `assignedLocationIds` and `defaultLocationId` to `User` interface
- ✅ Updated `createUser` payload type to include location fields
- ✅ Updated `updateUser` payload type to include location fields
- ✅ Added `listLocations()` function to fetch available locations
- ✅ Added `Location` interface

### 3. Frontend UI Updates

**File:** `pos_inflix_frontend/src/app/(routes)/settings/admin/page.tsx`

- ✅ Added location state management in `UserUpsertModal`
- ✅ Added `useEffect` to fetch locations when modal opens
- ✅ Added "Assigned Locations" section with checkboxes for each location
- ✅ Added "Default Location" dropdown (only shown when locations are assigned)
- ✅ Added `toggleLocation` function to handle location selection
- ✅ Updated `save` function to include location fields in API calls
- ✅ Updated edit handler to fetch full user details (including location fields)

---

## UI Features

### Assigned Locations Section

- **Checkbox list** of all active locations in the tenant
- **Help text** explaining behavior:
  - Empty = user has access to all locations (admin-like)
  - Selected = user can only access assigned locations
- **Scrollable** if many locations (max-height: 40vh)
- Shows location name and type (store/warehouse)

### Default Location Section

- **Dropdown** that only appears when at least one location is assigned
- **Filtered** to show only assigned locations
- **Auto-updates** if default location is removed from assigned locations
- **Required** when locations are assigned (must be one of assigned locations)

---

## How to Use

1. **Open the user modal:**
   - Click "New user" or "Edit user" from the Users table

2. **Assign locations:**
   - Check the boxes next to locations the user should access
   - Leave all unchecked for access to all locations (admin-like)

3. **Set default location:**
   - If locations are assigned, select a default location from the dropdown
   - This will be used as the default when creating new sales/repairs

4. **Save:**
   - Click "Save" to create/update the user with location assignments

---

## Behavior

### Empty Location Assignment
- User has access to **all locations** in the tenant
- Similar to admin access (but still subject to role permissions)
- `defaultLocationId` can be set to any location in tenant

### Non-Empty Location Assignment
- User can **only access** assigned locations
- Cannot see or create records for other locations
- `defaultLocationId` **must** be one of assigned locations
- Backend validates this and returns 400 if invalid

---

## Testing

1. **Create a new user with locations:**
   - Open "New user" modal
   - Select one or more locations
   - Set default location
   - Save and verify user is created

2. **Edit existing user:**
   - Click "Edit user" on an existing user
   - Verify current location assignments are shown
   - Add/remove locations
   - Update default location
   - Save and verify changes

3. **Test location access:**
   - Login as user with limited locations
   - Verify they only see data from assigned locations
   - Verify they cannot create records for other locations

---

## Files Changed

1. `pos_inflix_backend/src/controllers/adminController.js` - Added location fields to listUsers response
2. `pos_inflix_frontend/src/app/(routes)/settings/admin/service/adminApi.ts` - Updated types and added listLocations
3. `pos_inflix_frontend/src/app/(routes)/settings/admin/page.tsx` - Added location UI to UserUpsertModal

---

## Notes

- Location fields are optional - existing users without location assignments will continue to work
- Backend validation ensures location integrity (Phase 4 implementation)
- UI automatically handles edge cases (clearing default when location removed, etc.)
