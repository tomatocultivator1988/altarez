import { createAdminClient } from "@/lib/supabase/admin"
import { Tractor, Users, CalendarCheck, AlertTriangle } from "lucide-react"

export default async function AdminReportsPage() {
  const admin = createAdminClient()

  const { count: totalUsers } = await admin.from("profiles").select("id", { count: "exact", head: true })
  const { count: totalMachinery } = await admin.from("machinery").select("id", { count: "exact", head: true })
  const { count: totalBookings } = await admin.from("bookings").select("id", { count: "exact", head: true })
  const { count: pendingBookings } = await admin.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending")
  const { count: activeBookings } = await admin.from("bookings").select("id", { count: "exact", head: true }).eq("status", "active")
  const { count: completedBookings } = await admin.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed")
  const { count: anomalyBookings } = await admin.from("bookings").select("id", { count: "exact", head: true }).eq("anomaly_flagged", true)
  const { count: openDisputes } = await admin.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open")

  const farmerCount = (await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "farmer")).count ?? 0
  const lenderCount = (await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "lender")).count ?? 0

  const stats = [
    { label: "Total Users", value: totalUsers ?? 0, sub: `${farmerCount} farmers, ${lenderCount} lenders`, icon: Users, color: "text-blue-400" },
    { label: "Total Machinery", value: totalMachinery ?? 0, sub: "Registered equipment", icon: Tractor, color: "text-green-400" },
    { label: "Total Bookings", value: totalBookings ?? 0, sub: `${pendingBookings ?? 0} pending, ${activeBookings ?? 0} active`, icon: CalendarCheck, color: "text-yellow-400" },
    { label: "Completed", value: completedBookings ?? 0, sub: `${anomalyBookings ?? 0} flagged for anomalies`, icon: CalendarCheck, color: "text-emerald-400" },
    { label: "Open Disputes", value: openDisputes ?? 0, sub: "Requires admin attention", icon: AlertTriangle, color: "text-red-400" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <s.icon className={`size-5 ${s.color}`} />
              <span className="text-sm text-white/50">{s.label}</span>
            </div>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="mt-1 text-xs text-white/40">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
