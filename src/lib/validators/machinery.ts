import { z } from 'zod'
import { MACHINERY_TYPES } from '@/lib/constants'

const machineTypeValues = MACHINERY_TYPES.map((t) => t.value) as [string, ...string[]]

export const machinerySchema = z.object({
  machine_name: z.string().min(2, 'Machine name is required'),
  description: z.string().optional(),
  machine_type: z.enum(machineTypeValues),
  serial_number: z.string().optional(),
  hectares_capacity: z.number().min(0).optional(),
  rate_per_hour: z.number().min(0, 'Rate must be positive').optional(),
  barangay: z.string().optional(),
  image_url: z.string().url().optional(),
})

export type MachineryInput = z.infer<typeof machinerySchema>
