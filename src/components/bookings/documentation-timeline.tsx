import { createAdminClient } from "@/lib/supabase/admin"
import { formatDate } from "@/lib/utils"

export async function DocumentationTimeline({ bookingId }: { bookingId: string }) {
  const admin = createAdminClient()

  const { data: booking } = await admin.from("bookings").select(
    "pickup_documented_at, pickup_documented_by, hour_meter_start, return_documented_at, return_documented_by, hour_meter_end, actual_hours, estimated_hours"
  ).eq("id", bookingId).single()

  const { data: uploads } = await admin.from("uploads").select("blob_url, upload_type, file_name").eq("booking_id", bookingId).in("upload_type", [
    "pickup_equipment", "pickup_selfie", "pickup_hour_meter",
    "return_equipment", "return_hour_meter", "return_damage",
  ]).order("created_at")

  if (!booking) return null

  const pickupEq = uploads?.filter(u => u.upload_type === "pickup_equipment") ?? []
  const pickupSelfie = uploads?.filter(u => u.upload_type === "pickup_selfie") ?? []
  const pickupMeter = uploads?.filter(u => u.upload_type === "pickup_hour_meter") ?? []
  const returnEq = uploads?.filter(u => u.upload_type === "return_equipment") ?? []
  const returnMeter = uploads?.filter(u => u.upload_type === "return_hour_meter") ?? []
  const returnDamage = uploads?.filter(u => u.upload_type === "return_damage") ?? []

  const pickupDone = !!booking.pickup_documented_at
  const returnDone = !!booking.return_documented_at

  return (
    <div className="space-y-4">
      {pickupDone ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h3 className="mb-2 font-semibold text-emerald-400">Pickup Documentation ✓</h3>
          <p className="text-sm text-white/50">{formatDate(booking.pickup_documented_at!)}</p>
          {booking.hour_meter_start != null && (
            <p className="mt-1 text-sm text-white/50">
              Hour meter start: <span className="text-white">{booking.hour_meter_start}</span>
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            {[...pickupEq, ...pickupSelfie, ...pickupMeter].map((u) => (
              <a key={u.blob_url} href={u.blob_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={u.blob_url}
                  alt={u.upload_type}
                  className="h-24 w-24 rounded-lg object-cover ring-1 ring-white/10 hover:ring-white/30 transition"
                />
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-1 font-semibold text-white/60">
            Pickup Documentation &#x23F3; Pending
          </h3>
          <p className="text-sm text-white/40">
            Photos and hour meter reading must be uploaded before this booking can be marked as Active.
          </p>
        </div>
      )}

      {returnDone ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h3 className="mb-2 font-semibold text-emerald-400">Return Documentation ✓</h3>
          <p className="text-sm text-white/50">{formatDate(booking.return_documented_at!)}</p>
          {booking.hour_meter_end != null && (
            <p className="mt-1 text-sm text-white/50">
              Hour meter end: <span className="text-white">{booking.hour_meter_end}</span>
            </p>
          )}
          {booking.actual_hours != null && (
            <p className="text-sm text-white/50">
              Actual hours: <span className="text-white">{booking.actual_hours}</span>
              {booking.estimated_hours != null && (
                <span className="text-white/40"> (Est: {booking.estimated_hours}h)</span>
              )}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            {[...returnEq, ...returnMeter, ...returnDamage].map((u) => (
              <a key={u.blob_url} href={u.blob_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={u.blob_url}
                  alt={u.upload_type}
                  className="h-24 w-24 rounded-lg object-cover ring-1 ring-white/10 hover:ring-white/30 transition"
                />
              </a>
            ))}
          </div>
        </div>
      ) : pickupDone && !returnDone ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-1 font-semibold text-white/60">
            Return Documentation &#x23F3; Pending
          </h3>
          <p className="text-sm text-white/40">
            Photos and hour meter reading must be uploaded before this booking can be marked as Completed.
          </p>
        </div>
      ) : null}
    </div>
  )
}
