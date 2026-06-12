import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
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
        <Tractor className="size-12 text-white/20" />
        <h3 className="mt-4 text-lg font-medium text-white/60">Machinery not found</h3>
        <Link href="/machinery" className="mt-2 text-sm text-primary/80 hover:text-primary">Back to list</Link>
      </div>
    )
  }

  const typeLabel = MACHINERY_TYPES.find((t) => t.value === m.machine_type)?.label ?? m.machine_type
  const status = MACHINERY_STATUSES[m.status as keyof typeof MACHINERY_STATUSES]
  const owner = m.owner as Record<string, string> | null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/machinery" className="text-sm text-white/50 hover:text-white transition-colors">&larr; Back to machinery</Link>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex aspect-video items-center justify-center bg-white/5">
          {m.image_url ? (
            <img src={m.image_url} alt={m.machine_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/20">
              <Tractor className="size-12" />
              <span className="text-xs">No image available</span>
            </div>
          )}
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{m.machine_name}</h2>
              <p className="mt-1 text-white/50">{typeLabel}</p>
            </div>
            <Badge className={cn("text-sm", status?.color)}>{status?.label}</Badge>
          </div>

          {m.description && <p className="text-sm text-white/60">{m.description}</p>}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {m.rate_per_hour != null && (
              <div className="flex items-center gap-2"><Clock className="size-4 text-white/40" /><span className="font-medium">{formatCurrency(m.rate_per_hour)}</span><span className="text-white/40">/ hour</span></div>
            )}
            {m.hectares_capacity != null && <div><span className="font-medium">{m.hectares_capacity} ha</span><span className="text-white/40"> capacity</span></div>}
            {m.barangay && <div className="flex items-center gap-2"><MapPin className="size-4 text-white/40" /><span>{m.barangay}</span></div>}
            {m.serial_number && <div><span className="text-white/40">Serial: </span><span className="font-medium">{m.serial_number}</span></div>}
          </div>

          <div className="border-t border-white/10 pt-4">
            {owner && (
              <div>
                <p className="text-sm font-medium text-white/60">Owner</p>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <User className="size-4 text-white/40" />
                  <span>{owner.first_name} {owner.last_name}</span>
                  {owner.username && <span className="text-white/40">(@{owner.username})</span>}
                </div>
              </div>
            )}
          </div>

          {m.status === "active" && (
            <Link href={`/bookings/new/${m.id}`} className={cn(buttonVariants({ size: "lg" }), "w-full gap-2")}>
              <Calendar className="size-4" /> Request Rental
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
