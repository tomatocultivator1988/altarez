import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card>
        <CardHeader><CardTitle>System Settings</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Settings panel coming soon.</p></CardContent>
      </Card>
    </div>
  )
}
