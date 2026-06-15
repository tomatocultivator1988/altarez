"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { uploadFile } from "@/lib/blob/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { machinerySchema } from "@/lib/validators/machinery"

export async function createMachinery(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const machine_name = formData.get("machine_name") as string
  const machine_type = formData.get("machine_type") as string
  const description = formData.get("description") as string || undefined
  const serial_number = formData.get("serial_number") as string || undefined
  const hectares_capacity = formData.get("hectares_capacity") ? Number(formData.get("hectares_capacity")) : undefined
  const rate_per_hour = formData.get("rate_per_hour") ? Number(formData.get("rate_per_hour")) : undefined
  const barangay = formData.get("barangay") as string || undefined

  const parsed = machinerySchema.safeParse({
    machine_name,
    machine_type,
    description,
    serial_number,
    hectares_capacity,
    rate_per_hour,
    barangay,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const imageFile = formData.get("image")
  let image_url: string | null = null
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      image_url = await uploadFile(imageFile, { userId: user.id, folder: "machinery" })
    } catch {
      return { error: "Failed to upload image. Check that BLOB_READ_WRITE_TOKEN is set." }
    }
  }

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
  revalidatePath("/machinery/manage")
  revalidatePath("/dashboard")
  redirect("/machinery/manage")
}

export async function updateMachinery(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { data: existing } = await supabase
    .from("machinery")
    .select("owner_id")
    .eq("id", id)
    .single()
  if (!existing) return { error: "Machinery not found" }
  if (existing.owner_id !== user.id) {
    const admin = createAdminClient()
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "admin") return { error: "You do not own this machinery" }
  }

  const machine_name = formData.get("machine_name") as string
  const machine_type = formData.get("machine_type") as string
  const description = formData.get("description") as string || undefined
  const serial_number = formData.get("serial_number") as string || undefined
  const hectares_capacity = formData.get("hectares_capacity") ? Number(formData.get("hectares_capacity")) : undefined
  const rate_per_hour = formData.get("rate_per_hour") ? Number(formData.get("rate_per_hour")) : undefined
  const barangay = formData.get("barangay") as string || undefined
  const status = formData.get("status") as string || undefined

  const parsed = machinerySchema.safeParse({
    machine_name,
    machine_type,
    description,
    serial_number,
    hectares_capacity,
    rate_per_hour,
    barangay,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const imageFile = formData.get("image")
  let image_url = formData.get("existing_image_url") as string || null
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      image_url = await uploadFile(imageFile, { userId: user.id, folder: "machinery" })
    } catch {
      return { error: "Failed to upload image. Check that BLOB_READ_WRITE_TOKEN is set." }
    }
  }

  const { error } = await supabase
    .from("machinery")
    .update({ machine_name, machine_type, description, serial_number, hectares_capacity, rate_per_hour, barangay, image_url, status, owner_id: existing.owner_id })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/machinery")
  revalidatePath("/machinery/manage")
  revalidatePath("/machinery/[id]", "page")
  revalidatePath("/dashboard")
  redirect("/machinery/manage")
}

export async function deleteMachinery(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { data: existing } = await supabase
    .from("machinery")
    .select("owner_id, machine_name")
    .eq("id", id)
    .single()
  if (!existing) return { error: "Machinery not found" }
  if (existing.owner_id !== user.id) {
    const admin = createAdminClient()
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "admin") return { error: "You do not own this machinery" }
  }

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("machinery_id", id)
    .in("status", ["pending", "approved", "active"])

  if ((count ?? 0) > 0) {
    return { error: `Cannot delete "${existing.machine_name}": there are ${count} active or pending booking(s). Cancel or complete them first.` }
  }

  const { error } = await supabase
    .from("machinery")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/machinery")
  revalidatePath("/machinery/manage")
  revalidatePath("/dashboard")
  revalidatePath("/bookings")
  redirect("/machinery/manage")
}
