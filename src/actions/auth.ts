"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

type AuthState = { error: string }

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error, data } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user || !data.session) {
    return { error: error?.message ?? "Login failed" }
  }

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single()

  const destination = profile?.role === "admin" ? "/admin/dashboard" : "/dashboard"
  redirect(destination)
}

export async function adminLogin(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error, data } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user || !data.session) {
    return { error: error?.message ?? "Login failed" }
  }

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single()

  if (profile?.role !== "admin") {
    await supabase.auth.signOut()
    return { error: "Access denied. Admin only." }
  }

  redirect("/admin/dashboard")
}

export async function register(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const role = formData.get("role") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const username = formData.get("username") as string

  if (password !== confirmPassword) return { error: "Passwords do not match" }
  if (password.length < 6) return { error: "Password must be at least 6 characters" }
  if (!["farmer", "lender"].includes(role)) return { error: "Invalid role" }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, first_name: firstName, last_name: lastName, username },
    },
  })

  if (error) return { error: error.message }
  if (!data.user) return { error: "Registration failed" }

  const phoneNumber = formData.get("phoneNumber") as string | null
  const isFcaMember = formData.get("isFcaMember") === "on"
  const barangay = formData.get("barangay") as string | null
  const address = formData.get("address") as string | null

  await supabase.from("profiles").upsert({
    id: data.user.id,
    role,
    first_name: firstName,
    last_name: lastName,
    username,
    phone_number: phoneNumber || null,
    is_fca_member: isFcaMember,
    barangay: barangay || null,
    address: address || null,
  })

  if (role === "lender") {
    const hectaresStr = formData.get("hectares") as string
    const hectares = hectaresStr ? Number(hectaresStr) : null
    const farmLocation = formData.get("farmLocation") as string | null

    await supabase.from("lender_profiles").upsert({
      id: data.user.id,
      hectares: hectares ?? 0,
      farm_location: farmLocation || null,
    })
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}
