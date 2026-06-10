"use client"

import { use, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { updateBookingStatus } from "@/actions/bookings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { BOOKING_STATUSES } from "@/lib/constants"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { id } = use(params)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const { data: b } = await supabase
        .from("bookings")
        .select("*, machinery(*), renter:profiles!bookings_renter_id_fkey(*), owner:profiles!bookings_owner_id_fkey(*)")
        .eq("id", id)
        .single()

      setBooking(b || null)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="py-16 text-center text-muted-foreground">Loading...</div>
  if (!booking) return <div className="py-16 text-center">Booking not found</div>

  const isRenter = booking.renter_id === userId
  const isOwner = booking.owner_id === userId
  const machine = booking.machinery as Record<string, unknown> | null
  const renter = booking.renter as Record<string, string> | null
  const owner = booking.owner as Record<string, string> | null
  const s = booking.status as string
  const status = BOOKING_STATUSES[s as keyof typeof BOOKING_STATUSES]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/bookings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="size-4" /> Back to bookings
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{machine?.machine_name as string ?? "Machinery"}</CardTitle>
            <Badge className={status?.color}>{status?.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Start:</span> {formatDate(booking.starting_date as string)}</div>
            <div><span className="text-muted-foreground">End:</span> {formatDate(booking.ending_date as string)}</div>
            {booking.requested_hectares != null && <div><span className="text-muted-foreground">Hectares:</span> {booking.requested_hectares as number} ha</div>}
            {booking.estimated_hours != null && <div><span className="text-muted-foreground">Est. Hours:</span> {booking.estimated_hours as number}</div>}
            {booking.total_amount != null && <div><span className="text-muted-foreground">Total:</span> {formatCurrency(booking.total_amount as number)}</div>}
          </div>

          <Separator />
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Renter:</span> {renter?.first_name} {renter?.last_name}</p>
            <p><span className="text-muted-foreground">Owner:</span> {owner?.first_name} {owner?.last_name}</p>
          </div>
          {booking.notes ? <p className="text-sm text-muted-foreground">Notes: {String(booking.notes)}</p> : null}

          <BookingActions bookingId={id} status={s} isOwner={isOwner} isRenter={isRenter} />
        </CardContent>
      </Card>
    </div>
  )
}

function BookingActions({ bookingId, status, isOwner, isRenter }: {
  bookingId: string; status: string; isOwner: boolean; isRenter: boolean
}) {
  const [working, setWorking] = useState(false)

  async function handle(status: string) {
    setWorking(true)
    await updateBookingStatus(bookingId, status)
    window.location.reload()
  }

  if (working) return <p className="text-sm text-muted-foreground pt-2">Updating...</p>

  return (
    <>
      {isOwner && status === "pending" && (
        <div className="flex gap-3 pt-2">
          <button onClick={() => handle("approved")} className={cn(buttonVariants(), "bg-green-600 hover:bg-green-700")}>Approve</button>
          <button onClick={() => handle("denied")} className={cn(buttonVariants({ variant: "destructive" }))}>Deny</button>
        </div>
      )}
      {isOwner && status === "approved" && (
        <button onClick={() => handle("active")} className={cn(buttonVariants())}>Mark as Active</button>
      )}
      {(isOwner || isRenter) && status === "active" && (
        <button onClick={() => handle("completed")} className={cn(buttonVariants())}>Mark as Completed</button>
      )}
    </>
  )
}
