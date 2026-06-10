"use client"

import { useActionState } from "react"
import { createMachinery, updateMachinery } from "@/actions/machinery"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MACHINERY_TYPES, MACHINERY_STATUSES } from "@/lib/constants"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

const initialState = { error: "" }

interface MachineryFormProps {
  machinery?: {
    id: string
    machine_name: string
    machine_type: string
    description: string | null
    serial_number: string | null
    hectares_capacity: number | null
    rate_per_hour: number | null
    barangay: string | null
    image_url: string | null
    status: string
  }
}

export function MachineryForm({ machinery }: MachineryFormProps) {
  const isEdit = !!machinery
  const action = isEdit
    ? (_s: typeof initialState, fd: FormData) => updateMachinery(machinery!.id, fd)
    : createMachinery as unknown as (_s: typeof initialState, fd: FormData) => Promise<typeof initialState>

  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Machinery" : "Add Machinery"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <p>{state.error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="machine_name">Machine Name *</Label>
            <Input id="machine_name" name="machine_name" required defaultValue={machinery?.machine_name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="machine_type">Type *</Label>
            <select id="machine_type" name="machine_type" required defaultValue={machinery?.machine_type}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
              {MACHINERY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" defaultValue={machinery?.description ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate_per_hour">Rate per Hour (PHP)</Label>
              <Input id="rate_per_hour" name="rate_per_hour" type="number" min={0} step={0.01} defaultValue={machinery?.rate_per_hour?.toString() ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hectares_capacity">Capacity (ha)</Label>
              <Input id="hectares_capacity" name="hectares_capacity" type="number" min={0} step={0.01} defaultValue={machinery?.hectares_capacity?.toString() ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input id="serial_number" name="serial_number" defaultValue={machinery?.serial_number ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barangay">Barangay</Label>
              <Input id="barangay" name="barangay" defaultValue={machinery?.barangay ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input id="image_url" name="image_url" type="url" placeholder="https://..." defaultValue={machinery?.image_url ?? ""} />
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" defaultValue={machinery?.status}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                {Object.entries(MACHINERY_STATUSES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Save Changes" : "Add Machinery"}
            </Button>
            <Link href="/machinery/manage" className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm hover:bg-muted">
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
