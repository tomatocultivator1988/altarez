import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Lending History | Agrimalachina",
  description: "View your completed machinery lending history and earnings.",
}

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BOOKING_STATUSES } from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"
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
          <Clock className="size-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No history yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const machine = b.machinery as Record<string, unknown> | null
            const renter = b.renter as Record<string, string> | null
            const status = BOOKING_STATUSES[b.status as keyof typeof BOOKING_STATUSES]
            return (
              <Card key={b.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold">{machine?.machine_name as string}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(b.starting_date)} → {formatDate(b.ending_date)}</p>
                    {renter && <p className="text-xs text-muted-foreground">Rented by: {renter.first_name}</p>}
                  </div>
                  <div className="text-right">
                    <Badge className={status?.color}>{status?.label}</Badge>
                    {b.total_amount != null && <p className="mt-1 font-semibold text-sm">{formatCurrency(b.total_amount)}</p>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
