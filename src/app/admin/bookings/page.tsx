import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { BOOKING_STATUSES } from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AdminBookingActions } from "@/components/admin/booking-actions"
import Link from "next/link"

export default async function AdminBookingsPage() {
  const supabase = createAdminClient()
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, machinery(machine_name), renter:profiles!bookings_renter_id_fkey(first_name, last_name), owner:profiles!bookings_owner_id_fkey(first_name, last_name)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All Bookings</h1>
      {!bookings?.length ? (
        <div className="py-16 text-center text-white/40">No bookings yet</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/50">
                  <th className="p-3 font-medium">Machine</th><th className="p-3 font-medium">Renter</th>
                  <th className="p-3 font-medium">Owner</th><th className="p-3 font-medium">Dates</th>
                  <th className="p-3 font-medium">Amount</th><th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Actions</th>
                  <th className="p-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const machine = b.machinery as Record<string, unknown> | null
                  const renter = b.renter as Record<string, string> | null
                  const owner = b.owner as Record<string, string> | null
                  const status = BOOKING_STATUSES[b.status as keyof typeof BOOKING_STATUSES]
                  return (
                    <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-medium">{machine?.machine_name as string}</td>
                      <td className="p-3 text-white/50">{renter?.first_name} {renter?.last_name}</td>
                      <td className="p-3 text-white/50">{owner?.first_name} {owner?.last_name}</td>
                      <td className="p-3 text-white/50">{formatDate(b.starting_date)}</td>
                      <td className="p-3">{b.total_amount != null ? formatCurrency(b.total_amount) : "-"}</td>
                      <td className="p-3"><Badge className={status?.color}>{status?.label}</Badge></td>
                      <td className="p-3">
                        <AdminBookingActions bookingId={b.id} status={b.status} />
                      </td>
                      <td className="p-3">
                        <Link href={`/bookings/${b.id}`} className="text-xs text-white/40 hover:text-white underline">View</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {bookings.map((b) => {
              const machine = b.machinery as Record<string, unknown> | null
              const renter = b.renter as Record<string, string> | null
              const owner = b.owner as Record<string, string> | null
              const status = BOOKING_STATUSES[b.status as keyof typeof BOOKING_STATUSES]
              return (
                <div key={b.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{machine?.machine_name as string}</span>
                    <Badge className={status?.color}>{status?.label}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-white/50">
                    <div>Renter: {renter?.first_name} {renter?.last_name}</div>
                    <div>Owner: {owner?.first_name} {owner?.last_name}</div>
                  </div>
                  <div className="mt-1 text-sm text-white/50">
                    {formatDate(b.starting_date)}{b.total_amount != null && ` · ${formatCurrency(b.total_amount)}`}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <AdminBookingActions bookingId={b.id} status={b.status} />
                    <Link href={`/bookings/${b.id}`} className="text-xs text-white/40 hover:text-white underline">View details</Link>
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
