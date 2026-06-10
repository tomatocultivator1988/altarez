import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import type { UserRole } from "@/types/database"

interface AuthLayoutProps {
  children: React.ReactNode
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name, username, avatar_url")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  const role = profile.role as string

  if (role === "admin") redirect("/admin/dashboard")

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role as UserRole} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={{
            firstName: profile.first_name,
            lastName: profile.last_name,
            username: profile.username,
            avatarUrl: profile.avatar_url,
          }}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
