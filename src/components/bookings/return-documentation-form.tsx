"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { documentReturn } from "@/actions/bookings"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ImagePlus, Loader2 } from "lucide-react"

function FilePreview({ file }: { file: File }) {
  const url = URL.createObjectURL(file)
  return <img src={url} alt="preview" className="h-20 w-20 rounded-lg object-cover" onLoad={() => URL.revokeObjectURL(url)} />
}

export function ReturnDocumentationForm({ bookingId, onSuccess, onCancel }: { bookingId: string; onSuccess?: () => void; onCancel?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasDamage, setHasDamage] = useState(false)
  const [equipmentPreview, setEquipmentPreview] = useState<File | null>(null)
  const [meterPreview, setMeterPreview] = useState<File | null>(null)
  const [damagePreviews, setDamagePreviews] = useState<File[]>([])
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("")
    const form = new FormData()
    const hourMeter = (e.currentTarget as HTMLFormElement)["hour_meter_end"]?.value
    if (hourMeter) form.append("hour_meter_end", hourMeter)
    if (equipmentPreview) form.append("photo_equipment", equipmentPreview)
    if (meterPreview) form.append("photo_hour_meter", meterPreview)
    for (const f of damagePreviews) form.append("photo_damage", f)
    if (hasDamage) {
      const desc = (e.currentTarget as HTMLFormElement)["damage_description"]?.value
      if (desc) form.append("damage_description", desc)
      const openDisp = (e.currentTarget as HTMLFormElement)["open_dispute"]
      if (openDisp instanceof HTMLInputElement && openDisp.checked) form.append("open_dispute", "true")
    }

    const res = await documentReturn(bookingId, form)
    if (res?.error) { setError(res.error); setLoading(false); return }
    setLoading(false)
    router.refresh()
    onSuccess?.()
  }

  const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white file:mr-4 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white"

  return (
    <Dialog open onOpenChange={() => onCancel?.()}>
      <DialogContent className="max-w-md border-white/10 bg-zinc-900 text-white max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-lg font-semibold">Document Return — After Use</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}

          <div>
            <label className="mb-1 block text-sm text-white/60">Hour Meter Reading (if applicable)</label>
            <input name="hour_meter_end" type="number" step="0.1" min={0} className={inputClass} placeholder="e.g. 135.2" />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60">Equipment Photo (after use) *</label>
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
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" checked={hasDamage} onChange={e => { setHasDamage(e.target.checked); if (!e.target.checked) { setDamagePreviews([]) } }} className="rounded" />
              Equipment has damage
            </label>
          </div>

          {hasDamage && (
            <div className="space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <div>
                <label className="mb-1 block text-sm text-white/60">Damage Photos (up to 3)</label>
                {damagePreviews.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {damagePreviews.map((f, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <FilePreview file={f} />
                        <button type="button" onClick={() => setDamagePreviews(prev => prev.filter((_, j) => j !== i))} className="text-xs text-red-400">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
                {damagePreviews.length < 3 && (
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-3 text-sm text-white/40 hover:border-white/40">
                    <ImagePlus className="size-4" /> Add Damage Photo
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0]; if (f) setDamagePreviews(prev => [...prev, f])
                    }} />
                  </label>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/60">Damage Description</label>
                <textarea name="damage_description" className={inputClass} placeholder="Describe the damage..." rows={3} />
              </div>
              <label className="flex items-center gap-2 text-sm text-red-300 cursor-pointer">
                <input type="checkbox" name="open_dispute" className="rounded" />
                Open dispute for this damage
              </label>
            </div>
          )}

          <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
            <button type="button" onClick={onCancel} className={cn(buttonVariants({ variant: "outline" }), "flex-1 min-w-[80px]")}>Cancel</button>
            <button type="submit" disabled={loading || !equipmentPreview} className={cn(buttonVariants(), "flex-1 min-w-[120px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm")}>
              {loading ? <Loader2 className="mr-1 size-4 animate-spin inline" /> : null}
              Confirm Return
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
