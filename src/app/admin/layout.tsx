import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { MobileLayoutWrapper } from "@/components/layout/mobile-layout-wrapper"
import type { UserRole } from "@/types/database"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/")

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, first_name, last_name, username, avatar_url")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") redirect("/")

  const headerUser = {
    firstName: profile.first_name,
    lastName: profile.last_name,
    username: profile.username,
    avatarUrl: profile.avatar_url,
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')" }}
      />
      <div className="fixed inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
      <div className="fixed inset-0 backdrop-blur-sm bg-black/10" />

      <AdminSidebar />
      <MobileLayoutWrapper role={profile.role as UserRole} user={headerUser}>
        {children}
      </MobileLayoutWrapper>
    </div>
  )
}
