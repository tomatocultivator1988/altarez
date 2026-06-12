"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Trash2 } from "lucide-react"
import { adminDeleteMachinery } from "@/actions/admin"

export function AdminMachineryActions({ machineryId }: { machineryId: string }) {
  const [working, setWorking] = useState(false)
  const [err, setErr] = useState("")
  const router = useRouter()

  async function handleDelete() {
    if (!window.confirm("Delete this machinery? This cannot be undone.")) return
    setWorking(true); setErr("")
    const res = await adminDeleteMachinery(machineryId) as { error?: string } | undefined
    if (res?.error) { setErr(res.error); setWorking(false); return }
    router.refresh()
  }

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={working}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-red-400 hover:text-red-300 hover:bg-red-400/10")}
      >
        {working ? <span className="text-xs">...</span> : <Trash2 className="size-4" />}
      </button>
      {err && <span className="text-xs text-red-400">{err}</span>}
    </>
  )
}
