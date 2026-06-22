export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      lender_profiles: {
        Row: LenderProfile
        Insert: LenderProfileInsert
        Update: LenderProfileUpdate
      }
      machinery: {
        Row: Machinery
        Insert: MachineryInsert
        Update: MachineryUpdate
      }
      bookings: {
        Row: Booking
        Insert: BookingInsert
        Update: BookingUpdate
      }
      payments: {
        Row: Payment
        Insert: PaymentInsert
        Update: PaymentUpdate
      }
      notifications: {
        Row: Notification
        Insert: NotificationInsert
        Update: NotificationUpdate
      }
      uploads: {
        Row: Upload
        Insert: UploadInsert
        Update: UploadUpdate
      }
      reports: {
        Row: Report
        Insert: ReportInsert
        Update: ReportUpdate
      }
      disputes: {
        Row: Dispute
        Insert: DisputeInsert
        Update: DisputeUpdate
      }
    }
    Functions: {
      check_machinery_availability: {
        Args: {
          p_machinery_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: boolean
      }
    }
  }
}

export type UserRole = 'farmer' | 'lender' | 'admin'
export type MachineryStatus = 'active' | 'in_use' | 'maintenance' | 'inactive'
export type MachineryType =
  | '4wd_tractor'
  | 'hand_tractor'
  | 'floating_tiller'
  | 'harvester'
  | 'hauling'
  | 'dryer'
  | 'miller'
  | 'craft_establishment'
export type BookingStatus = 'pending' | 'approved' | 'active' | 'completed' | 'denied' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'
export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type UploadType = 'receipt' | 'machinery_image' | 'document' | 'other' | 'pickup_equipment' | 'pickup_selfie' | 'pickup_hour_meter' | 'return_equipment' | 'return_hour_meter' | 'return_damage'
export type ReportType = 'suspicious_activity' | 'damage' | 'subletting' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved'
export type DisputeStatus = 'open' | 'resolved_lender' | 'resolved_renter' | 'admin_resolved'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'gcash' | 'maya'

export interface Profile {
  id: string
  role: UserRole
  first_name: string
  last_name: string
  username: string
  phone_number: string | null
  is_fca_member: boolean
  barangay: string | null
  address: string | null
  avatar_url: string | null
  strikes: number
  is_banned: boolean
  banned_at: string | null
  banned_reason: string | null
  created_at: string
  updated_at: string
}

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>
export type ProfileUpdate = Partial<Omit<ProfileInsert, 'id'>>

export interface LenderProfile {
  id: string
  hectares: number
  farm_location: string | null
  equipment_count: number
  created_at: string
  updated_at: string
}

export type LenderProfileInsert = Omit<LenderProfile, 'created_at' | 'updated_at'>
export type LenderProfileUpdate = Partial<Omit<LenderProfileInsert, 'id'>>

export interface Machinery {
  id: string
  owner_id: string
  machine_name: string
  description: string | null
  machine_type: MachineryType
  status: MachineryStatus
  serial_number: string | null
  image_url: string | null
  hectares_capacity: number | null
  rate_per_hectare: number | null
  barangay: string | null
  created_at: string
  updated_at: string
}

export type MachineryInsert = Omit<Machinery, 'id' | 'created_at' | 'updated_at'>
export type MachineryUpdate = Partial<MachineryInsert>

export interface Booking {
  id: string
  machinery_id: string
  renter_id: string
  owner_id: string
  status: BookingStatus
  requested_hectares: number | null
  starting_date: string
  ending_date: string
  estimated_hours: number | null
  total_amount: number | null
  actual_hectares: number | null
  actual_hours: number | null
  hour_meter_start: number | null
  hour_meter_end: number | null
  security_deposit: number | null
  pickup_documented_at: string | null
  pickup_documented_by: string | null
  return_documented_at: string | null
  return_documented_by: string | null
  co_renter_id: string | null
  anomaly_flagged: boolean
  anomaly_note: string | null
  admin_override: boolean
  payment_status: PaymentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type BookingInsert = Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'payment_status'>
export type BookingUpdate = Partial<Omit<BookingInsert, 'machinery_id' | 'renter_id' | 'owner_id'> & { payment_status: PaymentStatus }>

export interface Payment {
  id: string
  booking_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  receipt_url: string | null
  created_at: string
}

export type PaymentInsert = Omit<Payment, 'id' | 'created_at'>
export type PaymentUpdate = Partial<Omit<PaymentInsert, 'booking_id'>>

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  link: string | null
  created_at: string
}

export type NotificationInsert = Omit<Notification, 'id' | 'created_at'>
export type NotificationUpdate = Partial<Pick<Notification, 'is_read'>>

export interface Upload {
  id: string
  user_id: string
  booking_id: string | null
  machinery_id: string | null
  file_name: string
  blob_url: string
  content_type: string | null
  file_size: number | null
  upload_type: UploadType
  created_at: string
}

export type UploadInsert = Omit<Upload, 'id' | 'created_at'>
export type UploadUpdate = Partial<Omit<UploadInsert, 'user_id'>>

export interface Report {
  id: string
  reporter_id: string
  booking_id: string
  report_type: ReportType
  description: string
  status: ReportStatus
  resolved_by: string | null
  resolution_notes: string | null
  created_at: string
  resolved_at: string | null
  updated_at: string
}

export type ReportInsert = Omit<Report, 'id' | 'created_at' | 'resolved_at' | 'updated_at'>
export type ReportUpdate = Partial<Omit<ReportInsert, 'reporter_id' | 'booking_id'> & { status: ReportStatus }>

export interface Dispute {
  id: string
  booking_id: string
  opened_by: string | null
  reason: string
  status: DisputeStatus
  resolution_notes: string | null
  resolved_by: string | null
  created_at: string
  resolved_at: string | null
  updated_at: string
}

export type DisputeInsert = Omit<Dispute, 'id' | 'created_at' | 'resolved_at' | 'updated_at'>
export type DisputeUpdate = Partial<Omit<DisputeInsert, 'booking_id'> & { status: DisputeStatus }>
