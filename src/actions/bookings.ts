"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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
  const requested_hectares = formData.get("requested_hectares") ? Number(formData.get("requested_hectares")) : null
  const estimated_hours = formData.get("estimated_hours") ? Number(formData.get("estimated_hours")) : null
  const notes = formData.get("notes") as string || null

  const { data: available } = await supabase.rpc("check_machinery_availability", {
    p_machinery_id: machinery_id,
    p_start_date: starting_date,
    p_end_date: ending_date,
  })

  if (!available) return { error: "Machinery is already booked for these dates" }

  const { data: machinery } = await supabase
    .from("machinery")
    .select("owner_id, rate_per_hour, machine_name")
    .eq("id", machinery_id)
    .single()

  if (!machinery) return { error: "Machinery not found" }

  const total_amount = (machinery.rate_per_hour ?? 0) * (estimated_hours ?? 0)

  const { error } = await supabase.from("bookings").insert({
    machinery_id,
    renter_id: user.id,
    owner_id: machinery.owner_id,
    starting_date,
    ending_date,
    requested_hectares,
    estimated_hours,
    total_amount,
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

  revalidatePath("/bookings")
  revalidatePath("/dashboard")
  redirect("/bookings")
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const isAdmin = profile?.role === "admin"

  const { data: booking } = await supabase
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
    if (status === "cancelled" && !isRenter) {
      return { error: "Only the renter can cancel a booking" }
    }
  }

  if (status === "active") {
    await supabase.from("machinery").update({ status: "in_use" }).eq("id", booking.machinery_id)
  } else if (["completed", "denied", "cancelled"].includes(status)) {
    await supabase.from("machinery").update({ status: "active" }).eq("id", booking.machinery_id)
  }

  const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId)
  if (error) return { error: error.message }

  const statusLabels: Record<string, string> = {
    approved: "approved", denied: "denied", active: "marked as active",
    completed: "completed", cancelled: "cancelled",
  }
  const label = statusLabels[status] || status
  const machineName = (booking.machinery as { machine_name: string }).machine_name
  const prefix = isAdmin ? "Admin " : ""

  await supabase.from("notifications").insert([
    { user_id: booking.owner_id, title: `Booking ${label}`, message: `${prefix}Booking for ${machineName} has been ${label}.`, type: status === "denied" ? "error" : "info", link: "/bookings" },
    { user_id: booking.renter_id, title: `Booking ${label}`, message: `${prefix}Your booking for ${machineName} has been ${label}.`, type: status === "denied" ? "error" : status === "completed" ? "success" : "info", link: "/bookings" },
  ])

  revalidatePath("/bookings")
  revalidatePath("/dashboard")
  revalidatePath("/machinery")
  revalidatePath("/admin/bookings")
}

export async function cancelBooking(bookingId: string) {
  return updateBookingStatus(bookingId, "cancelled")
}
