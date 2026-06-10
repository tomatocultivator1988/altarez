import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { BOOKING_STATUSES } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { Clock } from "lucide-react"

export default async function LendingHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, machinery(machine_name), renter:profiles!bookings_renter_id_fkey(first_name, last_name)")
    .eq("owner_id", user.id)
    .in("status", ["completed", "denied"])
    .order("updated_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Lending History</h1>
      {!bookings?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="size-12 text-white/20" />
          <h3 className="mt-4 text-lg font-medium text-white/60">No history yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const machine = b.machinery as Record<string, unknown> | null
            const renter = b.renter as Record<string, string> | null
            const status = BOOKING_STATUSES[b.status as keyof typeof BOOKING_STATUSES]
            return (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div>
                  <h3 className="font-semibold">{machine?.machine_name as string}</h3>
                  <p className="text-sm text-white/50">{formatDate(b.starting_date)} → {formatDate(b.ending_date)}</p>
                  {renter && <p className="text-xs text-white/40">Rented by: {renter.first_name}</p>}
                </div>
                <div className="text-right">
                  <Badge className={status?.color}>{status?.label}</Badge>
                  {b.total_amount != null && <p className="mt-1 text-sm font-semibold">{b.total_amount as number}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
