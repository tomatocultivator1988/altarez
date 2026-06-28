"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { updateProfile } from "@/actions/auth"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export function ProfileEditForm({ profile }: { profile: Record<string, unknown> }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("")
    const form = new FormData(e.currentTarget as HTMLFormElement)
    const res = await updateProfile(form) as { error?: string } | undefined
    if (res?.error) { setError(res.error); setLoading(false); return }
    router.refresh()
    router.push("/profile")
  }

  const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none"

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm space-y-4">
      <h3 className="text-sm font-medium text-white/60">Edit Profile</h3>
      {error && <p className="rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-white/50">First Name</label>
          <input name="firstName" className={inputClass} defaultValue={profile.first_name as string} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Last Name</label>
          <input name="lastName" className={inputClass} defaultValue={profile.last_name as string} required />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-white/50">Username</label>
        <input name="username" className={inputClass} defaultValue={profile.username as string} required />
      </div>

      <div>
        <label className="mb-1 block text-xs text-white/50">Phone Number</label>
        <input name="phone_number" className={inputClass} defaultValue={(profile.phone_number as string) ?? ""} />
      </div>

      <div>
        <label className="mb-1 block text-xs text-white/50">Barangay</label>
        <input name="barangay" className={inputClass} defaultValue={(profile.barangay as string) ?? ""} />
      </div>

      <div>
        <label className="mb-1 block text-xs text-white/50">Address</label>
        <input name="address" className={inputClass} defaultValue={(profile.address as string) ?? ""} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-white/50">ID Type</label>
          <select name="idType" className={inputClass} defaultValue={(profile.id_type as string) ?? ""}>
            <option value="">Select ID Type</option>
            <option value="national_id">National ID (PhilSys)</option>
            <option value="driver_license">Driver's License</option>
            <option value="passport">Passport</option>
            <option value="umid">UMID (SSS/GSIS)</option>
            <option value="voter_id">Voter's ID</option>
            <option value="prc_id">PRC ID</option>
            <option value="postal_id">Postal ID</option>
            <option value="senior_citizen_id">Senior Citizen ID</option>
            <option value="pwd_id">PWD ID</option>
            <option value="barangay_id">Barangay ID</option>
            <option value="company_id">Company ID</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">ID Number</label>
          <input name="idNumber" className={inputClass} defaultValue={(profile.id_number as string) ?? ""} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Link href="/profile" className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>Cancel</Link>
        <button type="submit" disabled={loading} className={cn(buttonVariants(), "flex-1 bg-emerald-600 hover:bg-emerald-700")}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin inline" /> : null}
          Save Changes
        </button>
      </div>
    </form>
  )
}
