"use client"

import { useRouter } from "next/navigation"
import { deleteMachinery, getOwnMachinery } from "@/actions/machinery"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn, formatCurrency } from "@/lib/utils"
import { MACHINERY_STATUSES, MACHINERY_TYPES } from "@/lib/constants"
import Link from "next/link"
import { Tractor, Pencil, Trash2, MapPin, Hash, Gauge, PhilippinePeso } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"

export default function ManageMachineryPage() {
  const [machinery, setMachinery] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      try {
        const data = await getOwnMachinery()
        setMachinery(data as Record<string, unknown>[])
      } catch (e) {
        console.error("Machinery load error:", e)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this machinery? This cannot be undone.")) return
    const res = await deleteMachinery(id)
    if (res?.error) { alert(res.error); return }
    setMachinery((prev) => prev.filter((m) => m.id !== id))
    router.refresh()
  }

  if (loading) return <div className="py-16 text-center text-white/40">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Machinery</h1>
        <Link href="/machinery/manage/new" className={cn(buttonVariants(), "gap-2")}>
          <Tractor className="size-4" /> Add Machinery
        </Link>
      </div>

      {!machinery.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Tractor className="size-12 text-white/20" />
          <h3 className="mt-4 text-lg font-medium text-white/60">No machinery yet</h3>
          <p className="text-sm text-white/40">Add your first agricultural machinery.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {machinery.map((m) => {
            const status = MACHINERY_STATUSES[m.status as keyof typeof MACHINERY_STATUSES]
            const type = MACHINERY_TYPES.find((t) => t.value === m.machine_type)
            return (
              <div key={m.id as string} className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
                {/* Image */}
                <div className="flex aspect-[16/9] items-center justify-center bg-white/5">
                  {m.image_url ? (
                    <Image src={m.image_url as string} alt={m.machine_name as string} width={400} height={225} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-white/20">
                      <Tractor className="size-10" />
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{m.machine_name as string}</h3>
                      <p className="text-xs text-white/50 mt-0.5">{type?.label ?? m.machine_type as string}</p>
                    </div>
                    <Badge className={cn("shrink-0", status?.color)}>{status?.label}</Badge>
                  </div>

                  {(m.description as string) && (
                    <p className="text-xs text-white/40 line-clamp-2">{m.description as string}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
                    {m.rate_per_hectare != null && (
                      <div className="flex items-center gap-1">
                        <PhilippinePeso className="size-3" />
                        <span>{formatCurrency(m.rate_per_hectare as number)}/ha</span>
                      </div>
                    )}
                    {m.hectares_capacity != null && (
                      <div className="flex items-center gap-1">
                        <Gauge className="size-3" />
                        <span>{(m.hectares_capacity as number)} ha</span>
                      </div>
                    )}
                    {(m.serial_number as string) && (
                      <div className="flex items-center gap-1">
                        <Hash className="size-3" />
                        <span className="truncate">{m.serial_number as string}</span>
                      </div>
                    )}
                    {(m.barangay as string) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        <span className="truncate">{m.barangay as string}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-white/10">
                    <Link
                      href={`/machinery/manage/${m.id}/edit`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "flex-1 gap-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10")}
                    >
                      <Pencil className="size-3.5" /> Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(m.id as string)}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "flex-1 gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10")}
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
