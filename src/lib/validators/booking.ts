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
)

export const bookingApprovalSchema = z.object({
  booking_id: z.string().uuid(),
  action: z.enum(['approve', 'deny']),
  notes: z.string().optional(),
})

export type BookingInput = z.infer<typeof bookingSchema>
export type BookingApprovalInput = z.infer<typeof bookingApprovalSchema>
