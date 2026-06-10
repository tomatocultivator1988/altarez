import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Tractor, CalendarCheck } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  let userCount = 0, machineCount = 0, bookingCount = 0

  try {
    const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true })
    userCount = count ?? 0
  } catch {}

  try {
    const { count } = await supabase.from("machinery").select("*", { count: "exact", head: true })
    machineCount = count ?? 0
  } catch {}

  try {
    const { count } = await supabase.from("bookings").select("*", { count: "exact", head: true })
    bookingCount = count ?? 0
  } catch {}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{userCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Machinery</CardTitle>
            <Tractor className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{machineCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            <CalendarCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{bookingCount}</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
