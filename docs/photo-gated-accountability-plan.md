# Photo-Gated Booking Accountability System

## Honest Scope

This system **does not prevent** equipment sharing/subletting. No software can without GPS hardware.

What it does:
- Makes the borrowing farmer **fully accountable** for everything from pickup to return
- Creates **photo evidence** at both ends of every rental
- Detects **suspicious over-usage** via hour meter comparison
- Provides **deposit tracking**, **dispute resolution**, and a **strike/ban system**
- Makes casual sharing economically unattractive (deposit at risk, strikes = ban, platform access lost)

**Core principle:** Farmer A is liable for everything that happens from pickup to return. Farmer B is invisible to the system — and that's fine, because Farmer A pays.

---

## 1. Database Changes — Migration 006

### 1.1 — New columns on `bookings`

```sql
ALTER TABLE bookings
  ADD COLUMN hour_meter_start       NUMERIC(10,2),
  ADD COLUMN hour_meter_end         NUMERIC(10,2),
  ADD COLUMN security_deposit       NUMERIC(10,2),
  ADD COLUMN pickup_documented_at   TIMESTAMPTZ,
  ADD COLUMN pickup_documented_by   UUID REFERENCES profiles(id),
  ADD COLUMN return_documented_at   TIMESTAMPTZ,
  ADD COLUMN return_documented_by   UUID REFERENCES profiles(id),
  ADD COLUMN co_renter_id           UUID REFERENCES profiles(id),
  ADD COLUMN anomaly_flagged        BOOLEAN DEFAULT false,
  ADD COLUMN anomaly_note           TEXT,
  ADD COLUMN admin_override         BOOLEAN DEFAULT false;
```

### 1.2 — New columns on `profiles`

```sql
ALTER TABLE profiles
  ADD COLUMN strikes      INTEGER DEFAULT 0,
  ADD COLUMN is_banned    BOOLEAN DEFAULT false,
  ADD COLUMN banned_at    TIMESTAMPTZ,
  ADD COLUMN banned_reason TEXT;
```

### 1.3 — Extend `uploads.upload_type` CHECK constraint

```sql
ALTER TABLE uploads DROP CONSTRAINT uploads_upload_type_check;
ALTER TABLE uploads ADD CONSTRAINT uploads_upload_type_check CHECK (
  upload_type IN (
    'receipt', 'machinery_image', 'document', 'other',
    'pickup_equipment', 'pickup_selfie', 'pickup_hour_meter',
    'return_equipment', 'return_hour_meter', 'return_damage'
  )
);
```

### 1.4 — New table `reports`

```sql
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  report_type     TEXT NOT NULL CHECK (report_type IN ('suspicious_activity', 'damage', 'subletting', 'other')),
  description     TEXT NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  resolved_by     UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);
```

### 1.5 — New table `disputes`

```sql
CREATE TABLE disputes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  opened_by        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason           TEXT NOT NULL,
  status           TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved_lender', 'resolved_renter', 'admin_resolved')),
  resolution_notes TEXT,
  resolved_by      UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);
```

### 1.6 — New index

```sql
CREATE INDEX idx_uploads_booking_type ON uploads(booking_id, upload_type);
```

---

## 2. Database Changes — Migration 007 (RLS)

### 2.1 — `reports` table

```sql
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can report misuse
CREATE POLICY "Users create reports" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Users can read their own reports and reports on bookings they're involved in
CREATE POLICY "Users read own reports" ON reports
  FOR SELECT USING (
    reporter_id = auth.uid()
    OR EXISTS (SELECT 1 FROM bookings WHERE bookings.id = reports.booking_id 
      AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid()))
  );

-- No UPDATE/DELETE for regular users — admin handles via service_role
```

### 2.2 — `disputes` table

```sql
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Lender (owner) or admin can open disputes
CREATE POLICY "Owners create disputes" ON disputes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = disputes.booking_id 
      AND bookings.owner_id = auth.uid())
  );

-- Users can see disputes on their bookings
CREATE POLICY "Users read own disputes" ON disputes
  FOR SELECT USING (
    opened_by = auth.uid()
    OR EXISTS (SELECT 1 FROM bookings WHERE bookings.id = disputes.booking_id 
      AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid()))
  );

-- No UPDATE/DELETE for regular users — admin handles via service_role
```

### 2.3 — `uploads` RLS — add admin SELECT

```sql
-- Admin needs to read all uploads for bookings management.
-- This is handled via createAdminClient() in server actions, so no RLS policy needed.
-- The existing INSERT policy "Users create uploads" (user_id = auth.uid()) covers user uploads.
-- Server actions use admin client for DB writes to bypass RLS.
```

---

## 3. Updated Constants

```typescript
// src/lib/constants.ts — add:

export const DOCUMENTATION_UPLOAD_TYPES = {
  pickup_equipment:   'pickup_equipment',
  pickup_selfie:      'pickup_selfie',
  pickup_hour_meter:  'pickup_hour_meter',
  return_equipment:   'return_equipment',
  return_hour_meter:  'return_hour_meter',
  return_damage:      'return_damage',
} as const

export const REPORT_TYPES = {
  suspicious_activity: { label: 'Suspicious Activity', color: 'bg-yellow-100 text-yellow-800' },
  damage:              { label: 'Damage Report',       color: 'bg-red-100 text-red-800'    },
  subletting:          { label: 'Subletting/Sharing',   color: 'bg-orange-100 text-orange-800' },
  other:               { label: 'Other',                color: 'bg-gray-100 text-gray-800'   },
} as const

export const DISPUTE_STATUSES = {
  open:              { label: 'Open',                color: 'bg-yellow-100 text-yellow-800' },
  resolved_lender:   { label: 'Resolved — Lender',   color: 'bg-green-100 text-green-800'  },
  resolved_renter:   { label: 'Resolved — Renter',   color: 'bg-green-100 text-green-800'  },
  admin_resolved:     { label: 'Resolved — Admin',    color: 'bg-blue-100 text-blue-800'   },
} as const

export const ANOMALY_THRESHOLD = 50  // percent over declared hours
```

---

## 4. Server Actions

All new actions go in `src/actions/bookings.ts` (same file as existing booking actions).

### 4.1 — `documentPickup(bookingId: string, formData: FormData)`

**Called by:** Lender (owner) or Admin

**FormData fields:**
| Key | Type | Required | Notes |
|-----|------|----------|-------|
| `hour_meter_start` | string (number) | No | Only if equipment has hour meter |
| `photo_equipment` | File | Yes | Equipment condition (before) |
| `photo_hour_meter` | File | No | Photo of meter display |
| `photo_selfie` | File | Yes | Farmer with equipment |

**Logic:**
1. Get user from `createClient()`, return `{ error: "Unauthorized" }` if not authenticated
2. Fetch booking via `createAdminClient()` (bypass RLS to verify ownership)
3. Guard: caller must be `booking.owner_id` or admin
4. Guard: booking status must be `"approved"`
5. Upload photos to Vercel Blob via `uploadFile()`, folder: `"booking-pickup"`
6. Insert rows into `uploads` table (one per photo) with correct `upload_type`
7. Parse `hour_meter_start` to number if provided
8. Update booking: `hour_meter_start`, `pickup_documented_at = NOW()`, `pickup_documented_by = user.id`, `status = "active"`
9. Update machinery: `status = "in_use"` (same as existing activate logic)
10. Send notifications to renter + owner
11. Revalidate: `"/bookings", "page"`, `"/bookings/[id]", "page"`, `"/dashboard"`, `"/machinery"`, `"/admin/bookings"`
12. Return `{ success: true }`

### 4.2 — `documentReturn(bookingId: string, formData: FormData)`

**Called by:** Lender (owner) or Admin

**FormData fields:**
| Key | Type | Required | Notes |
|-----|------|----------|-------|
| `hour_meter_end` | string (number) | No | Only if equipment has hour meter |
| `photo_equipment` | File | Yes | Equipment condition (after) |
| `photo_hour_meter` | File | No | Photo of meter display |
| `photo_damage` | File | No | Max 3 damage photos |
| `damage_description` | string | No | Description of damage |
| `open_dispute` | string (boolean) | No | "true" if dispute should open |

**Logic:**
1. Get user, verify auth
2. Fetch booking via admin client + machinery join (need `hectares_capacity`)  
3. Guard: caller must be `booking.owner_id` or admin
4. Guard: booking status must be `"active"`
5. Upload equipment + hour meter photos to Blob
6. If damage photos provided, upload those too
7. Insert rows into `uploads` table
8. Parse `hour_meter_end` to number if provided
9. **Compute anomaly** (only if `hour_meter_start`, `hour_meter_end`, `requested_hectares > 0`, `hectares_capacity > 0`):
   - `actual_hours = hour_meter_end - hour_meter_start`
   - `declared_hours = requested_hectares / hectares_capacity`
   - `deviation = ((actual_hours - declared_hours) / declared_hours) * 100`
   - If `deviation > ANOMALY_THRESHOLD (50)`:
     - Set `anomaly_flagged = true`
     - Set `anomaly_note = "Usage exceeded declared by X%. Declared: Y.Yh, Actual: Z.Zh."`
10. Update booking: `hour_meter_end`, `actual_hours`, `actual_hectares = actual_hours * hectares_capacity` (if computed), `return_documented_at`, `return_documented_by`, `status = "completed"`, `anomaly_flagged`, `anomaly_note`
11. Reset machinery status (same race-condition-safe logic as existing `updateBookingStatus`)
12. If `open_dispute === "true"`: create dispute record
13. Send notifications
14. Revalidate: `"/bookings", "page"`, `"/bookings/[id]", "page"`, `"/dashboard"`, `"/machinery"`, `"/admin/bookings"`
15. Return `{ success: true, anomaly?: { flagged: boolean, deviation: number } }`

### 4.3 — `reportMisuse(bookingId: string, reportType: string, description: string)`

**Called by:** Any authenticated user

**Logic:**
1. Get user, verify auth
2. Validate `reportType` is in REPORT_TYPES
3. Insert into `reports` table
4. Notify admin + booking owner
5. Revalidate: `"/bookings/[id]", "page"`
6. Return `{ success: true }`

### 4.4 — `openDispute(bookingId: string, reason: string)`

**Called by:** Lender (owner) or Admin

**Logic:**
1. Get user, verify auth
2. Fetch booking → verify caller is owner or admin
3. Check no existing open dispute for this booking
4. Insert into `disputes`
5. Notify admin + renter
6. Revalidate: `"/bookings/[id]", "page"`, `"/admin/bookings"`
7. Return `{ success: true, disputeId: string }`

### 4.5 — `resolveDispute(disputeId: string, resolution: string, notes: string)`

**Called by:** Admin only

**Logic:**
1. Verify admin
2. Fetch dispute → must be `"open"`
3. Update dispute: `status = resolution`, `resolved_by = user.id`, `resolution_notes = notes`, `resolved_at = NOW()`
4. Notify both parties
5. Revalidate: `"/bookings/[id]", "page"`, `"/admin/bookings"`
6. Return `{ success: true }`

### 4.6 — `adminForceComplete(bookingId: string, notes: string)`

**Called by:** Admin only

**Purpose:** Emergency override for stuck bookings (lender won't document, no hour meter, etc.)

**Logic:**
1. Verify admin
2. Verify booking status is `"active"` or `"approved"`
3. Update booking: `status = "completed"`, `admin_override = true`, `notes = notes`
4. Handle machinery status reset
5. Notify both parties
6. Revalidate all paths
7. Return `{ success: true }`

---

## 5. New Components

### 5.1 — `PickupDocumentationForm`

**Path:** `src/components/bookings/pickup-documentation-form.tsx`

**Type:** Client component

**Props:** `{ bookingId: string; onSuccess?: () => void; onCancel?: () => void }`

**UI:**
```
┌──────────────────────────────────────────────┐
│ Document Pickup — Before Handover            │
│                                              │
│ Hour Meter Reading (if applicable)           │
│ [_______________hours__]                     │
│                                              │
│ Equipment Photo *                            │
│ [Choose File] [preview]                      │
│                                              │
│ Hour Meter Photo                             │
│ [Choose File] [preview]                      │
│                                              │
│ Farmer Selfie with Equipment *               │
│ [Choose File] [preview]                      │
│                                              │
│ [Cancel]  [Confirm Pickup → Mark as Active]  │
└──────────────────────────────────────────────┘
```

**Behavior:**
- Calls `documentPickup` server action on submit
- Validates required files before submit
- On success: calls `router.refresh()` then `onSuccess?.()`
- On error: shows red error text

### 5.2 — `ReturnDocumentationForm`

**Path:** `src/components/bookings/return-documentation-form.tsx`

**Type:** Client component

**Props:** `{ bookingId: string; onSuccess?: () => void; onCancel?: () => void }`

**UI:**
```
┌──────────────────────────────────────────────┐
│ Document Return — After Use                  │
│                                              │
│ Hour Meter Reading (if applicable)           │
│ [_______________hours__]                     │
│                                              │
│ Equipment Photo (after use) *                │
│ [Choose File] [preview]                      │
│                                              │
│ Hour Meter Photo                             │
│ [Choose File] [preview]                      │
│                                              │
│ ☐ Equipment has damage                       │
│   ┌─ (if checked) ─────────────────────────┐ │
│   │ Damage Photos (up to 3)                │ │
│   │ [Choose Files] [preview] [preview]     │ │
│   │                                       │ │
│   │ Damage Description:                   │ │
│   │ [_________________________________]   │ │
│   │                                       │ │
│   │ ☐ Open dispute for this damage       │ │
│   └───────────────────────────────────────┘ │
│                                              │
│ [Cancel]  [Confirm Return → Mark Completed]  │
└──────────────────────────────────────────────┘
```

**Behavior:**
- Calls `documentReturn` server action
- Conditionally shows damage fields
- Multiple damage photos accepted (iterates in action)
- On success: `router.refresh()` + `onSuccess?.()`
- If anomaly returned: page refresh shows DiscrepancyBanner

### 5.3 — `DocumentationTimeline`

**Path:** `src/components/bookings/documentation-timeline.tsx`

**Type:** Server component

**Props:** `{ bookingId: string }`

**Fetches from `uploads` table:** `SELECT * FROM uploads WHERE booking_id = {id} AND upload_type IN (pickup_*, return_*) ORDER BY created_at`

**UI:**
```
PICKUP DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━
✓ Completed by Juan Dela Cruz on June 22, 2026, 8:30 AM
  Hour meter start: 127.5

  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ [Equipment]   │ │ [Hr Meter]   │ │ [Selfie]     │
  └──────────────┘ └──────────────┘ └──────────────┘

RETURN DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━
✓ Completed by Juan Dela Cruz on June 25, 2026, 4:15 PM
  Hour meter end: 135.2   |   Actual: 7.7 hours
  Est. hours: 5.0   |   Deviation: 54% ⚠️

  ┌──────────────┐ ┌──────────────┐
  │ [Equipment]   │ │ [Hr Meter]   │
  └──────────────┘ └──────────────┘
```

**If not yet documented:**
```
PICKUP DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━
⏳ Pending — Photos and hour meter reading must be uploaded
   before this booking can be marked as Active.
```

### 5.4 — `DiscrepancyBanner`

**Path:** `src/components/bookings/discrepancy-banner.tsx`

**Type:** Server component

**Props:** `{ booking: { anomaly_flagged, anomaly_note } }`

**UI (when flagged):**
```
┌────────────────────────────────────────────────────────────┐
│ ⚠️ Usage Alert                                             │
│                                                            │
│ Usage exceeded declared by 156%.                           │
│ Declared: 5.0 hours  |  Actual: 12.8 hours                │
│                                                            │
│ Possible causes: undeclared land area or equipment sharing. │
│                                                            │
│ [Report Misuse]                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.5 — `ReportMisuseButton`

**Path:** `src/components/bookings/report-misuse-button.tsx`

**Type:** Client component

**Props:** `{ bookingId: string }`

**UI:**
- Small outline button: "Report Misuse"
- Click → opens Dialog with:
  - Dropdown: Report type (Suspicious Activity / Damage / Subletting / Other)
  - Textarea: Description
  - Submit button
- On success: toast notification, closes dialog

---

## 6. Modified Existing Components

### 6.1 — `BookingActions` (`src/app/(auth)/bookings/[id]/booking-actions.tsx`)

**Changes:**
1. Add state: `showPickupForm`, `showReturnForm`
2. When `isOwner && status === "approved"`:
   - Show "Document Pickup" button → sets `showPickupForm = true`
   - IF `showPickupForm`: render `<PickupDocumentationForm bookingId={bookingId} onSuccess={() => router.refresh()} onCancel={() => setShowPickupForm(false)} />`
3. When `status === "active" && isOwner`:
   - Show "Document Return" button → sets `showReturnForm = true`
   - IF `showReturnForm`: render `<ReturnDocumentationForm bookingId={bookingId} onSuccess={() => router.refresh()} onCancel={() => setShowReturnForm(false)} />`
4. Renter can NO LONGER complete — remove `isRenter` from "Mark Completed" condition
5. Keep: Approve/Deny for pending, Cancel for renter — unchanged

### 6.2 — `AdminBookingActions` (`src/components/admin/booking-actions.tsx`)

**Changes:**
1. Same pattern: replace "Activate" button with PickupDocumentationForm trigger
2. Replace "Complete" button with ReturnDocumentationForm trigger
3. Admin can always document (no ownership check in the action — action verifies admin role)

### 6.3 — Booking Detail Page (`src/app/(auth)/bookings/[id]/page.tsx`)

**Add sections:**
1. After the back link: `<DocumentationTimeline bookingId={id} />`
2. Between timeline and booking info: `<DiscrepancyBanner booking={b} />`
3. After BookingActions: `<ReportMisuseButton bookingId={id} />`

### 6.4 — Admin Bookings Page (`src/app/admin/bookings/page.tsx`)

**Add:** A "View" link/column in the table that navigates to `/bookings/{id}` — linking admin to the booking detail page where documentation timeline and actions live.

### 6.5 — User Detail Modal (`src/components/admin/user-detail-modal.tsx`)

**Add fields:**
- Strikes: X/3 (with badge)
- Status: Active / Banned
- If banned: show reason + banned_at

---

## 7. Revalidation Map

| Action | Paths |
|--------|-------|
| `documentPickup` | `/bookings`, `/bookings/[id]` (page), `/dashboard`, `/machinery`, `/admin/bookings` |
| `documentReturn` | Same as above |
| `reportMisuse` | `/bookings/[id]` (page), `/admin/bookings` |
| `openDispute` | `/bookings/[id]` (page), `/admin/bookings` |
| `resolveDispute` | `/bookings/[id]` (page), `/admin/bookings`, `/dashboard` |
| `adminForceComplete` | All of the above |

> **Note on `/bookings/[id]` (page):** This revalidates ALL booking detail pages, not just the specific one. Overhead is acceptable for this scale.

---

## 8. Who Can Do What

| Action | Lender (owner) | Admin | Farmer (renter) |
|--------|:---:|:---:|:---:|
| Document Pickup | ✅ | ✅ | ❌ |
| Document Return | ✅ | ✅ | ❌ |
| Approve/Deny booking | ✅ | ✅ | ❌ |
| Cancel booking | ❌ | ✅ | ✅ (own only) |
| View documentation | ✅ | ✅ | ✅ (view only) |
| Report misuse | ✅ | ✅ | ✅ |
| Open dispute | ✅ | ✅ | ❌ |
| Resolve dispute | ❌ | ✅ | ❌ |
| Admin force-complete | ❌ | ✅ | ❌ |

---

## 9. Implementation Order (Phase 1 — MVP)

| # | File | What |
|---|------|------|
| 1 | `supabase/migrations/006_photo_accountability.sql` | All schema changes |
| 2 | `supabase/migrations/007_photo_rls.sql` | RLS for reports, disputes |
| 3 | `src/lib/constants.ts` | Add new constants |
| 4 | `src/actions/bookings.ts` | Add `documentPickup`, `documentReturn`, `reportMisuse`, `openDispute`, `resolveDispute`, `adminForceComplete` |
| 5 | `src/components/bookings/pickup-documentation-form.tsx` | Create component |
| 6 | `src/components/bookings/return-documentation-form.tsx` | Create component |
| 7 | `src/components/bookings/documentation-timeline.tsx` | Create component |
| 8 | `src/components/bookings/discrepancy-banner.tsx` | Create component |
| 9 | `src/components/bookings/report-misuse-button.tsx` | Create component |
| 10 | `src/app/(auth)/bookings/[id]/booking-actions.tsx` | Modify — form triggers |
| 11 | `src/components/admin/booking-actions.tsx` | Modify — form triggers |
| 12 | `src/app/(auth)/bookings/[id]/page.tsx` | Add timeline, banner, report button |
| 13 | `src/app/admin/bookings/page.tsx` | Add "View" link to `/bookings/{id}` |
| 14 | `scripts/seed.ts` | Add new fields to seed bookings |
| 15 | `scripts/test-backend.ts` | Add documentation flow tests |
| 16 | `scripts/quick-test.ts` | Add E2E documentation flow tests |

### Phase 2 (later)

| # | File | What |
|---|------|------|
| 17 | `src/components/admin/user-detail-modal.tsx` | Add strike/ban display |
| 18 | `src/actions/admin.ts` | Add `addStrike`, `removeStrike`, `toggleBan` |
| 19 | `src/components/admin/strike-badge.tsx` | Strike badge component |
| 20 | Group booking UI | `co_renter_id` form field |

---

## 10. Edge Cases & Guards

| Scenario | Guard |
|----------|-------|
| Equipment has no hour meter | `hour_meter_start` / `hour_meter_end` are nullable; skip anomaly compute |
| Machinery with `hectares_capacity = 0` (trucks, dryers) | Skip anomaly compute — only run if `capacity > 0 AND hectares > 0` |
| `requested_hectares` is NULL | Skip anomaly compute |
| Legacy active bookings after migration | Documentation form always asks for reading; works for new and legacy |
| Multiple damage photos | Form sends multiple entries with key `photo_damage`; action iterates via `formData.getAll("photo_damage")`, calls `uploadFile` per file |
| Race condition: two people try to document same booking | Use database-level conditional update (check status in update WHERE clause) or rely on the state machine check |
| Lender never documents return | Admin uses `adminForceComplete` after X days |
| Dispute already exists | `openDispute` checks for existing open dispute before inserting |
| BLOB_READ_WRITE_TOKEN missing | `uploadFile` throws; action catches and returns error message |
| Farmer is non-tech (no smartphone) | Lender does all documentation at pickup/return in person. Farmer just shows up. |
| Uploaded photos are immutable | No DELETE RLS policy on `uploads`. This is intentional — documentation photos are permanent evidence. Only admin via service_role can delete. |
| Deposit collection/release | `security_deposit` amount is tracked in the system, but actual cash exchange is manual (handed during pickup, returned after lender confirms). The system tracks the amount; the people handle the money. Matching the rural cash-based reality. |

---

## 11. What This Does NOT Solve

| Problem | Why |
|---------|-----|
| Physically preventing equipment sharing | No GPS, no camera during use. Cannot be done with software alone. |
| Proving subletting definitively | Anomaly flag is a signal, not proof. Farmer can claim difficult terrain, rain, inexperience. |
| Zero-touch farmer flow | Farmer must be physically present for pickup selfie and return. |

**What it DOES do:** Makes Farmer A the accountable party with photo evidence, deposit at stake, and platform access at risk. Creates enough friction that casual sharing isn't worth it.

---

## 12. Test Scenarios

### Backend (`test-backend.ts`)

| # | Test |
|---|------|
| 1 | `documentPickup` — photos upload, status → active, machinery → in_use |
| 2 | `documentReturn` — photos upload, status → completed, anomaly NOT flagged (<50%) |
| 3 | `documentReturn` — anomaly flagged (>50% deviation) |
| 4 | `documentReturn` — anomaly skipped (no hour meter) |
| 5 | `documentReturn` — anomaly skipped (hectares_capacity = 0) |
| 6 | Non-owner blocked from `documentPickup` |
| 7 | Non-owner blocked from `documentReturn` |
| 8 | Status guard: can't document pickup if not "approved" |
| 9 | Status guard: can't document return if not "active" |
| 10 | `reportMisuse` — insert succeeds, notification sent |
| 11 | `openDispute` — insert succeeds, duplicate blocked |
| 12 | `resolveDispute` — non-admin blocked |
| 13 | `adminForceComplete` — override works, non-admin blocked |

### E2E (`quick-test.ts`)

| # | Flow |
|---|------|
| 1 | Lender logs in → booking detail → Document Pickup → upload photos → submit → verify status "Ongoing Rental" |
| 2 | Lender → Document Return → upload photos → submit → verify status "Completed" |
| 3 | Verify DocumentationTimeline renders uploaded photos |
| 4 | Report Misuse button → opens dialog → submit → verify toast |
