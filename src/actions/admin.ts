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
}
