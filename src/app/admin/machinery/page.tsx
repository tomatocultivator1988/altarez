import { createAdminClient } from "@/lib/supabase/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MACHINERY_STATUSES, MACHINERY_TYPES } from "@/lib/constants"

export default async function AdminMachineryPage() {
  const supabase = createAdminClient()
  const { data: machinery } = await supabase.from("machinery").select("*, owner:profiles(first_name, last_name, username)").order("created_at", { ascending: false })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All Machinery</h1>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {machinery?.map((m) => {
              const status = MACHINERY_STATUSES[m.status as keyof typeof MACHINERY_STATUSES]
              const type = MACHINERY_TYPES.find((t) => t.value === m.machine_type)
              const owner = m.owner as Record<string, string> | null
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.machine_name}</TableCell>
                  <TableCell>{type?.label ?? m.machine_type}</TableCell>
                  <TableCell><Badge className={status?.color}>{status?.label}</Badge></TableCell>
                  <TableCell>{owner?.first_name} {owner?.last_name}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
