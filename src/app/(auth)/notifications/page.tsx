import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Bell } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {!notifications?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="size-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No notifications</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={cn(!n.is_read && "border-primary/30 bg-primary/5")}>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm">{n.title}</h4>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
