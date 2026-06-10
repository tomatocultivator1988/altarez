import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Bookings | Agrimalachina",
  description: "Track your machinery rental bookings — pending, approved, active, and completed.",
}

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { BOOKING_STATUSES, MACHINERY_TYPES } from "@/lib/constants"
import Link from "next/link"
import { CalendarCheck } from "lucide-react"

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: bookings } = await supabase
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
          <CalendarCheck className="size-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No bookings yet</h3>
          <Link href="/machinery" className="mt-2 text-sm text-primary hover:underline">Browse machinery</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const machine = b.machinery as Record<string, unknown> | null
            const renter = b.renter as Record<string, string> | null
            const owner = b.owner as Record<string, string> | null
            const status = BOOKING_STATUSES[b.status as keyof typeof BOOKING_STATUSES]

            return (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{machine?.machine_name as string ?? "Machinery"}</h3>
                        <Badge className={status?.color}>{status?.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(b.starting_date)} → {formatDate(b.ending_date)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {renter && b.renter_id === user.id ? "You requested" : `Requested by ${renter?.first_name ?? "unknown"}`}
                        {owner && b.owner_id === user.id ? " \u2022 Your machinery" : ` \u2022 Owner: ${owner?.first_name ?? "unknown"}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {b.total_amount != null && (
                        <p className="font-semibold">{formatCurrency(b.total_amount)}</p>
                      )}
                      <Link href={`/bookings/${b.id}`} className="text-xs text-primary hover:underline">View details</Link>
                    </div>
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
