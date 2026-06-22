"use client"

import { useState } from "react"
import { updateBookingStatus } from "@/actions/bookings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PickupDocumentationForm } from "@/components/bookings/pickup-documentation-form"
import { ReturnDocumentationForm } from "@/components/bookings/return-documentation-form"

export function AdminBookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const [working, setWorking] = useState(false)
  const [err, setErr] = useState("")
  const [showPickup, setShowPickup] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(status)

  async function handle(s: string) {
    setWorking(true); setErr("")
    const res = await updateBookingStatus(bookingId, s) as { error?: string } | undefined
    if (res?.error) { setErr(res.error); setWorking(false); return }
    setCurrentStatus(s)
    setWorking(false)
  }

  if (working) return <span className="text-xs text-white/40">...</span>

  const showable = !["completed", "denied", "cancelled"].includes(currentStatus)

  return (
    <>
      {showable && (
        <div className="flex gap-1">
          {currentStatus === "pending" && (
            <>
              <button onClick={() => handle("approved")} className={cn(buttonVariants({ size: "sm" }), "bg-emerald-600 hover:bg-emerald-700 h-7 px-2 text-xs")}>Approve</button>
              <button onClick={() => handle("denied")} className={cn(buttonVariants({ size: "sm", variant: "destructive" }), "h-7 px-2 text-xs")}>Deny</button>
            </>
          )}
          {currentStatus === "approved" && <button onClick={() => setShowPickup(true)} className={cn(buttonVariants({ size: "sm" }), "h-7 px-2 text-xs")}>Doc Pickup</button>}
          {currentStatus === "active" && <button onClick={() => setShowReturn(true)} className={cn(buttonVariants({ size: "sm" }), "h-7 px-2 text-xs")}>Doc Return</button>}
        </div>
      )}
      {err && <span className="text-xs text-red-400">{err}</span>}

      {showPickup && <PickupDocumentationForm bookingId={bookingId} onSuccess={() => { setShowPickup(false); setCurrentStatus("active") }} onCancel={() => setShowPickup(false)} />}
      {showReturn && <ReturnDocumentationForm bookingId={bookingId} onSuccess={() => { setShowReturn(false); setCurrentStatus("completed") }} onCancel={() => setShowReturn(false)} />}
    </>
  )
}
