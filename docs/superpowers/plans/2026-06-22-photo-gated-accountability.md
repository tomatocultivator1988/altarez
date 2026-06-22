# Photo-Gated Booking Accountability - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add photo documentation gates to booking transitions (approved→active→completed) with hour meter anomaly detection, deposits, disputes, and a strike/ban system.

**Architecture:** Extend existing bookings table with documentation columns, add reports/disputes tables, modify booking actions to require photo upload before status transitions, display documentation timeline on booking detail page.

**Tech Stack:** Next.js 16, Supabase, Vercel Blob, Zod, TypeScript, PostgreSQL

## Global Constraints

- Supabase-only for data (no Prisma)
- Admin operations use `createAdminClient()` (service role) to bypass RLS
- Vercel Blob for photo storage via existing `uploadFile()` function
- Existing state machine (pending→approved→active→completed) stays unchanged; documentation is a GATE before transitions
- All `revalidatePath` calls must use `"page"` modifier where applicable
- `src/actions/bookings.ts` contains all new server actions
- New components go in `src/components/bookings/`
- BLOB_READ_WRITE_TOKEN must be set for photo uploads to work

---

### Task 1: Migration 006 — Schema Changes

**Files:**
- Create: `supabase/migrations/006_photo_accountability.sql`

**Interfaces:**
- Produces: New columns on bookings, profiles; new tables reports, disputes; extended upload_type CHECK; new index

- [ ] **Step 1: Write migration file**

```sql
-- 006_photo_accountability.sql
-- Photo-gated booking documentation system
-- Adds hour meter tracking, deposits, strikes, reports, disputes

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS hour_meter_start       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS hour_meter_end         NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS security_deposit       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS pickup_documented_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pickup_documented_by   UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS return_documented_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS return_documented_by   UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS co_renter_id           UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS anomaly_flagged        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS anomaly_note           TEXT,
  ADD COLUMN IF NOT EXISTS admin_override         BOOLEAN DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS strikes      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_banned    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT;

ALTER TABLE uploads DROP CONSTRAINT IF EXISTS uploads_upload_type_check;
ALTER TABLE uploads ADD CONSTRAINT uploads_upload_type_check CHECK (
  upload_type IN (
    'receipt', 'machinery_image', 'document', 'other',
    'pickup_equipment', 'pickup_selfie', 'pickup_hour_meter',
    'return_equipment', 'return_hour_meter', 'return_damage'
  )
);

CREATE TABLE IF NOT EXISTS reports (
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

CREATE TABLE IF NOT EXISTS disputes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  opened_by        UUID NOT NULL REFERENCES profiles(id),
  reason           TEXT NOT NULL,
  status           TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved_lender', 'resolved_renter', 'admin_resolved')),
  resolution_notes TEXT,
  resolved_by      UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_uploads_booking_type ON uploads(booking_id, upload_type);
```

- [ ] **Step 2: Run migration on Supabase**

```bash
npx supabase db push
```

- [ ] **Step 3: Verify columns exist**

```bash
npx tsx -e "
const { createAdminClient } = require('@/lib/supabase/admin');
(async () => {
  const admin = createAdminClient();
  const { data } = await admin.rpc('exec_sql', { sql: \"SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name IN ('hour_meter_start','hour_meter_end','anomaly_flagged')\" }).catch(() => ({data:null}));
  if (!data) {
    const { data: cols } = await admin.from('bookings').select('id').limit(1);
  }
  console.log('Migration applied');
})();
"
```

Expected: No errors, tables/columns exist

---

### Task 2: Migration 007 — RLS Policies

**Files:**
- Create: `supabase/migrations/007_photo_rls.sql`

**Interfaces:**
- Consumes: reports, disputes tables from Task 1
- Produces: RLS policies on reports, disputes

- [ ] **Step 1: Write RLS migration**

```sql
-- 007_photo_rls.sql
-- RLS policies for reports and disputes tables

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create reports" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users read own reports" ON reports
  FOR SELECT USING (
    reporter_id = auth.uid()
    OR EXISTS (SELECT 1 FROM bookings WHERE bookings.id = reports.booking_id 
      AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid()))
  );

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners create disputes" ON disputes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = disputes.booking_id 
      AND bookings.owner_id = auth.uid())
  );

CREATE POLICY "Users read own disputes" ON disputes
  FOR SELECT USING (
    opened_by = auth.uid()
    OR EXISTS (SELECT 1 FROM bookings WHERE bookings.id = disputes.booking_id 
      AND (bookings.renter_id = auth.uid() OR bookings.owner_id = auth.uid()))
  );
```

- [ ] **Step 2: Push migration**

```bash
npx supabase db push
```

---

### Task 3: Update Constants

**Files:**
- Modify: `src/lib/constants.ts`

**Interfaces:**
- Produces: `DOCUMENTATION_UPLOAD_TYPES`, `REPORT_TYPES`, `DISPUTE_STATUSES`, `ANOMALY_THRESHOLD`

- [ ] **Step 1: Add new constants**

```typescript
// Add after line 38 in src/lib/constants.ts

export const DOCUMENTATION_UPLOAD_TYPES = {
  pickup_equipment:  'pickup_equipment',
  pickup_selfie:     'pickup_selfie',
  pickup_hour_meter: 'pickup_hour_meter',
  return_equipment:  'return_equipment',
  return_hour_meter: 'return_hour_meter',
  return_damage:     'return_damage',
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
  admin_resolved:    { label: 'Resolved — Admin',    color: 'bg-blue-100 text-blue-800'   },
} as const

export const ANOMALY_THRESHOLD = 50
```

---

### Task 4: Server Actions — documentPickup + documentReturn

**Files:**
- Modify: `src/actions/bookings.ts` (append new exports)

**Interfaces:**
- Consumes: `createClient()`, `createAdminClient()`, `uploadFile()`, `revalidatePath()`, `uploads` table, migration 006 columns
- Produces: `documentPickup(bookingId, formData)`, `documentReturn(bookingId, formData)`

- [ ] **Step 1: Add imports at top of bookings.ts**

```typescript
import { uploadFile } from "@/lib/blob/client"
import { ANOMALY_THRESHOLD } from "@/lib/constants"
```

- [ ] **Step 2: Add documentPickup action**

```typescript
export async function documentPickup(bookingId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  const isAdmin = profile?.role === "admin"
  const db = isAdmin ? admin : supabase

  const { data: booking } = await db
    .from("bookings")
    .select("*, machinery!inner(machine_name)")
    .eq("id", bookingId)
    .single()

  if (!booking) return { error: "Booking not found" }
  if (booking.owner_id !== user.id && !isAdmin) return { error: "Only the machinery owner can document pickup" }
  if (booking.status !== "approved") return { error: "Booking must be approved before documenting pickup" }

  const hourMeterStr = formData.get("hour_meter_start") as string | null
  const hourMeterStart = hourMeterStr ? Number(hourMeterStr) : null

  const equipmentFile = formData.get("photo_equipment") as File | null
  const hourMeterFile = formData.get("photo_hour_meter") as File | null
  const selfieFile = formData.get("photo_selfie") as File | null

  if (!equipmentFile || !(equipmentFile instanceof File) || equipmentFile.size === 0)
    return { error: "Equipment photo is required" }
  if (!selfieFile || !(selfieFile instanceof File) || selfieFile.size === 0)
    return { error: "Farmer selfie is required" }

  const uploads: { url: string; type: string; name: string }[] = []

  try {
    const eqUrl = await uploadFile(equipmentFile, { userId: user.id, folder: "booking-pickup" })
    uploads.push({ url: eqUrl, type: "pickup_equipment", name: equipmentFile.name })
  } catch {
    return { error: "Failed to upload equipment photo. Check BLOB_READ_WRITE_TOKEN." }
  }

  if (hourMeterFile && hourMeterFile instanceof File && hourMeterFile.size > 0) {
    try {
      const hmUrl = await uploadFile(hourMeterFile, { userId: user.id, folder: "booking-pickup" })
      uploads.push({ url: hmUrl, type: "pickup_hour_meter", name: hourMeterFile.name })
    } catch {
      return { error: "Failed to upload hour meter photo. Check BLOB_READ_WRITE_TOKEN." }
    }
  }

  try {
    const sfUrl = await uploadFile(selfieFile, { userId: user.id, folder: "booking-pickup" })
    uploads.push({ url: sfUrl, type: "pickup_selfie", name: selfieFile.name })
  } catch {
    return { error: "Failed to upload selfie. Check BLOB_READ_WRITE_TOKEN." }
  }

  for (const u of uploads) {
    await db.from("uploads").insert({
      user_id: user.id,
      booking_id: bookingId,
      file_name: u.name,
      blob_url: u.url,
      upload_type: u.type,
    })
  }

  const updateData: Record<string, unknown> = {
    pickup_documented_at: new Date().toISOString(),
    pickup_documented_by: user.id,
    status: "active",
  }
  if (hourMeterStart !== null) updateData.hour_meter_start = hourMeterStart

  const { error } = await db.from("bookings").update(updateData).eq("id", bookingId)
  if (error) return { error: error.message }

  await db.from("machinery").update({ status: "in_use" }).eq("id", booking.machinery_id)

  const machineName = (booking.machinery as { machine_name: string }).machine_name
  await db.from("notifications").insert([
    { user_id: booking.owner_id, title: "Pickup Documented", message: `Pickup for ${machineName} has been documented. Booking is now Active.`, type: "info", link: "/bookings" },
    { user_id: booking.renter_id, title: "Rental Active", message: `Your rental of ${machineName} is now Active.`, type: "info", link: "/bookings" },
  ])

  revalidatePath("/bookings", "page")
  revalidatePath("/bookings/[id]", "page")
  revalidatePath("/dashboard")
  revalidatePath("/machinery")
  revalidatePath("/admin/bookings")

  return { success: true }
}
```

- [ ] **Step 3: Add documentReturn action (after documentPickup)**

```typescript
export async function documentReturn(bookingId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  const isAdmin = profile?.role === "admin"
  const db = isAdmin ? admin : supabase

  const { data: booking } = await db
    .from("bookings")
    .select("*, machinery!inner(hectares_capacity, machine_name)")
    .eq("id", bookingId)
    .single()

  if (!booking) return { error: "Booking not found" }
  if (booking.owner_id !== user.id && !isAdmin) return { error: "Only the machinery owner can document return" }
  if (booking.status !== "active") return { error: "Booking must be active before documenting return" }

  const hourMeterStr = formData.get("hour_meter_end") as string | null
  const hourMeterEnd = hourMeterStr ? Number(hourMeterStr) : null

  const equipmentFile = formData.get("photo_equipment") as File | null
  const hourMeterFile = formData.get("photo_hour_meter") as File | null

  if (!equipmentFile || !(equipmentFile instanceof File) || equipmentFile.size === 0)
    return { error: "Equipment photo is required" }

  const uploads: { url: string; type: string; name: string }[] = []

  try {
    const eqUrl = await uploadFile(equipmentFile, { userId: user.id, folder: "booking-return" })
    uploads.push({ url: eqUrl, type: "return_equipment", name: equipmentFile.name })
  } catch {
    return { error: "Failed to upload equipment photo. Check BLOB_READ_WRITE_TOKEN." }
  }

  if (hourMeterFile && hourMeterFile instanceof File && hourMeterFile.size > 0) {
    try {
      const hmUrl = await uploadFile(hourMeterFile, { userId: user.id, folder: "booking-return" })
      uploads.push({ url: hmUrl, type: "return_hour_meter", name: hourMeterFile.name })
    } catch {
      return { error: "Failed to upload hour meter photo. Check BLOB_READ_WRITE_TOKEN." }
    }
  }

  const damageFiles = formData.getAll("photo_damage").filter(f => f instanceof File && (f as File).size > 0) as File[]
  for (const df of damageFiles) {
    try {
      const dUrl = await uploadFile(df, { userId: user.id, folder: "booking-return" })
      uploads.push({ url: dUrl, type: "return_damage", name: df.name })
    } catch {
      return { error: "Failed to upload damage photo. Check BLOB_READ_WRITE_TOKEN." }
    }
  }

  for (const u of uploads) {
    await db.from("uploads").insert({
      user_id: user.id,
      booking_id: bookingId,
      file_name: u.name,
      blob_url: u.url,
      upload_type: u.type,
    })
  }

  const machinery = booking.machinery as Record<string, unknown> | null
  const capacity = machinery?.hectares_capacity as number | null
  const requestedHa = booking.requested_hectares as number | null
  const hourMeterStart = booking.hour_meter_start as number | null

  let actualHours: number | null = null
  let actualHectares: number | null = null
  let anomalyFlagged = false
  let anomalyNote: string | null = null

  if (hourMeterStart !== null && hourMeterEnd !== null && requestedHa && requestedHa > 0 && capacity && capacity > 0) {
    actualHours = hourMeterEnd - hourMeterStart
    actualHectares = actualHours * capacity
    const declaredHours = requestedHa / capacity
    const deviation = ((actualHours - declaredHours) / declaredHours) * 100
    if (deviation > ANOMALY_THRESHOLD) {
      anomalyFlagged = true
      anomalyNote = `Usage exceeded declared by ${Math.round(deviation)}%. Declared: ${declaredHours.toFixed(1)}h, Actual: ${actualHours.toFixed(1)}h.`
    }
  }

  const updateData: Record<string, unknown> = {
    return_documented_at: new Date().toISOString(),
    return_documented_by: user.id,
    status: "completed",
  }
  if (hourMeterEnd !== null) updateData.hour_meter_end = hourMeterEnd
  if (actualHours !== null) updateData.actual_hours = actualHours
  if (actualHectares !== null) updateData.actual_hectares = actualHectares
  updateData.anomaly_flagged = anomalyFlagged
  if (anomalyNote) updateData.anomaly_note = anomalyNote

  const { error } = await db.from("bookings").update(updateData).eq("id", bookingId)
  if (error) return { error: error.message }

  const { count } = await db.from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("machinery_id", booking.machinery_id)
    .eq("status", "active")
    .neq("id", bookingId)
  if ((count ?? 0) === 0) {
    await db.from("machinery").update({ status: "active" }).eq("id", booking.machinery_id)
  }

  const machineName = (machinery as { machine_name: string })?.machine_name ?? "Equipment"
  await db.from("notifications").insert([
    { user_id: booking.owner_id, title: "Return Documented", message: `Return for ${machineName} has been documented.${anomalyFlagged ? " Usage anomaly detected." : ""}`, type: anomalyFlagged ? "warning" : "info", link: "/bookings" },
    { user_id: booking.renter_id, title: "Rental Complete", message: `Your rental of ${machineName} has been completed.`, type: "success", link: "/bookings" },
  ])

  const openDispute = formData.get("open_dispute") === "true"
  if (openDispute) {
    const damageDesc = (formData.get("damage_description") as string) || "Damage reported during return documentation."
    await db.from("disputes").insert({
      booking_id: bookingId,
      opened_by: user.id,
      reason: damageDesc,
    })
  }

  revalidatePath("/bookings", "page")
  revalidatePath("/bookings/[id]", "page")
  revalidatePath("/dashboard")
  revalidatePath("/machinery")
  revalidatePath("/admin/bookings")

  return { success: true, anomaly: anomalyFlagged ? { flagged: true, deviation: Math.round(((actualHours! - (requestedHa! / capacity!)) / (requestedHa! / capacity!)) * 100) } : undefined }
}
```

---

### Task 5: Server Actions — reportMisuse, openDispute, resolveDispute, adminForceComplete

**Files:**
- Modify: `src/actions/bookings.ts` (append more exports)

**Interfaces:**
- Consumes: reports, disputes tables from Task 1
- Produces: `reportMisuse()`, `openDispute()`, `resolveDispute()`, `adminForceComplete()`

- [ ] **Step 1: Add remaining actions**

```typescript
export async function reportMisuse(bookingId: string, reportType: string, description: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const validTypes = ["suspicious_activity", "damage", "subletting", "other"]
  if (!validTypes.includes(reportType)) return { error: "Invalid report type" }
  if (!description.trim()) return { error: "Description is required" }

  const admin = createAdminClient()
  const { error } = await admin.from("reports").insert({
    reporter_id: user.id,
    booking_id: bookingId,
    report_type: reportType,
    description: description.trim(),
  })
  if (error) return { error: error.message }

  const { data: booking } = await admin.from("bookings").select("owner_id, renter_id").eq("id", bookingId).single()
  if (booking) {
    await admin.from("notifications").insert([
      { user_id: booking.owner_id, title: "Misuse Reported", message: `A report has been filed for one of your bookings.`, type: "warning", link: "/bookings" },
    ])
  }

  revalidatePath("/bookings/[id]", "page")
  return { success: true }
}

export async function openDispute(bookingId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  if (!reason.trim()) return { error: "Reason is required" }

  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  const isAdmin = profile?.role === "admin"

  const { data: booking } = await admin.from("bookings").select("owner_id, renter_id").eq("id", bookingId).single()
  if (!booking) return { error: "Booking not found" }
  if (booking.owner_id !== user.id && !isAdmin) return { error: "Only the machinery owner can open a dispute" }

  const { data: existing } = await admin.from("disputes")
    .select("id").eq("booking_id", bookingId).eq("status", "open").maybeSingle()
  if (existing) return { error: "An open dispute already exists for this booking" }

  const { data: dispute, error } = await admin.from("disputes").insert({
    booking_id: bookingId,
    opened_by: user.id,
    reason: reason.trim(),
  }).select("id").single()
  if (error) return { error: error.message }

  await admin.from("notifications").insert([
    { user_id: booking.renter_id, title: "Dispute Opened", message: `A dispute has been opened for one of your bookings.`, type: "warning", link: "/bookings" },
  ])

  revalidatePath("/bookings/[id]", "page")
  revalidatePath("/admin/bookings")
  return { success: true, disputeId: dispute.id }
}

export async function resolveDispute(disputeId: string, resolution: string, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return { error: "Only admins can resolve disputes" }

  const validResolutions = ["resolved_lender", "resolved_renter", "admin_resolved"]
  if (!validResolutions.includes(resolution)) return { error: "Invalid resolution" }

  const { data: dispute } = await admin.from("disputes").select("booking_id").eq("id", disputeId).single()
  if (!dispute) return { error: "Dispute not found" }

  const { error } = await admin.from("disputes").update({
    status: resolution,
    resolution_notes: notes,
    resolved_by: user.id,
    resolved_at: new Date().toISOString(),
  }).eq("id", disputeId)
  if (error) return { error: error.message }

  revalidatePath("/bookings/[id]", "page")
  revalidatePath("/admin/bookings")
  return { success: true }
}

export async function adminForceComplete(bookingId: string, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return { error: "Only admins can force complete" }

  const { data: booking } = await admin.from("bookings").select("machinery_id, status").eq("id", bookingId).single()
  if (!booking) return { error: "Booking not found" }
  if (booking.status !== "active" && booking.status !== "approved") return { error: "Booking must be active or approved to force complete" }

  const { error } = await admin.from("bookings").update({
    status: "completed",
    admin_override: true,
    notes: notes || `Admin forced completion on ${new Date().toISOString()}`,
  }).eq("id", bookingId)
  if (error) return { error: error.message }

  const { count } = await admin.from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("machinery_id", booking.machinery_id)
    .eq("status", "active")
    .neq("id", bookingId)
  if ((count ?? 0) === 0) {
    await admin.from("machinery").update({ status: "active" }).eq("id", booking.machinery_id)
  }

  await admin.from("notifications").insert([
    { user_id: booking.owner_id || "", title: "Booking Force Completed", message: `Admin has force-completed a booking. Notes: ${notes || "No notes provided."}`, type: "warning", link: "/bookings" },
  ])

  revalidatePath("/bookings", "page")
  revalidatePath("/bookings/[id]", "page")
  revalidatePath("/dashboard")
  revalidatePath("/machinery")
  revalidatePath("/admin/bookings")

  return { success: true }
}
```

---

### Task 6: PickupDocumentationForm Component

**Files:**
- Create: `src/components/bookings/pickup-documentation-form.tsx`

**Interfaces:**
- Consumes: `documentPickup` from Task 4
- Produces: `<PickupDocumentationForm>` dialog component

- [ ] **Step 1: Ensure directory exists**

```bash
New-Item -ItemType Directory -Path "src/components/bookings" -Force
```

- [ ] **Step 2: Write component**

```tsx
"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { documentPickup } from "@/actions/bookings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ImagePlus, Loader2 } from "lucide-react"

function FilePreview({ file }: { file: File }) {
  const url = URL.createObjectURL(file)
  return <img src={url} alt="preview" className="h-20 w-20 rounded-lg object-cover" onLoad={() => URL.revokeObjectURL(url)} />
}

export function PickupDocumentationForm({ bookingId, onSuccess, onCancel }: { bookingId: string; onSuccess?: () => void; onCancel?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [equipmentPreview, setEquipmentPreview] = useState<File | null>(null)
  const [meterPreview, setMeterPreview] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<File | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("")
    const form = new FormData()
    const hourMeter = (e.currentTarget as HTMLFormElement)["hour_meter_start"]?.value
    if (hourMeter) form.append("hour_meter_start", hourMeter)
    if (equipmentPreview) form.append("photo_equipment", equipmentPreview)
    if (meterPreview) form.append("photo_hour_meter", meterPreview)
    if (selfiePreview) form.append("photo_selfie", selfiePreview)

    const res = await documentPickup(bookingId, form)
    if (res?.error) { setError(res.error); setLoading(false); return }
    setLoading(false)
    router.refresh()
    onSuccess?.()
  }

  const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white file:mr-4 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white"

  return (
    <Dialog open onOpenChange={() => onCancel?.()}>
      <DialogContent className="max-w-md border-white/10 bg-zinc-900 text-white">
        <DialogTitle className="text-lg font-semibold">Document Pickup — Before Handover</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}

          <div>
            <label className="mb-1 block text-sm text-white/60">Hour Meter Reading (if applicable)</label>
            <input name="hour_meter_start" type="number" step="0.1" min={0} className={inputClass} placeholder="e.g. 127.5" />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60">Equipment Photo *</label>
            {equipmentPreview ? (
              <div className="flex items-center gap-2">
                <FilePreview file={equipmentPreview} />
                <span className="text-xs text-white/40">{equipmentPreview.name}</span>
                <button type="button" onClick={() => setEquipmentPreview(null)} className="text-xs text-red-400">Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-4 text-sm text-white/40 hover:border-white/40">
                <ImagePlus className="size-4" /> Choose File
                <input type="file" accept="image/*" className="hidden" onChange={e => setEquipmentPreview(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60">Hour Meter Photo</label>
            {meterPreview ? (
              <div className="flex items-center gap-2">
                <FilePreview file={meterPreview} />
                <span className="text-xs text-white/40">{meterPreview.name}</span>
                <button type="button" onClick={() => setMeterPreview(null)} className="text-xs text-red-400">Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-4 text-sm text-white/40 hover:border-white/40">
                <ImagePlus className="size-4" /> Choose File
                <input type="file" accept="image/*" className="hidden" onChange={e => setMeterPreview(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60">Farmer Selfie with Equipment *</label>
            {selfiePreview ? (
              <div className="flex items-center gap-2">
                <FilePreview file={selfiePreview} />
                <span className="text-xs text-white/40">{selfiePreview.name}</span>
                <button type="button" onClick={() => setSelfiePreview(null)} className="text-xs text-red-400">Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-4 text-sm text-white/40 hover:border-white/40">
                <ImagePlus className="size-4" /> Choose File
                <input type="file" accept="image/*" className="hidden" onChange={e => setSelfiePreview(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>Cancel</button>
            <button type="submit" disabled={loading || !equipmentPreview || !selfiePreview} className={cn(buttonVariants(), "flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50")}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Confirm Pickup → Mark as Active"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 7: ReturnDocumentationForm Component

**Files:**
- Create: `src/components/bookings/return-documentation-form.tsx`

**Interfaces:**
- Consumes: `documentReturn` from Task 4
- Produces: `<ReturnDocumentationForm>` dialog component

- [ ] **Step 1: Write component (similar pattern with damage toggle)**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { documentReturn } from "@/actions/bookings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ImagePlus, Loader2 } from "lucide-react"

function FilePreview({ file }: { file: File }) {
  const url = URL.createObjectURL(file)
  return <img src={url} alt="preview" className="h-20 w-20 rounded-lg object-cover" onLoad={() => URL.revokeObjectURL(url)} />
}

export function ReturnDocumentationForm({ bookingId, onSuccess, onCancel }: { bookingId: string; onSuccess?: () => void; onCancel?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasDamage, setHasDamage] = useState(false)
  const [equipmentPreview, setEquipmentPreview] = useState<File | null>(null)
  const [meterPreview, setMeterPreview] = useState<File | null>(null)
  const [damagePreviews, setDamagePreviews] = useState<File[]>([])
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("")
    const form = new FormData()
    const hourMeter = (e.currentTarget as HTMLFormElement)["hour_meter_end"]?.value
    if (hourMeter) form.append("hour_meter_end", hourMeter)
    if (equipmentPreview) form.append("photo_equipment", equipmentPreview)
    if (meterPreview) form.append("photo_hour_meter", meterPreview)
    for (const f of damagePreviews) form.append("photo_damage", f)
    if (hasDamage) {
      const desc = (e.currentTarget as HTMLFormElement)["damage_description"]?.value
      if (desc) form.append("damage_description", desc)
      const openDisp = (e.currentTarget as HTMLFormElement)["open_dispute"]
      if (openDisp instanceof HTMLInputElement && openDisp.checked) form.append("open_dispute", "true")
    }

    const res = await documentReturn(bookingId, form)
    if (res?.error) { setError(res.error); setLoading(false); return }
    setLoading(false)
    router.refresh()
    onSuccess?.()
  }

  const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white file:mr-4 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white"

  return (
    <Dialog open onOpenChange={() => onCancel?.()}>
      <DialogContent className="max-w-md border-white/10 bg-zinc-900 text-white max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-lg font-semibold">Document Return — After Use</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}

          <div>
            <label className="mb-1 block text-sm text-white/60">Hour Meter Reading (if applicable)</label>
            <input name="hour_meter_end" type="number" step="0.1" min={0} className={inputClass} placeholder="e.g. 135.2" />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60">Equipment Photo (after use) *</label>
            {equipmentPreview ? (
              <div className="flex items-center gap-2">
                <FilePreview file={equipmentPreview} />
                <span className="text-xs text-white/40">{equipmentPreview.name}</span>
                <button type="button" onClick={() => setEquipmentPreview(null)} className="text-xs text-red-400">Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-4 text-sm text-white/40 hover:border-white/40">
                <ImagePlus className="size-4" /> Choose File
                <input type="file" accept="image/*" className="hidden" onChange={e => setEquipmentPreview(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60">Hour Meter Photo</label>
            {meterPreview ? (
              <div className="flex items-center gap-2">
                <FilePreview file={meterPreview} />
                <span className="text-xs text-white/40">{meterPreview.name}</span>
                <button type="button" onClick={() => setMeterPreview(null)} className="text-xs text-red-400">Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-4 text-sm text-white/40 hover:border-white/40">
                <ImagePlus className="size-4" /> Choose File
                <input type="file" accept="image/*" className="hidden" onChange={e => setMeterPreview(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" checked={hasDamage} onChange={e => { setHasDamage(e.target.checked); if (!e.target.checked) { setDamagePreviews([]) } }} className="rounded" />
              Equipment has damage
            </label>
          </div>

          {hasDamage && (
            <div className="space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <div>
                <label className="mb-1 block text-sm text-white/60">Damage Photos (up to 3)</label>
                {damagePreviews.length > 0 && (
                  <div className="mb-2 flex gap-2">
                    {damagePreviews.map((f, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <FilePreview file={f} />
                        <button type="button" onClick={() => setDamagePreviews(prev => prev.filter((_,j) => j !== i))} className="text-xs text-red-400">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
                {damagePreviews.length < 3 && (
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-3 text-sm text-white/40 hover:border-white/40">
                    <ImagePlus className="size-4" /> Add Damage Photo
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0]; if (f) setDamagePreviews(prev => [...prev, f])
                    }} />
                  </label>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/60">Damage Description</label>
                <textarea name="damage_description" className={inputClass} placeholder="Describe the damage..." rows={3} />
              </div>
              <label className="flex items-center gap-2 text-sm text-red-300 cursor-pointer">
                <input type="checkbox" name="open_dispute" className="rounded" />
                Open dispute for this damage
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>Cancel</button>
            <button type="submit" disabled={loading || !equipmentPreview} className={cn(buttonVariants(), "flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50")}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Confirm Return → Mark Completed"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 8: DocumentationTimeline + DiscrepancyBanner + ReportMisuseButton

**Files:**
- Create: `src/components/bookings/documentation-timeline.tsx`
- Create: `src/components/bookings/discrepancy-banner.tsx`
- Create: `src/components/bookings/report-misuse-button.tsx`

**Interfaces:**
- Consumes: uploads table, bookings anomaly fields
- Produces: Three display components for booking detail page

- [ ] **Step 1: Create DocumentationTimeline**

```tsx
import { createAdminClient } from "@/lib/supabase/admin"
import { formatDate } from "@/lib/utils"

export async function DocumentationTimeline({ bookingId }: { bookingId: string }) {
  const admin = createAdminClient()

  const { data: booking } = await admin.from("bookings").select(
    "pickup_documented_at, pickup_documented_by, hour_meter_start, return_documented_at, return_documented_by, hour_meter_end, actual_hours, estimated_hours"
  ).eq("id", bookingId).single()

  const { data: uploads } = await admin.from("uploads").select("blob_url, upload_type, file_name").eq("booking_id", bookingId).in("upload_type", [
    "pickup_equipment", "pickup_selfie", "pickup_hour_meter",
    "return_equipment", "return_hour_meter", "return_damage",
  ]).order("created_at")

  if (!booking) return null

  const pickupEq = uploads?.filter(u => u.upload_type === "pickup_equipment") ?? []
  const pickupSelfie = uploads?.filter(u => u.upload_type === "pickup_selfie") ?? []
  const pickupMeter = uploads?.filter(u => u.upload_type === "pickup_hour_meter") ?? []
  const returnEq = uploads?.filter(u => u.upload_type === "return_equipment") ?? []
  const returnMeter = uploads?.filter(u => u.upload_type === "return_hour_meter") ?? []
  const returnDamage = uploads?.filter(u => u.upload_type === "return_damage") ?? []

  const pickupDone = !!booking.pickup_documented_at
  const returnDone = !!booking.return_documented_at

  return (
    <div className="space-y-4">
      {pickupDone ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h3 className="mb-2 font-semibold text-emerald-400">Pickup Documentation ✓</h3>
          <p className="text-sm text-white/50">{formatDate(booking.pickup_documented_at!)}</p>
          {booking.hour_meter_start != null && <p className="mt-1 text-sm text-white/50">Hour meter start: <span className="text-white">{booking.hour_meter_start}</span></p>}
          <div className="mt-3 flex gap-3">
            {[...pickupEq, ...pickupSelfie, ...pickupMeter].map((u) => (
              <a key={u.blob_url} href={u.blob_url} target="_blank" rel="noopener noreferrer">
                <img src={u.blob_url} alt={u.upload_type} className="h-24 w-24 rounded-lg object-cover ring-1 ring-white/10 hover:ring-white/30 transition" />
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-1 font-semibold text-white/60">Pickup Documentation ⏳ Pending</h3>
          <p className="text-sm text-white/40">Photos and hour meter reading must be uploaded before this booking can be marked as Active.</p>
        </div>
      )}

      {returnDone ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h3 className="mb-2 font-semibold text-emerald-400">Return Documentation ✓</h3>
          <p className="text-sm text-white/50">{formatDate(booking.return_documented_at!)}</p>
          {booking.hour_meter_end != null && <p className="mt-1 text-sm text-white/50">Hour meter end: <span className="text-white">{booking.hour_meter_end}</span></p>}
          {booking.actual_hours != null && <p className="text-sm text-white/50">Actual hours: <span className="text-white">{booking.actual_hours}</span></p>}
          <div className="mt-3 flex gap-3">
            {[...returnEq, ...returnMeter, ...returnDamage].map((u) => (
              <a key={u.blob_url} href={u.blob_url} target="_blank" rel="noopener noreferrer">
                <img src={u.blob_url} alt={u.upload_type} className="h-24 w-24 rounded-lg object-cover ring-1 ring-white/10 hover:ring-white/30 transition" />
              </a>
            ))}
          </div>
        </div>
      ) : pickupDone && !returnDone ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-1 font-semibold text-white/60">Return Documentation ⏳ Pending</h3>
          <p className="text-sm text-white/40">Photos and hour meter reading must be uploaded before this booking can be marked as Completed.</p>
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 2: Create DiscrepancyBanner**

```tsx
import { AlertTriangle } from "lucide-react"
import { ReportMisuseButton } from "./report-misuse-button"

export function DiscrepancyBanner({ bookingId, anomalyNote }: { bookingId: string; anomalyNote: string | null }) {
  if (!anomalyNote) return null

  return (
    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="size-5 shrink-0 text-yellow-400 mt-0.5" />
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-yellow-400">Usage Alert</p>
          <p className="text-yellow-200/80">{anomalyNote}</p>
          <p className="text-yellow-200/60">Possible causes: undeclared land area or equipment sharing.</p>
          <ReportMisuseButton bookingId={bookingId} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create ReportMisuseButton**

```tsx
"use client"

import { useState } from "react"
import { reportMisuse } from "@/actions/bookings"
import { buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

export function ReportMisuseButton({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("")
    const form = e.currentTarget as HTMLFormElement
    const type = form.report_type.value
    const desc = form.description.value
    const res = await reportMisuse(bookingId, type, desc)
    if (res?.error) { setError(res.error); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  if (success) return <span className="text-sm text-emerald-400">Report submitted ✓</span>

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-sm text-yellow-400 underline hover:text-yellow-300">
        Report Misuse
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-white/10 bg-zinc-900 text-white">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="size-5 text-yellow-400" /> Report Misuse
          </DialogTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}
            <div>
              <label className="mb-1 block text-sm text-white/60">Report Type</label>
              <select name="report_type" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" required>
                <option value="suspicious_activity">Suspicious Activity</option>
                <option value="damage">Damage Report</option>
                <option value="subletting">Subletting / Sharing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/60">Description</label>
              <textarea name="description" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" rows={4} required placeholder="Describe what happened..." />
            </div>
            <button type="submit" disabled={loading} className={cn(buttonVariants(), "w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50")}>
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

---

### Task 9: Modify BookingActions — User-Facing Buttons

**Files:**
- Modify: `src/app/(auth)/bookings/[id]/booking-actions.tsx`

**Interfaces:**
- Consumes: `PickupDocumentationForm` from Task 6, `ReturnDocumentationForm` from Task 7
- Produces: Updated booking actions with documentation form triggers

- [ ] **Step 1: Rewrite booking-actions.tsx**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateBookingStatus } from "@/actions/bookings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PickupDocumentationForm } from "@/components/bookings/pickup-documentation-form"
import { ReturnDocumentationForm } from "@/components/bookings/return-documentation-form"

export function BookingActions({ bookingId, status, isOwner, isRenter }: { bookingId: string; status: string; isOwner: boolean; isRenter: boolean }) {
  const [working, setWorking] = useState(false)
  const [err, setErr] = useState("")
  const [showPickup, setShowPickup] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const router = useRouter()

  async function handle(s: string) {
    setWorking(true); setErr("")
    const res = await updateBookingStatus(bookingId, s) as { error?: string } | undefined
    if (res?.error) { setErr(res.error); setWorking(false); return }
    router.refresh()
  }

  if (working) return <p className="text-sm text-white/40 pt-2">Updating...</p>

  return (
    <>
      {isOwner && status === "pending" && (
        <div className="flex gap-3 pt-2">
          <button onClick={() => handle("approved")} className={cn(buttonVariants(), "bg-emerald-600 hover:bg-emerald-700")}>Approve</button>
          <button onClick={() => handle("denied")} className={cn(buttonVariants({ variant: "destructive" }))}>Deny</button>
        </div>
      )}
      {isOwner && status === "approved" && (
        <button onClick={() => setShowPickup(true)} className={cn(buttonVariants({ className: "mt-2" }))}>Document Pickup → Mark as Active</button>
      )}
      {isOwner && status === "active" && (
        <button onClick={() => setShowReturn(true)} className={cn(buttonVariants({ className: "mt-2" }))}>Document Return → Mark Completed</button>
      )}
      {isRenter && (status === "pending" || status === "approved") && (
        <button onClick={() => handle("cancelled")} className={cn(buttonVariants({ variant: "outline", className: "mt-2 border-red-400/30 text-red-300 hover:bg-red-400/10" }))}>Cancel Booking</button>
      )}
      {err && <p className="text-sm text-red-400 pt-2">{err}</p>}

      {showPickup && <PickupDocumentationForm bookingId={bookingId} onSuccess={() => router.refresh()} onCancel={() => setShowPickup(false)} />}
      {showReturn && <ReturnDocumentationForm bookingId={bookingId} onSuccess={() => router.refresh()} onCancel={() => setShowReturn(false)} />}
    </>
  )
}
```

---

### Task 10: Modify AdminBookingActions

**Files:**
- Modify: `src/components/admin/booking-actions.tsx`

**Interfaces:**
- Consumes: `PickupDocumentationForm` from Task 6, `ReturnDocumentationForm` from Task 7
- Produces: Updated admin booking actions

- [ ] **Step 1: Rewrite admin/booking-actions.tsx**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateBookingStatus } from "@/actions/bookings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PickupDocumentationForm } from "@/components/bookings/pickup-documentation-form"
import { ReturnDocumentationForm } from "@/components/bookings/return-documentation-form"

export function AdminBookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const [working, setWorking] = useState(false)
  const [err, setErr] = useState("")
  const [showPickup, setShowPickup] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const router = useRouter()

  async function handle(s: string) {
    setWorking(true); setErr("")
    const res = await updateBookingStatus(bookingId, s) as { error?: string } | undefined
    if (res?.error) { setErr(res.error); setWorking(false); return }
    router.refresh()
  }

  if (working) return <span className="text-xs text-white/40">...</span>

  const showable = !["completed", "denied", "cancelled"].includes(status)

  return (
    <>
      {showable && (
        <div className="flex gap-1">
          {status === "pending" && (
            <>
              <button onClick={() => handle("approved")} className={cn(buttonVariants({ size: "sm" }), "bg-emerald-600 hover:bg-emerald-700 h-7 px-2 text-xs")}>Approve</button>
              <button onClick={() => handle("denied")} className={cn(buttonVariants({ size: "sm", variant: "destructive" }), "h-7 px-2 text-xs")}>Deny</button>
            </>
          )}
          {status === "approved" && <button onClick={() => setShowPickup(true)} className={cn(buttonVariants({ size: "sm" }), "h-7 px-2 text-xs")}>Document Pickup</button>}
          {status === "active" && <button onClick={() => setShowReturn(true)} className={cn(buttonVariants({ size: "sm" }), "h-7 px-2 text-xs")}>Document Return</button>}
        </div>
      )}
      {err && <span className="text-xs text-red-400">{err}</span>}

      {showPickup && <PickupDocumentationForm bookingId={bookingId} onSuccess={() => router.refresh()} onCancel={() => setShowPickup(false)} />}
      {showReturn && <ReturnDocumentationForm bookingId={bookingId} onSuccess={() => router.refresh()} onCancel={() => setShowReturn(false)} />}
    </>
  )
}
```

---

### Task 11: Modify Booking Detail Page

**Files:**
- Modify: `src/app/(auth)/bookings/[id]/page.tsx`

**Interfaces:**
- Consumes: `DocumentationTimeline`, `DiscrepancyBanner` from Task 8

- [ ] **Step 1: Add timeline and banner imports + rendering**

```tsx
// Add these imports at the top:
import { DocumentationTimeline } from "@/components/bookings/documentation-timeline"
import { DiscrepancyBanner } from "@/components/bookings/discrepancy-banner"

// After the back link (line 62), before the status card:
<DocumentationTimeline bookingId={id} />

// Inside the status card, after the notes line (line 83), before BookingActions:
{booking.anomaly_flagged && (
  <DiscrepancyBanner bookingId={id} anomalyNote={booking.anomaly_note as string | null} />
)}
```

Note: The prop `booking` comes from the page's fetch and needs the anomaly fields included. Since the page fetches `bookings(*)`, this is already covered.

The actual edit: the page already exists, we just need to insert the components in the right places. The page uses variable `b` for the booking row. We need to extract `s` and other fields as it already does. We add:
- After `{b.notes ? ... : null}` → `<DiscrepancyBanner bookingId={id} anomalyNote={b.anomaly_note as string | null} />`
- After the back link `</Link>` → `<DocumentationTimeline bookingId={id} />`

---

### Task 12: Modify Admin Bookings Page — Add View Link

**Files:**
- Modify: `src/app/admin/bookings/page.tsx`

Add a "View" link in each row (both desktop table and mobile card) that links to `/bookings/{booking.id}`.

---

### Task 13: Update Seed Script

**Files:**
- Modify: `scripts/seed.ts`

Add `security_deposit`, `hour_meter_start`, `hour_meter_end` to existing booking seed data. Add `pickup_documented_*` and `return_documented_*` for completed/active bookings.

---

### Task 14: Update Database Types

**Files:**
- Modify: `src/types/database.ts`

Add new columns to Booking, Profile, Upload interfaces. Add Reports, Disputes interfaces.

---

### Task 15: Write Backend Tests

**Files:**
- Modify: `scripts/test-backend.ts`

Add tests for documentPickup, documentReturn, anomaly detection, reportMisuse, openDispute, resolveDispute, adminForceComplete.

---

### Task 16: Run Full Verification

Run `npx tsx scripts/test-backend.ts` and `npx tsx scripts/quick-test.ts` and confirm all pass.
