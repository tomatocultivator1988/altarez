export const MACHINERY_TYPES = [
  { value: '4wd_tractor', label: '4WD Tractor' },
  { value: 'hand_tractor', label: 'Hand Tractor' },
  { value: 'floating_tiller', label: 'Floating Tiller' },
  { value: 'harvester', label: 'Harvester' },
  { value: 'hauling', label: 'Hauling' },
  { value: 'dryer', label: 'Dryer' },
  { value: 'miller', label: 'Miller' },
  { value: 'craft_establishment', label: 'Craft Establishment' },
] as const

export const MACHINERY_STATUSES = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  in_use: { label: 'In Use', color: 'bg-blue-100 text-blue-800' },
  maintenance: { label: 'Under Maintenance', color: 'bg-yellow-100 text-yellow-800' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
} as const

export const BOOKING_STATUSES = {
  pending: { label: 'Waiting for Approval', color: 'bg-orange-100 text-orange-800' },
  approved: { label: 'Approved — Ready to Start', color: 'bg-blue-100 text-blue-800' },
  active: { label: 'Ongoing Rental', color: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800' },
  denied: { label: 'Denied', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
} as const

export const PAYMENT_STATUSES = {
  unpaid: { label: 'Unpaid', color: 'bg-red-100 text-red-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
} as const

export const USER_ROLES = {
  farmer: { label: 'Farmer' },
  lender: { label: 'Lender' },
  admin: { label: 'Admin' },
} as const

export const DOCUMENTATION_UPLOAD_TYPES = {
  pickup_equipment:  'pickup_equipment',
  pickup_selfie:     'pickup_selfie',
  pickup_hour_meter: 'pickup_hour_meter',
  return_equipment:  'return_equipment',
  return_hour_meter: 'return_hour_meter',
  return_damage:     'return_damage',
} as const

export const REPORT_TYPES = {
  suspicious_activity: { label: 'Suspicious Activity', color: 'bg-yellow-100 text-yellow-800' },
  damage:              { label: 'Damage Report',       color: 'bg-red-100 text-red-800'    },
  subletting:          { label: 'Subletting/Sharing',   color: 'bg-orange-100 text-orange-800' },
  other:               { label: 'Other',                color: 'bg-gray-100 text-gray-800'   },
} as const

export const DISPUTE_STATUSES = {
  open:              { label: 'Open',                color: 'bg-yellow-100 text-yellow-800' },
  resolved_lender:   { label: 'Resolved — Lender',   color: 'bg-green-100 text-green-800'  },
  resolved_renter:   { label: 'Resolved — Renter',   color: 'bg-green-100 text-green-800'  },
  admin_resolved:    { label: 'Resolved — Admin',    color: 'bg-blue-100 text-blue-800'   },
} as const

export const ID_TYPES = [
  { value: 'national_id', label: 'National ID (PhilSys)' },
  { value: 'driver_license', label: "Driver's License" },
  { value: 'passport', label: 'Passport' },
  { value: 'umid', label: 'UMID (SSS/GSIS)' },
  { value: 'voter_id', label: "Voter's ID" },
  { value: 'prc_id', label: 'PRC ID' },
  { value: 'postal_id', label: 'Postal ID' },
  { value: 'senior_citizen_id', label: 'Senior Citizen ID' },
  { value: 'pwd_id', label: 'PWD ID' },
  { value: 'barangay_id', label: 'Barangay ID' },
  { value: 'company_id', label: 'Company ID' },
  { value: 'other', label: 'Other' },
] as const

export const ANOMALY_THRESHOLD = 50

export const ITEMS_PER_PAGE = 12
export const ADMIN_PAGE_SIZE = 20
