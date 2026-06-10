import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { Header } from "@/components/layout/header"

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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Fixed background matching the landing page */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')" }}
      />
      <div className="fixed inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
      <div className="fixed inset-0 backdrop-blur-sm bg-black/10" />

      <AdminSidebar />
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Header
          user={{
            firstName: profile.first_name,
            lastName: profile.last_name,
            username: profile.username,
            avatarUrl: profile.avatar_url,
          }}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="rounded-xl border border-white/15 bg-black/60 p-6 backdrop-blur-xl text-white/90">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
