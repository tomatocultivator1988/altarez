import { createClient } from "@/lib/supabase/server"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile) return null

  const { data: lenderProfile } = await supabase.from("lender_profiles").select("*").eq("id", user.id).single()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="text-sm font-medium text-white/60 mb-4">Personal Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-white/50">Name</span><span>{profile.first_name} {profile.last_name}</span></div>
          <div className="flex justify-between"><span className="text-white/50">Username</span><span>@{profile.username}</span></div>
          <div className="flex justify-between"><span className="text-white/50">Role</span><span className="capitalize">{profile.role}</span></div>
          {profile.barangay && <div className="flex justify-between"><span className="text-white/50">Barangay</span><span>{profile.barangay}</span></div>}
          {profile.is_fca_member && <div className="flex justify-between"><span className="text-white/50">FCA Member</span><span className="text-emerald-400">Yes</span></div>}
          {lenderProfile && <div className="flex justify-between"><span className="text-white/50">Hectares</span><span>{lenderProfile.hectares} ha</span></div>}
        </div>
      </div>
    </div>
  )
}
