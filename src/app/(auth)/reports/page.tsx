import { createClient } from "@/lib/supabase/server"
import { FileText, CheckCircle, Clock, XCircle } from "lucide-react"

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { count: total } = await supabase.from("bookings").select("id", { count: "exact", head: true }).or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
  const { count: completed } = await supabase.from("bookings").select("id", { count: "exact", head: true }).or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`).eq("status", "completed")
  const { count: active } = await supabase.from("bookings").select("id", { count: "exact", head: true }).or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`).eq("status", "active")
  const { count: pending } = await supabase.from("bookings").select("id", { count: "exact", head: true }).or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`).eq("status", "pending")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const isLender = profile?.role === "lender"
  const { count: ownedMachinery } = isLender
    ? await supabase.from("machinery").select("id", { count: "exact", head: true }).eq("owner_id", user.id)
    : { count: 0 }

  const stats = [
    { label: "Total Bookings", value: total ?? 0, icon: FileText, color: "text-blue-400" },
    { label: "Pending", value: pending ?? 0, icon: Clock, color: "text-yellow-400" },
    { label: "Active", value: active ?? 0, icon: FileText, color: "text-green-400" },
    { label: "Completed", value: completed ?? 0, icon: CheckCircle, color: "text-emerald-400" },
  ]

  if (isLender) {
    stats.push({ label: "My Machinery", value: ownedMachinery ?? 0, icon: FileText, color: "text-purple-400" } as any)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Reports</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <s.icon className={`size-5 ${s.color}`} />
              <span className="text-sm text-white/50">{s.label}</span>
            </div>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
