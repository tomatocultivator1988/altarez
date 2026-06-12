"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { updateBookingStatus } from "@/actions/bookings"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { BOOKING_STATUSES } from "@/lib/constants"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { id } = use(params)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
      const { data: b } = await supabase
        .from("bookings")
        .select("*, machinery(*), renter:profiles!bookings_renter_id_fkey(*), owner:profiles!bookings_owner_id_fkey(*)")
        .eq("id", id).single()
      setBooking(b || null)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="py-16 text-center text-white/40">Loading...</div>
  if (!booking) return <div className="py-16 text-center text-white/60">Booking not found</div>

  const isRenter = booking.renter_id === userId
  const isOwner = booking.owner_id === userId
  const machine = booking.machinery as Record<string, unknown> | null
  const renter = booking.renter as Record<string, string> | null
  const owner = booking.owner as Record<string, string> | null
  const s = booking.status as string
  const status = BOOKING_STATUSES[s as keyof typeof BOOKING_STATUSES]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/bookings" className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white"><ArrowLeft className="size-4" /> Back</Link>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{machine?.machine_name as string ?? "Machinery"}</h2>
            <Badge className={status?.color}>{status?.label}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-white/50">Start:</span> {formatDate(booking.starting_date as string)}</div>
            <div><span className="text-white/50">End:</span> {formatDate(booking.ending_date as string)}</div>
            {booking.requested_hectares != null && <div><span className="text-white/50">Hectares:</span> {booking.requested_hectares as number} ha</div>}
            {booking.estimated_hours != null && <div><span className="text-white/50">Est. Hours:</span> {booking.estimated_hours as number}</div>}
            {booking.total_amount != null && <div><span className="text-white/50">Total:</span> {formatCurrency(booking.total_amount as number)}</div>}
          </div>
          <div className="border-t border-white/10 pt-4 text-sm space-y-1">
            <p><span className="text-white/50">Renter:</span> {renter?.first_name} {renter?.last_name}</p>
            <p><span className="text-white/50">Owner:</span> {owner?.first_name} {owner?.last_name}</p>
          </div>
          {booking.notes ? <p className="text-sm text-white/50">Notes: {String(booking.notes)}</p> : null}
          <BookingActions bookingId={id} status={s} isOwner={isOwner} isRenter={isRenter} router={router} />
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  )
}

function BookingActions({ bookingId, status, isOwner, isRenter, router }: {
  bookingId: string; status: string; isOwner: boolean; isRenter: boolean; router: ReturnType<typeof useRouter>
}) {
  const [working, setWorking] = useState(false)
  const [err, setErr] = useState("")

  async function handle(s: string) {
    setWorking(true); setErr("")
    const res = await updateBookingStatus(bookingId, s) as { error?: string } | undefined
    if (res?.error) { setErr(res.error); setWorking(false); return }
    router.refresh()
  }

  if (working) return <p className="text-sm text-white/40 pt-2">Updating...</p>
  return (
    <>
      {isOwner && status === "pending" && (
        <div className="flex gap-3 pt-2">
          <button onClick={() => handle("approved")} className={cn(buttonVariants(), "bg-emerald-600 hover:bg-emerald-700")}>Approve</button>
          <button onClick={() => handle("denied")} className={cn(buttonVariants({ variant: "destructive" }))}>Deny</button>
        </div>
      )}
      {isOwner && status === "approved" && <button onClick={() => handle("active")} className={cn(buttonVariants({ className: "mt-2" }))}>Mark as Active</button>}
      {(isOwner || isRenter) && status === "active" && <button onClick={() => handle("completed")} className={cn(buttonVariants({ className: "mt-2" }))}>Mark Completed</button>}
      {isRenter && (status === "pending" || status === "approved") && (
        <button onClick={() => handle("cancelled")} className={cn(buttonVariants({ variant: "outline", className: "mt-2 border-red-400/30 text-red-300 hover:bg-red-400/10" }))}>Cancel Booking</button>
      )}
      {err && <p className="text-sm text-red-400 pt-2">{err}</p>}
    </>
  )
}
