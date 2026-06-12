"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { adminUpdateUserRole, adminDeleteUser } from "@/actions/admin"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn, formatDate } from "@/lib/utils"
import { Shield, ShieldAlert, User } from "lucide-react"

const ROLE_BADGES: Record<string, string> = {
  admin: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  lender: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  farmer: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [working, setWorking] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
      setUsers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleRoleChange(userId: string, newRole: string) {
    setError(""); setWorking(userId)
    const res = await adminUpdateUserRole(userId, newRole) as { error?: string } | undefined
    if (res?.error) { setError(res.error); setWorking(null); return }
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
    setWorking(null)
  }

  async function handleDelete(userId: string) {
    if (!window.confirm("Delete this user and all their data? This cannot be undone.")) return
    setError(""); setWorking(userId)
    const res = await adminDeleteUser(userId) as { error?: string } | undefined
    if (res?.error) { setError(res.error); setWorking(null); return }
    setUsers((prev) => prev.filter((u) => u.id !== userId))
    setWorking(null)
  }

  if (loading) return <div className="py-16 text-center text-white/40">Loading...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">User Management</h1>
      {error && <div className="rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{error}</div>}
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
              const role = u.role as string
              const isAdmin = role === "admin"
              return (
                <tr key={u.id as string} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3 font-medium">{u.first_name as string} {u.last_name as string}</td>
                  <td className="p-3 text-white/50">@{u.username as string}</td>
                  <td className="p-3">
                    <Badge className={ROLE_BADGES[role] ?? ""}>
                      {role === "admin" ? <ShieldAlert className="mr-1 size-3 inline" /> : role === "lender" ? <Shield className="mr-1 size-3 inline" /> : <User className="mr-1 size-3 inline" />}
                      {role}
                    </Badge>
                  </td>
                  <td className="p-3 text-white/40">{u.barangay as string ?? "-"}</td>
                  <td className="p-3 text-white/40">{formatDate(u.created_at as string)}</td>
                  <td className="p-3">
                    {!isAdmin && (
                      <div className="flex gap-1">
                        <select
                          defaultValue={role}
                          onChange={(e) => handleRoleChange(u.id as string, e.target.value)}
                          disabled={working === u.id}
                          className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white"
                        >
                          <option value="farmer">Farmer</option>
                          <option value="lender">Lender</option>
                        </select>
                        <button
                          onClick={() => handleDelete(u.id as string)}
                          disabled={working === u.id}
                          className={cn(buttonVariants({ size: "sm", variant: "destructive" }), "h-7 px-2 text-xs")}
                        >
                          {working === u.id ? "..." : "Delete"}
                        </button>
                      </div>
                    )}
                    {isAdmin && <span className="text-xs text-white/30">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
