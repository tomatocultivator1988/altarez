"use client"

import { useActionState, useRef, useState } from "react"
import { createMachinery, updateMachinery } from "@/actions/machinery"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MACHINERY_TYPES, MACHINERY_STATUSES } from "@/lib/constants"
import { AlertCircle, ImageIcon, Upload, X } from "lucide-react"
import Link from "next/link"

const initialState = { error: "" }

interface MachineryFormProps {
  machinery?: {
    id: string; machine_name: string; machine_type: string; description: string | null
    serial_number: string | null; hectares_capacity: number | null
    rate_per_hectare: number | null; barangay: string | null; image_url: string | null; status: string
  }
}

const inputClass = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
const labelClass = "mb-1 block text-sm font-medium text-white/70"

export function MachineryForm({ machinery }: MachineryFormProps) {
  const isEdit = !!machinery
  const action = isEdit
    ? (_s: typeof initialState, fd: FormData) => updateMachinery(machinery!.id, fd)
    : createMachinery as unknown as (_s: typeof initialState, fd: FormData) => Promise<typeof initialState>

  const [state, formAction, pending] = useActionState(action, initialState)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(machinery?.image_url ?? null)
  const [existingImageUrl, setExistingImageUrl] = useState<string>(machinery?.image_url ?? "")

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
    }
  }

  function clearImage() {
    setPreview(null)
    setExistingImageUrl("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h2 className="text-xl font-bold mb-6">{isEdit ? "Edit Machinery" : "Add Machinery"}</h2>
      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/15 p-3 text-sm text-red-300 backdrop-blur-sm">
            <AlertCircle className="size-4 shrink-0" /><p>{state.error}</p>
          </div>
        )}
        <div><label className={labelClass}>Machine Name *</label><input name="machine_name" required defaultValue={machinery?.machine_name} className={inputClass} /></div>
        <div>
          <label className={labelClass}>Type *</label>
          <select name="machine_type" required defaultValue={machinery?.machine_type} className={inputClass}>
            {MACHINERY_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
          </select>
        </div>
        <div><label className={labelClass}>Description</label><input name="description" defaultValue={machinery?.description ?? ""} className={inputClass} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={labelClass}>Rate per Hectare (PHP)</label><input name="rate_per_hectare" type="number" min={0} step={0.01} defaultValue={machinery?.rate_per_hectare?.toString() ?? ""} className={inputClass} /></div>
          <div><label className={labelClass}>Capacity (ha)</label><input name="hectares_capacity" type="number" min={0} step={0.01} defaultValue={machinery?.hectares_capacity?.toString() ?? ""} className={inputClass} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={labelClass}>Serial Number</label><input name="serial_number" defaultValue={machinery?.serial_number ?? ""} className={inputClass} /></div>
          <div><label className={labelClass}>Barangay</label><input name="barangay" defaultValue={machinery?.barangay ?? ""} className={inputClass} /></div>
        </div>

        <div>
          <label className={labelClass}>Image</label>
          <input type="hidden" name="existing_image_url" value={existingImageUrl} />
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/15 bg-white/5 px-4 py-6 text-white/50 transition hover:border-primary/40 hover:bg-white/10"
          >
            {preview ? (
              <div className="relative w-full max-w-xs">
                <img src={preview} alt="Preview" className="rounded-lg object-cover max-h-[300px] w-full" />
                <button type="button" onClick={(e) => { e.stopPropagation(); clearImage() }} className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"><X className="size-4" /></button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="size-10" />
                <span className="text-sm">Click to upload image</span>
                <span className="text-xs text-white/30">PNG, JPG, WebP (max 5MB)</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} name="image" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />
        </div>

        {isEdit && (
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" defaultValue={machinery?.status} className={inputClass}>
              {Object.entries(MACHINERY_STATUSES).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}
            </select>
          </div>
        )}
        <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
          <button type="submit" disabled={pending} className={cn(buttonVariants(), "gap-2")}>
            {pending ? "Saving..." : isEdit ? "Save Changes" : "Add Machinery"}
          </button>
          <Link href="/machinery/manage" className={cn(buttonVariants({ variant: "outline" }))}>Cancel</Link>
        </div>
      </form>
    </div>
  )
}
