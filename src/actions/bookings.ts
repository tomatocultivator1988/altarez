"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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
    .select("owner_id, rate_per_hour")
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

  revalidatePath("/bookings")
  revalidatePath("/dashboard")
  redirect("/bookings")
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const supabase = await createClient()

  const updates: Record<string, unknown> = { status }
  if (status === "active") {
    const { data: booking } = await supabase.from("bookings").select("machinery_id").eq("id", bookingId).single()
    if (booking) {
      await supabase.from("machinery").update({ status: "in_use" }).eq("id", booking.machinery_id)
    }
  }

  const { error } = await supabase.from("bookings").update(updates).eq("id", bookingId)
  if (error) return { error: error.message }

  revalidatePath("/bookings")
  revalidatePath("/dashboard")
}
