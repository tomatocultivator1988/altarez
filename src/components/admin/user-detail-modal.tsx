"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { adminUpdateUserRole, adminDeleteUser } from "@/actions/admin"
import { cn, formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Shield, ShieldAlert, User as UserIcon, Tractor, Calendar, Building, CheckCircle, XCircle, MapPin, Phone } from "lucide-react"

const ROLE_BADGES: Record<string, string> = {
  admin: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  lender: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  farmer: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
}

interface UserDetailModalProps {
  user: {
    id: string
    role: string
    first_name: string
    last_name: string
    username: string
    phone_number: string | null
    barangay: string | null
    address: string | null
    is_fca_member: boolean
    created_at: string
  }
  detail: {
    email: string
    lenderProfile: Record<string, unknown> | null
    machineryCount: number
    bookingCount: number
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailModal({ user, detail, open, onOpenChange }: UserDetailModalProps) {
  const router = useRouter()
  const [working, setWorking] = useState(false)
  const [err, setErr] = useState("")

  const isAdmin = user.role === "admin"

  async function handleRoleChange(newRole: string) {
    setWorking(true); setErr("")
    const res = await adminUpdateUserRole(user.id, newRole) as { error?: string } | undefined
    if (res?.error) { setErr(res.error); setWorking(false); return }
    router.refresh()
    onOpenChange(false)
  }

  async function handleDelete() {
    if (!window.confirm("Delete this user and all their data? This cannot be undone.")) return
    setWorking(true); setErr("")
    const res = await adminDeleteUser(user.id) as { error?: string } | undefined
    if (res?.error) { setErr(res.error); setWorking(false); return }
    router.refresh()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-gray-900 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Badge className={ROLE_BADGES[user.role] ?? ""}>
              {user.role === "admin" ? <ShieldAlert className="mr-1 size-3 inline" /> : user.role === "lender" ? <Shield className="mr-1 size-3 inline" /> : <UserIcon className="mr-1 size-3 inline" />}
              {user.role}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">{user.first_name} {user.last_name}</h3>
            <p className="text-sm text-white/50">@{user.username}</p>
            <p className="text-sm text-white/50">{detail?.email ?? "..."}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {user.phone_number && (
              <div className="flex items-center gap-2 text-white/60">
                <Phone className="size-3.5 shrink-0" />
                {user.phone_number}
              </div>
            )}
            {user.barangay && (
              <div className="flex items-center gap-2 text-white/60">
                <MapPin className="size-3.5 shrink-0" />
                {user.barangay}
              </div>
            )}
            {user.address && (
              <div className="flex items-center gap-2 text-white/60">
                <Building className="size-3.5 shrink-0" />
                {user.address}
              </div>
            )}
            <div className="flex items-center gap-2 text-white/60">
              {user.is_fca_member ? <CheckCircle className="size-3.5 text-green-400" /> : <XCircle className="size-3.5 text-red-400" />}
              FCA Member
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <Calendar className="size-3.5 shrink-0" />
              Joined {formatDate(user.created_at)}
            </div>
          </div>

          {(() => {
            const lp = detail?.lenderProfile as { hectares: number; equipment_count: number; farm_location?: string | null } | null | undefined
            if (!lp) return null
            return (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Lender Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-white/60">Hectares: <span className="text-white">{lp.hectares}</span></span>
                  <span className="text-white/60">Equipment: <span className="text-white">{lp.equipment_count}</span></span>
                  {lp.farm_location && (
                    <span className="col-span-2 text-white/60">Farm: <span className="text-white">{lp.farm_location}</span></span>
                  )}
                </div>
              </div>
            )
          })()}

          <div className="flex gap-3 text-sm">
            <div className="flex-1 rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <Tractor className="mx-auto mb-1 size-5 text-white/40" />
              <p className="text-lg font-bold">{detail?.machineryCount ?? 0}</p>
              <p className="text-xs text-white/40">Machinery</p>
            </div>
            <div className="flex-1 rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <Calendar className="mx-auto mb-1 size-5 text-white/40" />
              <p className="text-lg font-bold">{detail?.bookingCount ?? 0}</p>
              <p className="text-xs text-white/40">Bookings</p>
            </div>
          </div>

          {!isAdmin && (
            <div className="flex flex-wrap gap-2 pt-2">
              <select
                defaultValue={user.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                disabled={working}
                className="rounded border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="farmer">Farmer</option>
                <option value="lender">Lender</option>
              </select>
              <button
                onClick={handleDelete}
                disabled={working}
                className={cn(buttonVariants({ variant: "destructive" }), "h-9 px-3 text-sm")}
              >
                {working ? "..." : "Delete User"}
              </button>
            </div>
          )}

          {err && <p className="text-sm text-red-400">{err}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}