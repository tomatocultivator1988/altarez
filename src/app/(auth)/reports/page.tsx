import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <Card>
        <CardHeader><CardTitle>Earnings Summary</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
          <FileText className="size-12" />
        </CardContent>
      </Card>
    </div>
  )
}
