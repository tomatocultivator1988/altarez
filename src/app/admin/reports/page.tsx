import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <Card>
        <CardHeader><CardTitle>Analytics Dashboard</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
          <FileText className="size-12" />
          <span className="ml-4">Reports coming soon</span>
        </CardContent>
      </Card>
    </div>
  )
}
