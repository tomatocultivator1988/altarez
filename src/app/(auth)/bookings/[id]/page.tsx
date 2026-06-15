import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { BOOKING_STATUSES } from "@/lib/constants"
import { BookingActions } from "./booking-actions"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { id } = await params

  if (!user) return null

  const supabaseRegular = await createClient()
  let { data: b } = await supabaseRegular
    .from("bookings")
    .select("*, machinery(*), renter:profiles!bookings_renter_id_fkey(*), owner:profiles!bookings_owner_id_fkey(*)")
    .eq("id", id)
    .single()

  if (!b) {
    const admin = createAdminClient()
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "admin") {
      return (
        <div className="py-16 text-center text-white/60">
          Booking not found
          <Link href="/bookings" className="block mt-2 text-sm text-primary/80 hover:text-primary">Back to bookings</Link>
        </div>
      )
    }
    const { data: adminBooking } = await admin
      .from("bookings")
      .select("*, machinery(*), renter:profiles!bookings_renter_id_fkey(*), owner:profiles!bookings_owner_id_fkey(*)")
      .eq("id", id)
      .single()
    b = adminBooking
  }

  if (!b) {
    return (
      <div className="py-16 text-center text-white/60">
        Booking not found
        <Link href="/bookings" className="block mt-2 text-sm text-primary/80 hover:text-primary">Back to bookings</Link>
      </div>
    )
  }

  const isRenter = b.renter_id === user.id
  const isOwner = b.owner_id === user.id
  const machine = b.machinery as Record<string, unknown> | null
  const renter = b.renter as Record<string, string> | null
  const owner = b.owner as Record<string, string> | null
  const s = b.status as string
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
            <div><span className="text-white/50">Start:</span> {formatDate(b.starting_date)}</div>
            <div><span className="text-white/50">End:</span> {formatDate(b.ending_date)}</div>
            {b.requested_hectares != null && <div><span className="text-white/50">Hectares:</span> {b.requested_hectares} ha</div>}
            {b.estimated_hours != null && <div><span className="text-white/50">Est. Hours:</span> {b.estimated_hours}</div>}
            {b.total_amount != null && <div><span className="text-white/50">Total:</span> {formatCurrency(b.total_amount)}</div>}
          </div>
          <div className="border-t border-white/10 pt-4 text-sm space-y-1">
            <p><span className="text-white/50">Renter:</span> {renter?.first_name} {renter?.last_name}</p>
            <p><span className="text-white/50">Owner:</span> {owner?.first_name} {owner?.last_name}</p>
          </div>
          {b.notes ? <p className="text-sm text-white/50">Notes: {String(b.notes)}</p> : null}
          <BookingActions bookingId={id} status={s} isOwner={isOwner} isRenter={isRenter} />
        </div>
      </div>
    </div>
  )
}
