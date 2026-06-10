import { createAdminClient } from "@/lib/supabase/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn, formatDate } from "@/lib/utils"
import { USER_ROLES } from "@/lib/constants"

export default async function AdminUsersPage() {
  const supabase = createAdminClient()
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">User Management</h1>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Barangay</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.first_name} {u.last_name}</TableCell>
                <TableCell>@{u.username}</TableCell>
                <TableCell><Badge>{u.role}</Badge></TableCell>
                <TableCell>{u.barangay ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(u.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
