import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { BOOKING_STATUSES } from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { CalendarCheck } from "lucide-react"

export const metadata: Metadata = { title: "My Bookings | Agrimalachina", description: "Track your machinery bookings." }

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <p className="text-white/50">Please log in.</p>

  const admin = createAdminClient()
  const { data: bookings } = await admin
    .from("bookings")
    .select("*, machinery(machine_name, machine_type), renter:profiles!bookings_renter_id_fkey(first_name, last_name), owner:profiles!bookings_owner_id_fkey(first_name, last_name)")
    .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bookings</h1>
      {!bookings?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarCheck className="size-12 text-white/20" />
          <h3 className="mt-4 text-lg font-medium text-white/60">No bookings yet</h3>
          <Link href="/machinery" className="mt-2 text-sm text-primary/80 hover:text-primary">Browse machinery</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const machine = b.machinery as Record<string, unknown> | null
            const renter = b.renter as Record<string, string> | null
            const owner = b.owner as Record<string, string> | null
            const status = BOOKING_STATUSES[b.status as keyof typeof BOOKING_STATUSES]
            return (
              <Link key={b.id} href={`/bookings/${b.id}`}>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{machine?.machine_name as string ?? "Machinery"}</h3>
                        <Badge className={status?.color}>{status?.label}</Badge>
                      </div>
                      <p className="text-sm text-white/50">{formatDate(b.starting_date)} → {formatDate(b.ending_date)}</p>
                      <p className="text-sm text-white/40">
                        {renter && b.renter_id === user.id ? "You requested" : `By ${renter?.first_name ?? "?"}`}
                        {owner && b.owner_id === user.id ? " • Your machinery" : ` • ${owner?.first_name ?? "?"}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {b.total_amount != null && <p className="font-semibold">{formatCurrency(b.total_amount)}</p>}
                      <p className="text-xs text-white/40">View details</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
