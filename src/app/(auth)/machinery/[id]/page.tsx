import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency } from "@/lib/utils"
import { MACHINERY_STATUSES, MACHINERY_TYPES } from "@/lib/constants"
import Link from "next/link"
import { Tractor, MapPin, Clock, User, Calendar } from "lucide-react"

export default async function MachineryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: m } = await supabase
    .from("machinery")
    .select("*, owner:profiles!machinery_owner_id_fkey(first_name, last_name, username, phone_number, barangay)")
    .eq("id", id)
    .single()

  if (!m) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Tractor className="size-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Machinery not found</h3>
        <Link href="/machinery" className="mt-2 text-sm text-primary hover:underline">Back to list</Link>
      </div>
    )
  }

  const typeLabel = MACHINERY_TYPES.find((t) => t.value === m.machine_type)?.label ?? m.machine_type
  const status = MACHINERY_STATUSES[m.status as keyof typeof MACHINERY_STATUSES]
  const owner = m.owner as Record<string, string> | null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/machinery" className="text-sm text-muted-foreground hover:underline">&larr; Back to machinery</Link>

      <Card>
        <div className="aspect-video w-full rounded-t-lg bg-muted flex items-center justify-center">
          {m.image_url ? (
            <img src={m.image_url} alt={m.machine_name} className="h-full w-full rounded-t-lg object-cover" />
          ) : (
            <Tractor className="size-16 text-muted-foreground" />
          )}
        </div>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{m.machine_name}</CardTitle>
              <p className="mt-1 text-muted-foreground">{typeLabel}</p>
            </div>
            <Badge className={cn("shrink-0 text-sm", status?.color)}>{status?.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {m.rate_per_hour != null && (
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span className="font-medium">{formatCurrency(m.rate_per_hour)}</span>
                <span className="text-muted-foreground">/ hour</span>
              </div>
            )}
            {m.hectares_capacity != null && (
              <div>
                <span className="font-medium">{m.hectares_capacity} ha</span>
                <span className="text-muted-foreground"> capacity</span>
              </div>
            )}
            {m.barangay && (
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                <span>{m.barangay}</span>
              </div>
            )}
            {m.serial_number && (
              <div>
                <span className="text-muted-foreground">Serial: </span>
                <span className="font-medium">{m.serial_number}</span>
              </div>
            )}
          </div>

          <Separator />

          {owner && (
            <div>
              <h4 className="text-sm font-medium">Owner</h4>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <User className="size-4 text-muted-foreground" />
                <span>{owner.first_name} {owner.last_name}</span>
                {owner.username && <span className="text-muted-foreground">(@{owner.username})</span>}
              </div>
            </div>
          )}

          {m.status === "active" && (
            <Link
              href={`/bookings/new/${m.id}`}
              className={cn(buttonVariants({ size: "lg" }), "w-full gap-2")}
            >
              <Calendar className="size-4" />
              Request Rental
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
