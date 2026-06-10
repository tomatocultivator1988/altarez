import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"
import { MACHINERY_STATUSES, MACHINERY_TYPES } from "@/lib/constants"
import Link from "next/link"
import { Search, Tractor, MapPin } from "lucide-react"

export const metadata: Metadata = {
  title: "Agricultural Machinery | Agrimalachina",
  description: "Browse available agricultural machinery in Mina, Iloilo.",
}

export default async function MachineryPage({
  searchParams,
}: { searchParams: Promise<{ search?: string; type?: string; status?: string }> }) {
  const supabase = await createClient()
  const sp = await searchParams

  let query = supabase
    .from("machinery")
    .select("*, owner:profiles!machinery_owner_id_fkey(first_name, last_name, username)")
    .order("created_at", { ascending: false })

  if (sp.search) query = query.ilike("machine_name", `%${sp.search}%`)
  if (sp.type) query = query.eq("machine_type", sp.type)
  if (sp.status) query = query.eq("status", sp.status)
  else query = query.eq("status", "active")

  const { data: machinery } = await query.limit(30)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Agricultural Machinery</h1>
        <Link href="/machinery/manage/new" className={cn(buttonVariants(), "gap-2")}>
          <Tractor className="size-4" /> Add Machinery
        </Link>
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          name="search"
          placeholder="Search machinery..."
          defaultValue={sp.search}
          className="h-9 max-w-xs rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <select
          name="type"
          defaultValue={sp.type}
          className="h-9 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white backdrop-blur-sm focus:border-primary/50 focus:outline-none"
        >
          <option value="">All Types</option>
          {MACHINERY_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
        </select>
        <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 transition-colors">
          <Search className="size-3.5" /> Filter
        </button>
        {(sp.search || sp.type) && (
          <Link href="/machinery" className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm text-white/50 hover:text-white transition-colors">Clear</Link>
        )}
      </form>

      {!machinery?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Tractor className="size-12 text-white/20" />
          <h3 className="mt-4 text-lg font-medium text-white/60">No machinery found</h3>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {machinery.map((m) => {
            const owner = m.owner as Record<string, string> | null
            const status = MACHINERY_STATUSES[m.status as keyof typeof MACHINERY_STATUSES]
            return (
              <Link key={m.id} href={`/machinery/${m.id}`}>
                <div className="group h-full overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
                  <div className="flex aspect-video items-center justify-center bg-white/5">
                    {m.image_url ? (
                      <img src={m.image_url} alt={m.machine_name} className="h-full w-full object-cover" />
                    ) : (
                      <Tractor className="size-12 text-white/20" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold truncate">{m.machine_name}</h3>
                      <Badge className={cn("shrink-0 text-xs", status?.color)}>{status?.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-white/50">
                      {MACHINERY_TYPES.find((t) => t.value === m.machine_type)?.label ?? m.machine_type}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-white/40">
                      {m.rate_per_hour != null && <span>{formatCurrency(m.rate_per_hour)}/hr</span>}
                      {m.barangay && <span className="flex items-center gap-1"><MapPin className="size-3" />{m.barangay}</span>}
                    </div>
                    {owner && <p className="mt-2 text-xs text-white/30">by {owner.first_name} {owner.last_name}</p>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
