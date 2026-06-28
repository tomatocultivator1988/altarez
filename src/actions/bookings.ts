"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { bookingSchema } from "@/lib/validators/booking"
import { uploadFile } from "@/lib/blob/client"
import { ANOMALY_THRESHOLD } from "@/lib/constants"

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "denied", "cancelled"],
  approved: ["active", "cancelled"],
  active: ["completed"],
  completed: [],
  denied: [],
  cancelled: [],
}

export async function createBooking(machinery_id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const starting_date = formData.get("starting_date") as string
  const ending_date = formData.get("ending_date") as string
  const requested_hectares = formData.get("requested_hectares") ? Number(formData.get("requested_hectares")) : undefined
  const estimated_hours = formData.get("estimated_hours") ? Number(formData.get("estimated_hours")) : undefined
  const notes = formData.get("notes") as string || undefined

  const parsed = bookingSchema.safeParse({
    machinery_id,
    starting_date,
    ending_date,
    requested_hectares: requested_hectares ?? undefined,
    estimated_hours: estimated_hours ?? undefined,
    notes,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  if (estimated_hours != null && estimated_hours < 0) return { error: "Estimated hours must be positive" }
  if (requested_hectares != null && requested_hectares < 0) return { error: "Requested hectares must be positive" }

  const { data: available } = await supabase.rpc("check_machinery_availability", {
    p_machinery_id: machinery_id,
    p_start_date: starting_date,
    p_end_date: ending_date,
  })

  if (!available) return { error: "Machinery is already booked for these dates" }

  const { data: machinery } = await supabase
    .from("machinery")
    .select("owner_id, rate_per_hectare, hectares_capacity, machine_name")
    .eq("id", machinery_id)
    .single()

  if (!machinery) return { error: "Machinery not found" }

  if (machinery.owner_id === user.id) return { error: "You cannot book your own machinery" }

  const rate = machinery.rate_per_hectare as number | null
  const capacity = machinery.hectares_capacity as number | null
  const hasRate = rate != null && rate > 0
  const hectares = requested_hectares ?? null
  const hours = hasRate && hectares != null && capacity != null && capacity > 0
    ? Math.round((hectares / capacity) * 100) / 100
    : null
  const manualTotal = formData.get("total_amount") as string | null
  const total = hasRate && hectares != null
    ? Math.round(rate * hectares * 100) / 100
    : manualTotal ? Number(manualTotal) : null

  const { error } = await supabase.from("bookings").insert({
    machinery_id,
    renter_id: user.id,
    owner_id: machinery.owner_id,
    starting_date,
    ending_date,
    requested_hectares: hectares,
    estimated_hours: hours,
    total_amount: total,
    notes,
    status: "pending",
  })

  if (error) return { error: error.message }

  await supabase.from("notifications").insert({
    user_id: machinery.owner_id,
    title: "New Booking Request",
    message: `${user.email} requested your ${machinery.machine_name} (${starting_date} → ${ending_date}).`,
    type: "info",
    link: "/bookings",
  })

  revalidatePath("/bookings", "page")
  revalidatePath("/dashboard")
  revalidatePath("/machinery")
  revalidatePath("/admin/bookings")
  redirect("/bookings")
}

export async function updateBookingStatus(bookingId: string, status: string) {
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

  const allowed = VALID_TRANSITIONS[booking.status] || []
  if (!allowed.includes(status)) {
    return { error: `Cannot change from "${booking.status}" to "${status}"` }
  }

  const isOwner = booking.owner_id === user.id
  const isRenter = booking.renter_id === user.id

  if (!isAdmin) {
    if ((status === "approved" || status === "denied" || status === "active") && !isOwner) {
      return { error: "Only the machinery owner can perform this action" }
    }
    if (status === "completed" && !isOwner) {
      return { error: "Only the owner can complete a booking. Use Return Documentation." }
    }
    if (status === "cancelled" && !isRenter) {
      return { error: "Only the renter can cancel a booking" }
    }
  }

  if (status === "active") {
    await db.from("machinery").update({ status: "in_use" }).eq("id", booking.machinery_id)
  } else if (["completed", "denied", "cancelled"].includes(status)) {
    const { count } = await db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("machinery_id", booking.machinery_id)
      .eq("status", "active")
      .neq("id", bookingId)
    if ((count ?? 0) === 0) {
      await db.from("machinery").update({ status: "active" }).eq("id", booking.machinery_id)
    }
  }

  const { error, count: affectedRows } = await db.from("bookings").update({ status })
    .eq("id", bookingId).eq("status", booking.status)
  if (error) return { error: error.message }
  if (affectedRows === 0) return { error: "Booking status has changed. Please refresh." }

  const statusLabels: Record<string, string> = {
    approved: "approved", denied: "denied", active: "marked as active",
    completed: "completed", cancelled: "cancelled",
  }
  const label = statusLabels[status] || status
  const machineName = (booking.machinery as { machine_name: string }).machine_name
  const prefix = isAdmin ? "Admin " : ""

  await db.from("notifications").insert([
    { user_id: booking.owner_id, title: `Booking ${label}`, message: `${prefix}Booking for ${machineName} has been ${label}.`, type: status === "denied" ? "error" : "info", link: "/bookings" },
    { user_id: booking.renter_id, title: `Booking ${label}`, message: `${prefix}Your booking for ${machineName} has been ${label}.`, type: status === "denied" ? "error" : status === "completed" ? "success" : "info", link: "/bookings" },
  ])

  revalidatePath("/bookings", "page")
  revalidatePath(`/bookings/${bookingId}`, "page")
  revalidatePath("/bookings/[id]", "page")
  revalidatePath("/dashboard")
  revalidatePath("/machinery")
  revalidatePath("/admin/bookings")
}

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
  if (hourMeterStart !== null && !Number.isFinite(hourMeterStart))
    return { error: "Invalid hour meter reading" }

  const equipmentFile = formData.get("photo_equipment") as File | null
  const hourMeterFile = formData.get("photo_hour_meter") as File | null
  const selfieFile = formData.get("photo_selfie") as File | null

  if (!equipmentFile || !(equipmentFile instanceof File) || equipmentFile.size === 0)
    return { error: "Equipment photo is required" }
  if (!selfieFile || !(selfieFile instanceof File) || selfieFile.size === 0)
    return { error: "Farmer selfie is required" }

  const uploadRows: { url: string; type: string; name: string }[] = []

  try {
    const eqUrl = await uploadFile(equipmentFile, { userId: user.id, folder: "booking-pickup", access: "public" })
    uploadRows.push({ url: eqUrl, type: "pickup_equipment", name: equipmentFile.name })
  } catch (e: any) {
    return { error: e?.message || "Failed to upload equipment photo" }
  }

  if (hourMeterFile && hourMeterFile instanceof File && hourMeterFile.size > 0) {
    try {
      const hmUrl = await uploadFile(hourMeterFile, { userId: user.id, folder: "booking-pickup", access: "public" })
      uploadRows.push({ url: hmUrl, type: "pickup_hour_meter", name: hourMeterFile.name })
    } catch (e: any) {
      return { error: e?.message || "Failed to upload hour meter photo" }
    }
  }

  try {
    const sfUrl = await uploadFile(selfieFile, { userId: user.id, folder: "booking-pickup", access: "public" })
    uploadRows.push({ url: sfUrl, type: "pickup_selfie", name: selfieFile.name })
  } catch (e: any) {
    return { error: e?.message || "Failed to upload selfie" }
  }

  for (const u of uploadRows) {
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

  const { error, count: affectedRows } = await db.from("bookings").update(updateData)
    .eq("id", bookingId).eq("status", "approved")
  if (error) return { error: error.message }
  if (affectedRows === 0) return { error: "Booking status has changed. Please refresh." }

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
  if (hourMeterEnd !== null && !Number.isFinite(hourMeterEnd))
    return { error: "Invalid hour meter reading" }

  const equipmentFile = formData.get("photo_equipment") as File | null
  const hourMeterFile = formData.get("photo_hour_meter") as File | null

  if (!equipmentFile || !(equipmentFile instanceof File) || equipmentFile.size === 0)
    return { error: "Equipment photo is required" }

  const uploadRows: { url: string; type: string; name: string }[] = []

  try {
    const eqUrl = await uploadFile(equipmentFile, { userId: user.id, folder: "booking-return", access: "public" })
    uploadRows.push({ url: eqUrl, type: "return_equipment", name: equipmentFile.name })
  } catch (e: any) {
    return { error: e?.message || "Failed to upload equipment photo" }
  }

  if (hourMeterFile && hourMeterFile instanceof File && hourMeterFile.size > 0) {
    try {
      const hmUrl = await uploadFile(hourMeterFile, { userId: user.id, folder: "booking-return", access: "public" })
      uploadRows.push({ url: hmUrl, type: "return_hour_meter", name: hourMeterFile.name })
    } catch (e: any) {
      return { error: e?.message || "Failed to upload hour meter photo" }
    }
  }

  const damageFiles = formData.getAll("photo_damage").filter(
    (f): f is File => f instanceof File && f.size > 0
  )
  for (const df of damageFiles) {
    try {
      const dUrl = await uploadFile(df, { userId: user.id, folder: "booking-return", access: "public" })
      uploadRows.push({ url: dUrl, type: "return_damage", name: df.name })
    } catch (e: any) {
      return { error: e?.message || "Failed to upload damage photo" }
    }
  }

  for (const u of uploadRows) {
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
  let deviationPercent = 0

  if (hourMeterStart !== null && hourMeterEnd !== null && requestedHa && requestedHa > 0 && capacity && capacity > 0) {
    if (hourMeterEnd < hourMeterStart) return { error: "End reading cannot be less than start reading" }
    actualHours = hourMeterEnd - hourMeterStart
    actualHectares = actualHours * capacity
    const declaredHours = requestedHa / capacity
    deviationPercent = ((actualHours - declaredHours) / declaredHours) * 100
    if (deviationPercent > ANOMALY_THRESHOLD) {
      anomalyFlagged = true
      anomalyNote = `Usage exceeded declared by ${Math.round(deviationPercent)}%. Declared: ${declaredHours.toFixed(1)}h, Actual: ${actualHours.toFixed(1)}h.`
    }
  }

  const updateData: Record<string, unknown> = {
    return_documented_at: new Date().toISOString(),
    return_documented_by: user.id,
    status: "completed",
    anomaly_flagged: anomalyFlagged,
  }
  if (hourMeterEnd !== null) updateData.hour_meter_end = hourMeterEnd
  if (actualHours !== null) updateData.actual_hours = actualHours
  if (actualHectares !== null) updateData.actual_hectares = actualHectares
  if (anomalyNote) updateData.anomaly_note = anomalyNote

  const { error, count: affectedRows } = await db.from("bookings").update(updateData)
    .eq("id", bookingId).eq("status", booking.status)
  if (error) return { error: error.message }
  if (affectedRows === 0) return { error: "Booking status has changed. Please refresh." }

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

  return {
    success: true,
    anomaly: anomalyFlagged ? { flagged: true, deviation: Math.round(deviationPercent) } : undefined,
  }
}

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

  const { data: booking } = await admin.from("bookings").select("owner_id").eq("id", bookingId).single()
  if (booking) {
    await admin.from("notifications").insert({
      user_id: booking.owner_id, title: "Misuse Reported", message: `A report has been filed for one of your bookings.`, type: "warning", link: "/bookings",
    })
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
    booking_id: bookingId, opened_by: user.id, reason: reason.trim(),
  }).select("id").single()
  if (error) return { error: error.message }

  await admin.from("notifications").insert({
    user_id: booking.renter_id, title: "Dispute Opened", message: `A dispute has been opened for one of your bookings.`, type: "warning", link: "/bookings",
  })

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
    status: resolution, resolution_notes: notes, resolved_by: user.id, resolved_at: new Date().toISOString(),
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

  const { data: booking } = await admin.from("bookings").select("machinery_id, status, owner_id, renter_id").eq("id", bookingId).single()
  if (!booking) return { error: "Booking not found" }
  if (booking.status !== "active" && booking.status !== "approved") return { error: "Booking must be active or approved to force complete" }

  const { error, count: affectedRows } = await admin.from("bookings").update({
    status: "completed", admin_override: true, notes: notes || `Admin forced completion on ${new Date().toISOString()}`,
  }).eq("id", bookingId).eq("status", booking.status)
  if (error) return { error: error.message }
  if (affectedRows === 0) return { error: "Booking status has changed. Please refresh." }

  const { count } = await admin.from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("machinery_id", booking.machinery_id).eq("status", "active").neq("id", bookingId)
  if ((count ?? 0) === 0) {
    await admin.from("machinery").update({ status: "active" }).eq("id", booking.machinery_id)
  }

  await admin.from("notifications").insert([
    { user_id: booking.owner_id, title: "Booking Force Completed", message: `Admin has force-completed a booking.`, type: "warning", link: "/bookings" },
    { user_id: booking.renter_id, title: "Booking Force Completed", message: `Admin has force-completed your booking.`, type: "warning", link: "/bookings" },
  ])

  revalidatePath("/bookings", "page")
  revalidatePath("/bookings/[id]", "page")
  revalidatePath("/dashboard")
  revalidatePath("/machinery")
  revalidatePath("/admin/bookings")

  return { success: true }
}
