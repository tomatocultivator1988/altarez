import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export default async function AdminUsersPage() {
  const supabase = createAdminClient()
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">User Management</h1>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/50">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Username</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Barangay</th>
              <th className="p-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-3 font-medium">{u.first_name} {u.last_name}</td>
                <td className="p-3 text-white/50">@{u.username}</td>
                <td className="p-3"><Badge>{u.role}</Badge></td>
                <td className="p-3 text-white/40">{u.barangay ?? "-"}</td>
                <td className="p-3 text-white/40">{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
