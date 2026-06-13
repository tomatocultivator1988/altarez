"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { adminDeleteUser } from "@/actions/admin"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AdminUserActions({ userId }: { userId: string }) {
  const [working, setWorking] = useState(false)
  const [err, setErr] = useState("")
  const router = useRouter()

  async function handleDelete() {
    if (!window.confirm("Delete this user and all their data? This cannot be undone.")) return
    setWorking(true); setErr("")
    const res = await adminDeleteUser(userId) as { error?: string } | undefined
    if (res?.error) { setErr(res.error); setWorking(false); return }
    router.refresh()
  }

  return (
    <div className="flex gap-1 items-center">
      <button
        onClick={handleDelete}
        disabled={working}
        className={cn(buttonVariants({ size: "sm", variant: "destructive" }), "h-7 px-2 text-xs")}
      >
        {working ? "..." : "Delete"}
      </button>
      {err && <span className="text-xs text-red-400 ml-1">{err}</span>}
    </div>
  )
}
