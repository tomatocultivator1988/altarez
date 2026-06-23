"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { uploadFile } from "@/lib/blob/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { machinerySchema } from "@/lib/validators/machinery"
import { MACHINERY_STATUSES } from "@/lib/constants"

export async function createMachinery(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const machine_name = formData.get("machine_name") as string
  const machine_type = formData.get("machine_type") as string
  const description = formData.get("description") as string || undefined
  const serial_number = formData.get("serial_number") as string || undefined
  const hectares_capacity = formData.get("hectares_capacity") ? Number(formData.get("hectares_capacity")) : undefined
  const rate_per_hectare = formData.get("rate_per_hectare") ? Number(formData.get("rate_per_hectare")) : undefined
  const barangay = formData.get("barangay") as string || undefined

  const parsed = machinerySchema.safeParse({
    machine_name,
    machine_type,
    description,
    serial_number,
    hectares_capacity,
    rate_per_hectare,
    barangay,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const imageFile = formData.get("image")
  let image_url: string | null = null
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      image_url = await uploadFile(imageFile, { userId: user.id, folder: "machinery", access: "public" })
    } catch (e: any) {
      return { error: e?.message || "Failed to upload image" }
    }
  }

  const { error } = await supabase.from("machinery").insert({
    owner_id: user.id,
    machine_name,
    machine_type,
    description,
    serial_number,
    hectares_capacity,
    rate_per_hectare,
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
  const rate_per_hectare = formData.get("rate_per_hectare") ? Number(formData.get("rate_per_hectare")) : undefined
  const barangay = formData.get("barangay") as string || undefined
  const status = formData.get("status") as string || undefined
  if (status && !Object.keys(MACHINERY_STATUSES).includes(status))
    return { error: "Invalid machinery status" }

  const parsed = machinerySchema.safeParse({
    machine_name,
    machine_type,
    description,
    serial_number,
    hectares_capacity,
    rate_per_hectare,
    barangay,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const imageFile = formData.get("image")
  let image_url = formData.get("existing_image_url") as string || null
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      image_url = await uploadFile(imageFile, { userId: user.id, folder: "machinery", access: "public" })
    } catch (e: any) {
      return { error: e?.message || "Failed to upload image" }
    }
  }

  const { error } = await supabase
    .from("machinery")
    .update({ machine_name, machine_type, description, serial_number, hectares_capacity, rate_per_hectare, barangay, image_url, status })
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

  if ((count ?? 0) > 0) {
    return { error: `Cannot delete "${existing.machine_name}": it has ${count} booking(s). Soft-delete by setting status to "inactive" instead.` }
  }

  const { error } = await supabase
    .from("machinery")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/machinery")
  revalidatePath("/machinery/manage")
  revalidatePath("/dashboard")
  revalidatePath("/bookings", "page")
  redirect("/machinery/manage")
}

export async function getOwnMachinery() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()
  const { data } = await admin.from("machinery").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
  return data ?? []
}
