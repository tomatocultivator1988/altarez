import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils"
import { Bell } from "lucide-react"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: notifications } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {!notifications?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/40">
          <Bell className="size-12" /><span className="mt-3">No notifications</span>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`rounded-xl border p-4 backdrop-blur-sm transition-colors ${n.is_read ? "border-white/5 bg-white/5" : "border-primary/30 bg-primary/5"}`}>
              <h4 className="font-semibold text-sm">{n.title}</h4>
              <p className="text-sm text-white/50">{n.message}</p>
              <p className="mt-1 text-xs text-white/30">{formatDate(n.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
