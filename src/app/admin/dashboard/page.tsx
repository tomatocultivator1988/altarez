import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutDashboard, Users, Tractor, CalendarCheck } from "lucide-react"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })
  const { count: machineCount } = await supabase.from("machinery").select("*", { count: "exact", head: true })
  const { count: bookingCount } = await supabase.from("bookings").select("*", { count: "exact", head: true })

  const stats = [
    { label: "Total Users", value: userCount ?? 0, icon: Users },
    { label: "Total Machinery", value: machineCount ?? 0, icon: Tractor },
    { label: "Total Bookings", value: bookingCount ?? 0, icon: CalendarCheck },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
