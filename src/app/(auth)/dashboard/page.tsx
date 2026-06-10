import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | Agrimalachina",
  description: "Your agricultural machinery management dashboard — track bookings, browse equipment, and manage rentals.",
}

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tractor, CalendarCheck, Clock } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  const { first_name, role } = profile as unknown as { first_name: string; last_name: string; role: string }

  const { count: activeBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
    .in("status", ["pending", "approved", "active"])

  const { count: completedBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
    .eq("status", "completed")

  const { count: machineryCount } = await supabase
    .from("machinery")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  const stats =
    role === "farmer"
      ? [
          { label: "Active Bookings", value: activeBookings ?? 0, icon: CalendarCheck },
          { label: "Completed", value: completedBookings ?? 0, icon: Clock },
          { label: "Available Machinery", value: machineryCount ?? 0, icon: Tractor },
        ]
      : role === "lender"
        ? [
            { label: "Incoming Requests", value: activeBookings ?? 0, icon: CalendarCheck },
            { label: "Completed Lendings", value: completedBookings ?? 0, icon: Clock },
            { label: "My Machinery", value: machineryCount ?? 0, icon: Tractor },
          ]
        : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Welcome back, {first_name}!
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <a
            href="/machinery"
            className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
          >
            <Tractor className="size-4" />
            Browse Machinery
          </a>
          <a
            href="/bookings"
            className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
          >
            <CalendarCheck className="size-4" />
            View Bookings
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
