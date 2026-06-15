import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { MACHINERY_STATUSES, MACHINERY_TYPES } from "@/lib/constants"
import { AdminMachineryActions } from "@/components/admin/machinery-actions"

export default async function AdminMachineryPage() {
  const supabase = createAdminClient()
  const { data: machinery } = await supabase
    .from("machinery")
    .select("*, owner:profiles(first_name, last_name, username)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All Machinery</h1>
      {!machinery?.length ? (
        <div className="py-16 text-center text-white/40">No machinery registered yet</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/50">
                  <th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Owner</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {machinery.map((m) => {
                  const status = MACHINERY_STATUSES[m.status as keyof typeof MACHINERY_STATUSES]
                  const type = MACHINERY_TYPES.find((t) => t.value === m.machine_type)
                  const owner = m.owner as Record<string, string> | null
                  return (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-medium">{m.machine_name}</td>
                      <td className="p-3 text-white/50">{type?.label ?? m.machine_type}</td>
                      <td className="p-3"><Badge className={status?.color}>{status?.label}</Badge></td>
                      <td className="p-3 text-white/40">{owner?.first_name} {owner?.last_name}</td>
                      <td className="p-3">
                        <AdminMachineryActions machineryId={m.id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {machinery.map((m) => {
              const status = MACHINERY_STATUSES[m.status as keyof typeof MACHINERY_STATUSES]
              const type = MACHINERY_TYPES.find((t) => t.value === m.machine_type)
              const owner = m.owner as Record<string, string> | null
              return (
                <div key={m.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{m.machine_name}</span>
                    <Badge className={status?.color}>{status?.label}</Badge>
                  </div>
                  <div className="mt-1.5 text-sm text-white/50">{type?.label ?? m.machine_type}</div>
                  <div className="mt-0.5 text-sm text-white/40">Owner: {owner?.first_name} {owner?.last_name}</div>
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <AdminMachineryActions machineryId={m.id} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
