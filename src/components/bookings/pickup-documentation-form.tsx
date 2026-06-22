"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { documentPickup } from "@/actions/bookings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ImagePlus, Loader2 } from "lucide-react"

function FilePreview({ file }: { file: File }) {
  const url = URL.createObjectURL(file)
  return <img src={url} alt="preview" className="h-20 w-20 rounded-lg object-cover" onLoad={() => URL.revokeObjectURL(url)} />
}

export function PickupDocumentationForm({ bookingId, onSuccess, onCancel }: { bookingId: string; onSuccess?: () => void; onCancel?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [equipmentPreview, setEquipmentPreview] = useState<File | null>(null)
  const [meterPreview, setMeterPreview] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<File | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("")
    const form = new FormData()
    const hourMeter = (e.currentTarget as HTMLFormElement)["hour_meter_start"]?.value
    if (hourMeter) form.append("hour_meter_start", hourMeter)
    if (equipmentPreview) form.append("photo_equipment", equipmentPreview)
    if (meterPreview) form.append("photo_hour_meter", meterPreview)
    if (selfiePreview) form.append("photo_selfie", selfiePreview)

    const res = await documentPickup(bookingId, form)
    if (res?.error) { setError(res.error); setLoading(false); return }
    setLoading(false)
    router.refresh()
    onSuccess?.()
  }

  const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white file:mr-4 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white"

  return (
    <Dialog open onOpenChange={() => onCancel?.()}>
      <DialogContent className="max-w-md border-white/10 bg-zinc-900 text-white">
        <DialogTitle className="text-lg font-semibold">Document Pickup — Before Handover</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}

          <div>
            <label className="mb-1 block text-sm text-white/60">Hour Meter Reading (if applicable)</label>
            <input name="hour_meter_start" type="number" step="0.1" min={0} className={inputClass} placeholder="e.g. 127.5" />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60">Equipment Photo *</label>
            {equipmentPreview ? (
              <div className="flex items-center gap-2">
                <FilePreview file={equipmentPreview} />
                <span className="text-xs text-white/40">{equipmentPreview.name}</span>
                <button type="button" onClick={() => setEquipmentPreview(null)} className="text-xs text-red-400">Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-4 text-sm text-white/40 hover:border-white/40">
                <ImagePlus className="size-4" /> Choose File
                <input type="file" accept="image/*" className="hidden" onChange={e => setEquipmentPreview(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60">Hour Meter Photo</label>
            {meterPreview ? (
              <div className="flex items-center gap-2">
                <FilePreview file={meterPreview} />
                <span className="text-xs text-white/40">{meterPreview.name}</span>
                <button type="button" onClick={() => setMeterPreview(null)} className="text-xs text-red-400">Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-4 text-sm text-white/40 hover:border-white/40">
                <ImagePlus className="size-4" /> Choose File
                <input type="file" accept="image/*" className="hidden" onChange={e => setMeterPreview(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60">Farmer Selfie with Equipment *</label>
            {selfiePreview ? (
              <div className="flex items-center gap-2">
                <FilePreview file={selfiePreview} />
                <span className="text-xs text-white/40">{selfiePreview.name}</span>
                <button type="button" onClick={() => setSelfiePreview(null)} className="text-xs text-red-400">Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-4 text-sm text-white/40 hover:border-white/40">
                <ImagePlus className="size-4" /> Choose File
                <input type="file" accept="image/*" className="hidden" onChange={e => setSelfiePreview(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>Cancel</button>
            <button type="submit" disabled={loading || !equipmentPreview || !selfiePreview} className={cn(buttonVariants(), "flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50")}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin inline" /> : null}
              Confirm Pickup → Mark as Active
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
