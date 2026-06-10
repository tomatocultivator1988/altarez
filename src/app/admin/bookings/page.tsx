import { createAdminClient } from "@/lib/supabase/admin"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BOOKING_STATUSES } from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function AdminBookingsPage() {
  const supabase = createAdminClient()
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, machinery(machine_name), renter:profiles!bookings_renter_id_fkey(first_name, last_name), owner:profiles!bookings_owner_id_fkey(first_name, last_name)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All Bookings</h1>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Machine</TableHead>
              <TableHead>Renter</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings?.map((b) => {
              const machine = b.machinery as Record<string, unknown> | null
              const renter = b.renter as Record<string, string> | null
              const status = BOOKING_STATUSES[b.status as keyof typeof BOOKING_STATUSES]
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{machine?.machine_name as string}</TableCell>
                  <TableCell>{renter?.first_name}</TableCell>
                  <TableCell>{formatDate(b.starting_date)}</TableCell>
                  <TableCell>{b.total_amount != null ? formatCurrency(b.total_amount) : "-"}</TableCell>
                  <TableCell><Badge className={status?.color}>{status?.label}</Badge></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
