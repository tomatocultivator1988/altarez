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
  pending: { label: 'Pending', color: 'bg-orange-100 text-orange-800' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800' },
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800' },
  denied: { label: 'Denied', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
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

export const ITEMS_PER_PAGE = 12
export const ADMIN_PAGE_SIZE = 20
