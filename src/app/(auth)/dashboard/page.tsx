import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Tractor, CalendarCheck, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard | Agrimalachina",
  description: "Your agricultural machinery management dashboard.",
}

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <p className="text-white/50">Please log in to view your dashboard.</p>
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return <p className="text-white/50">Profile not found.</p>
  }

  let activeBookings = 0, completedBookings = 0, machineryCount = 0

  try {
    const { count } = await admin
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
      .in("status", ["pending", "approved", "active"])
    activeBookings = count ?? 0
  } catch {}

  try {
    const { count } = await admin
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
      .eq("status", "completed")
    completedBookings = count ?? 0
  } catch {}

  try {
    const { count } = await admin
      .from("machinery")
      .select("*", { count: "exact", head: true })
      .eq(profile.role === "lender" ? "owner_id" : "status", profile.role === "lender" ? user.id : "active")
    machineryCount = count ?? 0
  } catch {}

  const stats =
    profile.role === "farmer"
      ? [
          { label: "Active Bookings", value: activeBookings, icon: CalendarCheck, accent: "text-blue-400" },
          { label: "Completed", value: completedBookings, icon: Clock, accent: "text-emerald-400" },
          { label: "Available Machinery", value: machineryCount, icon: Tractor, accent: "text-amber-400" },
        ]
      : [
          { label: "Incoming Requests", value: activeBookings, icon: CalendarCheck, accent: "text-blue-400" },
          { label: "Completed Lendings", value: completedBookings, icon: Clock, accent: "text-emerald-400" },
          { label: "My Machinery", value: machineryCount, icon: Tractor, accent: "text-amber-400" },
        ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome back, {profile.first_name}!</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/60">{stat.label}</p>
              <stat.icon className={`size-5 ${stat.accent}`} />
            </div>
            <p className="mt-3 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <h3 className="text-sm font-medium text-white/60">Quick Actions</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href="/machinery" className="inline-flex items-center gap-2 rounded-lg bg-primary/20 px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/30 transition-colors">
            <Tractor className="size-4" /> Browse Machinery
          </a>
          <a href="/bookings" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 transition-colors">
            <CalendarCheck className="size-4" /> View Bookings
          </a>
        </div>
      </div>
    </div>
  )
}
