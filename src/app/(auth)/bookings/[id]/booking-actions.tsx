"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateBookingStatus } from "@/actions/bookings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function BookingActions({ bookingId, status, isOwner, isRenter }: { bookingId: string; status: string; isOwner: boolean; isRenter: boolean }) {
  const [working, setWorking] = useState(false)
  const [err, setErr] = useState("")
  const router = useRouter()

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
