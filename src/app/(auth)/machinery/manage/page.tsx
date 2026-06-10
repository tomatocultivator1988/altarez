"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn, formatCurrency } from "@/lib/utils"
import { MACHINERY_STATUSES, MACHINERY_TYPES } from "@/lib/constants"
import Link from "next/link"
import { Tractor, Pencil, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"

export default function ManageMachineryPage() {
  const [machinery, setMachinery] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setLoading(false)
      const { data } = await supabase.from("machinery").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
      setMachinery(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete(id: string) {
    await supabase.from("machinery").delete().eq("id", id)
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
        <div className="space-y-3">
          {machinery.map((m) => {
            const status = MACHINERY_STATUSES[m.status as keyof typeof MACHINERY_STATUSES]
            return (
              <div key={m.id as string} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    <Tractor className="size-6 text-white/40" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{m.machine_name as string}</h3>
                      <Badge className={status?.color}>{status?.label}</Badge>
                    </div>
                    <p className="text-sm text-white/50">
                      {MACHINERY_TYPES.find((t) => t.value === m.machine_type)?.label}
                      {m.rate_per_hour != null && ` \u2022 ${formatCurrency(m.rate_per_hour as number)}/hr`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/machinery/manage/${m.id}/edit`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-white/60 hover:text-white hover:bg-white/10")}>
                    <Pencil className="size-4" />
                  </Link>
                  <button onClick={() => handleDelete(m.id as string)} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-red-400 hover:text-red-300 hover:bg-red-400/10")}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
