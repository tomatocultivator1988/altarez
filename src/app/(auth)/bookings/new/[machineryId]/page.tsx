"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { createBooking } from "@/actions/bookings"
import { createClient } from "@/lib/supabase/client"
import { buttonVariants } from "@/components/ui/button"
import { cn, formatCurrency } from "@/lib/utils"
import { AlertCircle, Tractor, Clock } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

const initialState = { error: "" }
const inputClass = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
const labelClass = "mb-1 block text-sm font-medium text-white/70"

interface MachineryInfo {
  machine_name: string
  rate_per_hectare: number | null
  hectares_capacity: number | null
  machine_type: string
}

export default function NewBookingPage() {
  const { machineryId } = useParams<{ machineryId: string }>()
  const [state, formAction, pending] = useActionState(
    (_s: typeof initialState, fd: FormData) => createBooking(machineryId, fd), initialState
  )
  const [info, setInfo] = useState<MachineryInfo | null>(null)
  const [hectares, setHectares] = useState("")
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from("machinery")
      .select("machine_name, rate_per_hectare, hectares_capacity, machine_type")
      .eq("id", machineryId)
      .single()
      .then(({ data }) => { if (data) setInfo(data as MachineryInfo) })
  }, [machineryId])

  const rate = info?.rate_per_hectare ?? null
  const capacity = info?.hectares_capacity ?? null
  const hasRate = rate != null && rate > 0
  const ha = hasRate && hectares ? Number(hectares) : null
  const computedHours = ha != null && capacity != null && capacity > 0
    ? Math.round((ha / capacity) * 100) / 100
    : null
  const computedTotal = ha != null
    ? Math.round(rate! * ha * 100) / 100
    : null

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Request Rental</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        {info && (
          <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Tractor className="size-4 text-primary" />
              <span className="font-medium text-white">{info.machine_name}</span>
            </div>
            {capacity != null && capacity > 0 && (
              <p className="text-xs text-white/40">Capacity: <span className="text-white/60">{capacity} hectares per hour</span></p>
            )}
            {hasRate ? (
              <p className="text-xs text-white/40">Rate: <span className="text-white/60">{formatCurrency(rate!)} per hectare</span></p>
            ) : (
              <p className="text-xs text-white/40">Rate: <span className="text-white/60 italic">negotiable — enter manual amount</span></p>
            )}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/15 p-3 text-sm text-red-300">
              <AlertCircle className="size-4 shrink-0" /><p>{state.error}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Start Date *</label><input name="starting_date" type="date" required className={inputClass} min={new Date().toISOString().split("T")[0]} /></div>
            <div><label className={labelClass}>End Date *</label><input name="ending_date" type="date" required className={inputClass} min={new Date().toISOString().split("T")[0]} /></div>
          </div>

          {hasRate ? (
            <>
              <div>
                <label className={labelClass}>How many hectares?</label>
                <input
                  name="requested_hectares"
                  type="number"
                  min={0}
                  step={0.01}
                  className={inputClass}
                  placeholder="e.g. 10"
                  value={hectares}
                  onChange={(e) => setHectares(e.target.value)}
                />
              </div>
              {ha != null && ha > 0 && (
                <div className="rounded-lg bg-white/5 p-3 space-y-1.5 text-sm">
                  {computedHours != null && (
                    <div className="flex items-center gap-2 text-white/50">
                      <Clock className="size-3.5" />
                      <span>Estimated: <span className="text-white font-medium">{computedHours} hours</span></span>
                    </div>
                  )}
                  {computedTotal != null && (
                    <p className="text-white/50">
                      Total: <span className="text-white font-bold text-base">{formatCurrency(computedTotal)}</span>
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div>
              <label className={labelClass}>Negotiated Total Amount (PHP)</label>
              <input name="total_amount" type="number" min={0} step={0.01} className={inputClass} placeholder="e.g. 5000" />
            </div>
          )}

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
