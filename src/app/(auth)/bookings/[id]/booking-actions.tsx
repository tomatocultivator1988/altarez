"use client"

import { useState } from "react"
import { updateBookingStatus } from "@/actions/bookings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PickupDocumentationForm } from "@/components/bookings/pickup-documentation-form"
import { ReturnDocumentationForm } from "@/components/bookings/return-documentation-form"

export function BookingActions({ bookingId, status, isOwner, isRenter }: { bookingId: string; status: string; isOwner: boolean; isRenter: boolean }) {
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

  if (working) return <p className="text-sm text-white/40 pt-2">Updating...</p>

  return (
    <>
      {isOwner && currentStatus === "pending" && (
        <div className="flex gap-3 pt-2">
          <button onClick={() => handle("approved")} className={cn(buttonVariants(), "bg-emerald-600 hover:bg-emerald-700")}>Approve</button>
          <button onClick={() => handle("denied")} className={cn(buttonVariants({ variant: "destructive" }))}>Deny</button>
        </div>
      )}
      {isOwner && currentStatus === "approved" && (
        <button onClick={() => setShowPickup(true)} className={cn(buttonVariants({ className: "mt-2" }))}>Document Pickup → Mark as Active</button>
      )}
      {isOwner && currentStatus === "active" && (
        <button onClick={() => setShowReturn(true)} className={cn(buttonVariants({ className: "mt-2" }))}>Document Return → Mark Completed</button>
      )}
      {isRenter && (currentStatus === "pending" || currentStatus === "approved") && (
        <button onClick={() => handle("cancelled")} className={cn(buttonVariants({ variant: "outline", className: "mt-2 border-red-400/30 text-red-300 hover:bg-red-400/10" }))}>Cancel Booking</button>
      )}
      {err && <p className="text-sm text-red-400 pt-2">{err}</p>}

      {showPickup && <PickupDocumentationForm bookingId={bookingId} onSuccess={() => { setShowPickup(false); setCurrentStatus("active") }} onCancel={() => setShowPickup(false)} />}
      {showReturn && <ReturnDocumentationForm bookingId={bookingId} onSuccess={() => { setShowReturn(false); setCurrentStatus("completed") }} onCancel={() => setShowReturn(false)} />}
    </>
  )
}
