"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { updateBookingStatus } from "@/actions/bookings"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { BOOKING_STATUSES } from "@/lib/constants"

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState("")
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("bookings")
        .select("*, machinery(machine_name), renter:profiles!bookings_renter_id_fkey(first_name, last_name), owner:profiles!bookings_owner_id_fkey(first_name, last_name)")
        .order("created_at", { ascending: false })
      setBookings(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleAction(bookingId: string, status: string) {
    setActionMsg("")
    const res = await updateBookingStatus(bookingId, status) as { error?: string } | undefined
    if (res?.error) { setActionMsg(res.error); return }
    router.refresh()
  }

  if (loading) return <div className="py-16 text-center text-white/40">Loading...</div>

  const showable = (s: string) => !["completed", "denied", "cancelled"].includes(s)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All Bookings</h1>
      {actionMsg && <div className="rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{actionMsg}</div>}
      {!bookings.length ? (
        <div className="py-16 text-center text-white/40">No bookings yet</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/50">
                <th className="p-3 font-medium">Machine</th><th className="p-3 font-medium">Renter</th>
                <th className="p-3 font-medium">Owner</th><th className="p-3 font-medium">Dates</th>
                <th className="p-3 font-medium">Amount</th><th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const machine = b.machinery as Record<string, unknown> | null
                const renter = b.renter as Record<string, string> | null
                const owner = b.owner as Record<string, string> | null
                const status = BOOKING_STATUSES[b.status as keyof typeof BOOKING_STATUSES]
                const s = b.status as string
                return (
                  <tr key={b.id as string} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium">{machine?.machine_name as string}</td>
                    <td className="p-3 text-white/50">{renter?.first_name} {renter?.last_name}</td>
                    <td className="p-3 text-white/50">{owner?.first_name} {owner?.last_name}</td>
                    <td className="p-3 text-white/50">{formatDate(b.starting_date as string)}</td>
                    <td className="p-3">{b.total_amount != null ? formatCurrency(b.total_amount as number) : "-"}</td>
                    <td className="p-3"><Badge className={status?.color}>{status?.label}</Badge></td>
                    <td className="p-3">
                      {showable(s) && (
                        <div className="flex gap-1">
                          {s === "pending" && (
                            <>
                              <button onClick={() => handleAction(b.id as string, "approved")} className={cn(buttonVariants({ size: "sm" }), "bg-emerald-600 hover:bg-emerald-700 h-7 px-2 text-xs")}>Approve</button>
                              <button onClick={() => handleAction(b.id as string, "denied")} className={cn(buttonVariants({ size: "sm", variant: "destructive" }), "h-7 px-2 text-xs")}>Deny</button>
                            </>
                          )}
                          {s === "approved" && <button onClick={() => handleAction(b.id as string, "active")} className={cn(buttonVariants({ size: "sm" }), "h-7 px-2 text-xs")}>Activate</button>}
                          {s === "active" && <button onClick={() => handleAction(b.id as string, "completed")} className={cn(buttonVariants({ size: "sm" }), "h-7 px-2 text-xs")}>Complete</button>}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
