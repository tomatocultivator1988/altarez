import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { Bell } from "lucide-react"

export default async function AdminNotificationsPage() {
  const supabase = createAdminClient()
  const { data: notifications } = await supabase.from("notifications").select("*, user:profiles(first_name)").order("created_at", { ascending: false }).limit(50)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {!notifications?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bell className="size-12" />
          <span className="mt-2">No notifications</span>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const user = n.user as Record<string, string> | null
            return (
              <Card key={n.id}>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm">{n.title}</h4>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {user?.first_name} • {formatDate(n.created_at)}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
