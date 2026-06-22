"use client"

import { useState } from "react"
import { reportMisuse } from "@/actions/bookings"
import { buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

export function ReportMisuseButton({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("")
    const form = e.currentTarget as HTMLFormElement
    const type = form.report_type.value
    const desc = form.description.value
    const res = await reportMisuse(bookingId, type, desc)
    if (res?.error) { setError(res.error); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  if (success) return <span className="text-sm text-emerald-400">Report submitted &#x2713;</span>

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-sm text-yellow-400 underline hover:text-yellow-300">
        Report Misuse
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-white/10 bg-zinc-900 text-white">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="size-5 text-yellow-400" /> Report Misuse
          </DialogTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}
            <div>
              <label className="mb-1 block text-sm text-white/60">Report Type</label>
              <select name="report_type" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" required>
                <option value="suspicious_activity">Suspicious Activity</option>
                <option value="damage">Damage Report</option>
                <option value="subletting">Subletting / Sharing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/60">Description</label>
              <textarea name="description" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" rows={4} required placeholder="Describe what happened..." />
            </div>
            <button type="submit" disabled={loading} className={cn(buttonVariants(), "w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50")}>
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
