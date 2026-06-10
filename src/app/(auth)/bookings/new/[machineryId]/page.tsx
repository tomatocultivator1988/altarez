"use client"

import { useActionState } from "react"
import { createBooking } from "@/actions/bookings"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

const initialState = { error: "" }

export default function NewBookingPage() {
  const { machineryId } = useParams<{ machineryId: string }>()
  const [state, formAction, pending] = useActionState(
    (_s: typeof initialState, fd: FormData) => createBooking(machineryId, fd),
    initialState
  )

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Request Rental</h1>

      <Card>
        <CardContent className="p-6">
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <p>{state.error}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starting_date">Start Date *</Label>
                <Input id="starting_date" name="starting_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ending_date">End Date *</Label>
                <Input id="ending_date" name="ending_date" type="date" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requested_hectares">Hectares</Label>
                <Input id="requested_hectares" name="requested_hectares" type="number" min={0} step={0.01} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input id="estimated_hours" name="estimated_hours" type="number" min={0} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Submitting..." : "Submit Request"}
              </Button>
              <Link href={`/machinery/${machineryId}`}
                className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm hover:bg-muted">
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
