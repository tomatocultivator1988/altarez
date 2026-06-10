"use client"

import { useActionState } from "react"
import { createBooking } from "@/actions/bookings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

const initialState = { error: "" }
const inputClass = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
const labelClass = "mb-1 block text-sm font-medium text-white/70"

export default function NewBookingPage() {
  const { machineryId } = useParams<{ machineryId: string }>()
  const [state, formAction, pending] = useActionState(
    (_s: typeof initialState, fd: FormData) => createBooking(machineryId, fd), initialState
  )

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Request Rental</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/15 p-3 text-sm text-red-300">
              <AlertCircle className="size-4 shrink-0" /><p>{state.error}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Start Date *</label><input name="starting_date" type="date" required className={inputClass} /></div>
            <div><label className={labelClass}>End Date *</label><input name="ending_date" type="date" required className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Hectares</label><input name="requested_hectares" type="number" min={0} step={0.01} className={inputClass} /></div>
            <div><label className={labelClass}>Estimated Hours</label><input name="estimated_hours" type="number" min={0} className={inputClass} /></div>
          </div>
          <div><label className={labelClass}>Notes</label><input name="notes" className={inputClass} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={pending} className={cn(buttonVariants(), "gap-2")}>
              {pending ? "Submitting..." : "Submit Request"}
            </button>
            <Link href={`/machinery/${machineryId}`} className={cn(buttonVariants({ variant: "outline" }))}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
