"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateBookingStatus } from "@/actions/bookings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AdminBookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const [working, setWorking] = useState(false)
  const [err, setErr] = useState("")
  const router = useRouter()

  async function handle(s: string) {
    setWorking(true); setErr("")
    const res = await updateBookingStatus(bookingId, s) as { error?: string } | undefined
    if (res?.error) { setErr(res.error); setWorking(false); return }
    router.refresh()
  }

  if (working) return <span className="text-xs text-white/40">...</span>

  const showable = !["completed", "denied", "cancelled"].includes(status)

  return (
    <>
      {showable && (
        <div className="flex gap-1">
          {status === "pending" && (
            <>
              <button onClick={() => handle("approved")} className={cn(buttonVariants({ size: "sm" }), "bg-emerald-600 hover:bg-emerald-700 h-7 px-2 text-xs")}>Approve</button>
              <button onClick={() => handle("denied")} className={cn(buttonVariants({ size: "sm", variant: "destructive" }), "h-7 px-2 text-xs")}>Deny</button>
            </>
          )}
          {status === "approved" && <button onClick={() => handle("active")} className={cn(buttonVariants({ size: "sm" }), "h-7 px-2 text-xs")}>Activate</button>}
          {status === "active" && <button onClick={() => handle("completed")} className={cn(buttonVariants({ size: "sm" }), "h-7 px-2 text-xs")}>Complete</button>}
        </div>
      )}
      {err && <span className="text-xs text-red-400">{err}</span>}
    </>
  )
}
