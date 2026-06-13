"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { AdminUserActions } from "@/components/admin/user-actions"
import { UserDetailModal } from "@/components/admin/user-detail-modal"
import { adminGetUserDetail } from "@/actions/admin"
import { Shield, ShieldAlert, User } from "lucide-react"

const ROLE_BADGES: Record<string, string> = {
  admin: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  lender: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  farmer: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
}

interface UserRow {
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

interface UserDetail {
  email: string
  lenderProfile: Record<string, unknown> | null
  machineryCount: number
  bookingCount: number
}

export function AdminUsersTable({ users }: { users: UserRow[] }) {
  const [modal, setModal] = useState<{
    user: UserRow
    detail: UserDetail | null
  } | null>(null)

  async function openDetail(u: UserRow) {
    setModal({ user: u, detail: null })
    const res = await adminGetUserDetail(u.id) as Record<string, unknown>
    if (!res.error) setModal({ user: u, detail: res as unknown as UserDetail })
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/50">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Username</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Barangay</th>
              <th className="p-3 font-medium">Joined</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const role = u.role
              const isAdmin = role === "admin"
              return (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3">
                    <button
                      onClick={() => openDetail(u)}
                      className="font-medium text-left hover:text-primary transition-colors"
                    >
                      {u.first_name} {u.last_name}
                    </button>
                  </td>
                  <td className="p-3 text-white/50">@{u.username}</td>
                  <td className="p-3">
                    <Badge className={ROLE_BADGES[role] ?? ""}>
                      {role === "admin" ? <ShieldAlert className="mr-1 size-3 inline" /> : role === "lender" ? <Shield className="mr-1 size-3 inline" /> : <User className="mr-1 size-3 inline" />}
                      {role}
                    </Badge>
                  </td>
                  <td className="p-3 text-white/40">{u.barangay ?? "-"}</td>
                  <td className="p-3 text-white/40">{formatDate(u.created_at)}</td>
                  <td className="p-3">
                    {isAdmin ? (
                      <span className="text-xs text-white/30">—</span>
                    ) : (
                      <AdminUserActions userId={u.id} />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <UserDetailModal
          user={modal.user}
          detail={modal.detail}
          open={!!modal}
          onOpenChange={(open) => { if (!open) setModal(null) }}
        />
      )}
    </>
  )
}