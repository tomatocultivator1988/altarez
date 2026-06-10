import { createAdminClient } from "@/lib/supabase/admin"
import { Users, Tractor, CalendarCheck } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  let userCount = 0, machineCount = 0, bookingCount = 0

  try { const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }); userCount = count ?? 0 } catch {}
  try { const { count } = await supabase.from("machinery").select("*", { count: "exact", head: true }); machineCount = count ?? 0 } catch {}
  try { const { count } = await supabase.from("bookings").select("*", { count: "exact", head: true }); bookingCount = count ?? 0 } catch {}

  const stats = [
    { label: "Total Users", value: userCount, icon: Users, accent: "text-blue-400" },
    { label: "Total Machinery", value: machineCount, icon: Tractor, accent: "text-amber-400" },
    { label: "Total Bookings", value: bookingCount, icon: CalendarCheck, accent: "text-emerald-400" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/60">{s.label}</p>
              <s.icon className={`size-5 ${s.accent}`} />
            </div>
            <p className="mt-3 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
