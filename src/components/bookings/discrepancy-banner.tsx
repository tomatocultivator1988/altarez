import { AlertTriangle } from "lucide-react"
import { ReportMisuseButton } from "./report-misuse-button"

export function DiscrepancyBanner({ bookingId, anomalyNote }: { bookingId: string; anomalyNote: string | null }) {
  if (!anomalyNote) return null

  return (
    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="size-5 shrink-0 text-yellow-400 mt-0.5" />
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-yellow-400">Usage Alert</p>
          <p className="text-yellow-200/80">{anomalyNote}</p>
          <p className="text-yellow-200/60">Possible causes: undeclared land area or equipment sharing.</p>
          <ReportMisuseButton bookingId={bookingId} />
        </div>
      </div>
    </div>
  )
}
