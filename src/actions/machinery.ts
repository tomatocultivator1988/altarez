"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createMachinery(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const machine_name = formData.get("machine_name") as string
  const machine_type = formData.get("machine_type") as string
  const description = formData.get("description") as string || null
  const serial_number = formData.get("serial_number") as string || null
  const hectares_capacity = formData.get("hectares_capacity") ? Number(formData.get("hectares_capacity")) : null
  const rate_per_hour = formData.get("rate_per_hour") ? Number(formData.get("rate_per_hour")) : null
  const barangay = formData.get("barangay") as string || null
  const image_url = formData.get("image_url") as string || null

  const { error } = await supabase.from("machinery").insert({
    owner_id: user.id,
    machine_name,
    machine_type,
    description,
    serial_number,
    hectares_capacity,
    rate_per_hour,
    barangay,
    image_url,
    status: "active",
  })

  if (error) return { error: error.message }

  revalidatePath("/machinery")
  revalidatePath("/dashboard")
  redirect("/machinery/manage")
}

export async function updateMachinery(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const machine_name = formData.get("machine_name") as string
  const machine_type = formData.get("machine_type") as string
  const description = formData.get("description") as string || null
  const serial_number = formData.get("serial_number") as string || null
  const hectares_capacity = formData.get("hectares_capacity") ? Number(formData.get("hectares_capacity")) : null
  const rate_per_hour = formData.get("rate_per_hour") ? Number(formData.get("rate_per_hour")) : null
  const barangay = formData.get("barangay") as string || null
  const image_url = formData.get("image_url") as string || null
  const status = formData.get("status") as string

  const { error } = await supabase
    .from("machinery")
    .update({ machine_name, machine_type, description, serial_number, hectares_capacity, rate_per_hour, barangay, image_url, status })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/machinery")
  redirect("/machinery/manage")
}

export async function deleteMachinery(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("machinery")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/machinery")
  redirect("/machinery/manage")
}
