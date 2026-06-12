"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"
import { Bell, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50)
      setNotifications(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) return <div className="py-16 text-center text-white/40">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1 text-sm text-primary/70 hover:text-primary transition-colors">
            <CheckCheck className="size-4" /> Mark all read ({unreadCount})
          </button>
        )}
      </div>
      {!notifications.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/40">
          <Bell className="size-12" /><span className="mt-3">No notifications</span>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id as string}
              onClick={() => !n.is_read && markRead(n.id as string)}
              className={cn(
                "rounded-xl border p-4 backdrop-blur-sm transition-colors cursor-pointer",
                n.is_read ? "border-white/5 bg-white/5" : "border-primary/30 bg-primary/5"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm">{n.title as string}</h4>
                  <p className="text-sm text-white/50 mt-0.5">{n.message as string}</p>
                  <p className="mt-1 text-xs text-white/30">{formatDate(n.created_at as string)}</p>
                </div>
                {!n.is_read && (
                  <button onClick={(e) => { e.stopPropagation(); markRead(n.id as string) }} className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                    Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
