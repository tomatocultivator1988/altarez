import { z } from 'zod'

export const bookingSchema = z.object({
  machinery_id: z.string().uuid(),
  starting_date: z.string().min(1, 'Start date is required'),
  ending_date: z.string().min(1, 'End date is required'),
  requested_hectares: z.number().min(0).optional(),
  estimated_hours: z.number().min(0).optional(),
  notes: z.string().optional(),
}).refine(
  (data) => new Date(data.ending_date) >= new Date(data.starting_date),
  { message: 'End date must be after start date', path: ['ending_date'] }
).refine(
  (data) => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    return data.starting_date >= today
  },
  { message: 'Start date cannot be in the past', path: ['starting_date'] }
)

export type BookingInput = z.infer<typeof bookingSchema>
