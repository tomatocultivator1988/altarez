import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    return <div className="py-16 text-center text-muted-foreground">Please log in to view your dashboard.</div>
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return <div className="py-16 text-center text-muted-foreground">Profile not found.</div>
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
      .eq("status", "active")
    machineryCount = count ?? 0
  } catch {}

  const stats =
    profile.role === "farmer"
      ? [
          { label: "Active Bookings", value: activeBookings, icon: CalendarCheck },
          { label: "Completed", value: completedBookings, icon: Clock },
          { label: "Available Machinery", value: machineryCount, icon: Tractor },
        ]
      : profile.role === "lender"
        ? [
            { label: "Incoming Requests", value: activeBookings, icon: CalendarCheck },
            { label: "Completed Lendings", value: completedBookings, icon: Clock },
            { label: "My Machinery", value: machineryCount, icon: Tractor },
          ]
        : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Welcome back, {profile.first_name}!
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{stat.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <a href="/machinery" className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20">
            <Tractor className="size-4" /> Browse Machinery
          </a>
          <a href="/bookings" className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20">
            <CalendarCheck className="size-4" /> View Bookings
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
