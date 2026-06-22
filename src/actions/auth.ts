"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { uploadFile } from "@/lib/blob/client"
import { loginSchema, registerSchema } from "@/lib/validators/auth"

type AuthState = { error: string; success?: string }

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const parsed = loginSchema.safeParse({ email, password })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error, data } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user || !data.session) {
    return { error: error?.message ?? "Login failed" }
  }

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single()

  if (profileError || !profile) {
    return { error: `Profile lookup failed: ${profileError?.message ?? "not found"}` }
  }

  revalidatePath("/", "layout")
  return { success: profile.role === "admin" ? "/admin/dashboard" : "/dashboard", error: "" }
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

  const parsed = registerSchema.safeParse({
    email,
    password,
    confirmPassword,
    role,
    firstName,
    lastName,
    username,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

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

  const { error: profileErr } = await supabase.from("profiles").upsert({
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

  if (profileErr) return { error: "Failed to create profile: " + profileErr.message }

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

  const idFile = formData.get("id_document") as File | null
  if (idFile && idFile instanceof File && idFile.size > 0) {
    try {
      const idUrl = await uploadFile(idFile, { userId: data.user.id, folder: "id-documents", access: "private" })
      await supabase.from("uploads").insert({
        user_id: data.user.id,
        file_name: idFile.name,
        blob_url: idUrl,
        upload_type: "document",
      })
    } catch {
      // ID upload failed — continue registration anyway
    }
  }

  revalidatePath("/", "layout")
  return { success: "/dashboard", error: "" }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const username = formData.get("username") as string
  const phoneNumber = (formData.get("phone_number") as string) || null
  const barangay = (formData.get("barangay") as string) || null
  const address = (formData.get("address") as string) || null

  if (!firstName?.trim() || !lastName?.trim() || !username?.trim()) {
    return { error: "Name, username are required" }
  }

  const { error } = await supabase.from("profiles").update({
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    username: username.trim(),
    phone_number: phoneNumber?.trim() || null,
    barangay: barangay?.trim() || null,
    address: address?.trim() || null,
  }).eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/profile")
  return { success: true }
}
