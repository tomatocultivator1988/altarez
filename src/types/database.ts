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
export type UploadType = 'receipt' | 'machinery_image' | 'document' | 'other'

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
  rate_per_hour: number | null
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
  payment_method: string
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
