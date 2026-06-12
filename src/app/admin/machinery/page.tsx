"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MACHINERY_STATUSES, MACHINERY_TYPES } from "@/lib/constants"
import { Trash2 } from "lucide-react"

export default function AdminMachineryPage() {
  const [machinery, setMachinery] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("machinery")
        .select("*, owner:profiles(first_name, last_name, username)")
        .order("created_at", { ascending: false })
      setMachinery(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this machinery? This cannot be undone.")) return
    setError("")
    const supabase = createClient()
    const { error } = await supabase.from("machinery").delete().eq("id", id)
    if (error) { setError(error.message); return }
    setMachinery((prev) => prev.filter((m) => m.id !== id))
    router.refresh()
  }

  if (loading) return <div className="py-16 text-center text-white/40">Loading...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All Machinery</h1>
      {error && <div className="rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{error}</div>}
      {!machinery.length ? (
        <div className="py-16 text-center text-white/40">No machinery registered yet</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/50">
                <th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Owner</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {machinery.map((m) => {
                const status = MACHINERY_STATUSES[m.status as keyof typeof MACHINERY_STATUSES]
                const type = MACHINERY_TYPES.find((t) => t.value === m.machine_type)
                const owner = m.owner as Record<string, string> | null
                return (
                  <tr key={m.id as string} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium">{m.machine_name as string}</td>
                    <td className="p-3 text-white/50">{type?.label ?? m.machine_type as string}</td>
                    <td className="p-3"><Badge className={status?.color}>{status?.label}</Badge></td>
                    <td className="p-3 text-white/40">{owner?.first_name} {owner?.last_name}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(m.id as string)}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-red-400 hover:text-red-300 hover:bg-red-400/10")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
