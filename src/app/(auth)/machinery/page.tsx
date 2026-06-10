import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Agricultural Machinery | Agrimalachina",
  description: "Browse available agricultural machinery — 4WD tractors, harvesters, tillers, and more for rent in Mina, Iloilo.",
}

import { createClient } from "@/lib/supabase/server"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MACHINERY_STATUSES, MACHINERY_TYPES } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Search, Tractor, MapPin } from "lucide-react"

export default async function MachineryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; status?: string }>
}) {
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
          <Tractor className="size-4" />
          Add Machinery
        </Link>
      </div>

      <form className="flex flex-wrap gap-3">
        <Input name="search" placeholder="Search machinery..." defaultValue={sp.search} className="max-w-xs" />
        <select name="type" defaultValue={sp.type} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All Types</option>
          {MACHINERY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          <Search className="mr-1 size-4" />
          Filter
        </Button>
        {sp.search || sp.type ? (
          <Link href="/machinery" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Clear</Link>
        ) : null}
      </form>

      {!machinery?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Tractor className="size-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No machinery found</h3>
          <p className="text-sm text-muted-foreground">No agricultural machinery listed yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {machinery.map((m) => (
            <Link key={m.id} href={`/machinery/${m.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="aspect-video w-full rounded-t-lg bg-muted flex items-center justify-center">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.machine_name} className="h-full w-full rounded-t-lg object-cover" />
                  ) : (
                    <Tractor className="size-12 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold truncate">{m.machine_name}</h3>
                    <Badge className={cn("shrink-0", MACHINERY_STATUSES[m.status as keyof typeof MACHINERY_STATUSES]?.color)}>
                      {MACHINERY_STATUSES[m.status as keyof typeof MACHINERY_STATUSES]?.label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {MACHINERY_TYPES.find((t) => t.value === m.machine_type)?.label ?? m.machine_type}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    {m.rate_per_hour != null && <span>{formatCurrency(m.rate_per_hour)}/hr</span>}
                    {m.barangay && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" /> {m.barangay}
                      </span>
                    )}
                  </div>
                  {(m.owner as Record<string, string> | null) && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      by {(m.owner as Record<string, string>).first_name} {(m.owner as Record<string, string>).last_name}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
