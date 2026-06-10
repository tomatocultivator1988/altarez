import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { BOOKING_STATUSES } from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function AdminBookingsPage() {
  const supabase = createAdminClient()
  const { data: bookings } = await supabase.from("bookings").select("*, machinery(machine_name), renter:profiles!bookings_renter_id_fkey(first_name, last_name), owner:profiles!bookings_owner_id_fkey(first_name, last_name)").order("created_at", { ascending: false })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All Bookings</h1>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/50">
              <th className="p-3 font-medium">Machine</th><th className="p-3 font-medium">Renter</th>
              <th className="p-3 font-medium">Dates</th><th className="p-3 font-medium">Amount</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings?.map((b) => {
              const machine = b.machinery as Record<string, unknown> | null
              const renter = b.renter as Record<string, string> | null
              const status = BOOKING_STATUSES[b.status as keyof typeof BOOKING_STATUSES]
              return (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3 font-medium">{machine?.machine_name as string}</td>
                  <td className="p-3 text-white/50">{renter?.first_name}</td>
                  <td className="p-3 text-white/50">{formatDate(b.starting_date)}</td>
                  <td className="p-3">{b.total_amount != null ? formatCurrency(b.total_amount) : "-"}</td>
                  <td className="p-3"><Badge className={status?.color}>{status?.label}</Badge></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
