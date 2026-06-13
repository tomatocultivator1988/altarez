import { createAdminClient } from "@/lib/supabase/admin"
import { AdminUsersTable } from "./users-table"

export default async function AdminUsersPage() {
  const supabase = createAdminClient()
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">User Management</h1>
      <AdminUsersTable users={users ?? []} />
    </div>
  )
}
