"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function adminUpdateUserRole(userId: string, newRole: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return { error: "Admin only" }

  if (!["farmer", "lender", "admin"].includes(newRole)) return { error: "Invalid role" }

  const { error } = await admin.from("profiles").update({ role: newRole }).eq("id", userId)
  if (error) return { error: error.message }

  if (newRole === "lender") {
    await admin.from("lender_profiles").upsert({ id: userId, hectares: 0, farm_location: null, equipment_count: 0 }, { ignoreDuplicates: true })
  }

  revalidatePath("/admin/users")
  revalidatePath("/admin/dashboard")
}

export async function adminDeleteUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return { error: "Admin only" }

  if (userId === user.id) return { error: "Cannot delete yourself" }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath("/admin/users")
  revalidatePath("/admin/machinery")
  revalidatePath("/admin/bookings")
  revalidatePath("/admin/dashboard")
  revalidatePath("/machinery")
  revalidatePath("/dashboard")
  revalidatePath("/bookings")
}

export async function adminGetUserDetail(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return { error: "Admin only" }

  const { data: authUser } = await admin.auth.admin.getUserById(userId)
  const email = authUser?.user?.email ?? "N/A"

  const { data: lenderProfile } = await admin
    .from("lender_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  const { count: machineryCount } = await admin
    .from("machinery")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId)

  const { count: bookingCount } = await admin
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .or(`renter_id.eq.${userId},owner_id.eq.${userId}`)

  return {
    email,
    lenderProfile,
    machineryCount: machineryCount ?? 0,
    bookingCount: bookingCount ?? 0,
  }
}

export async function adminDeleteMachinery(machineryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return { error: "Admin only" }

  const { count } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("machinery_id", machineryId)
    .in("status", ["pending", "approved", "active"])

  if ((count ?? 0) > 0) {
    return { error: `Cannot delete: there are ${count} active or pending booking(s). Cancel or complete them first.` }
  }

  const { error } = await admin.from("machinery").delete().eq("id", machineryId)
  if (error) return { error: error.message }

  revalidatePath("/admin/machinery")
  revalidatePath("/admin/dashboard")
  revalidatePath("/machinery")
  revalidatePath("/machinery/manage")
  revalidatePath("/dashboard")
  revalidatePath("/bookings")
}
