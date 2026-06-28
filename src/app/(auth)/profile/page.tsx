import { createClient } from "@/lib/supabase/server"
import { ProfileEditForm } from "@/components/profile/profile-edit-form"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile) return null

  const { data: lenderProfile } = await supabase.from("lender_profiles").select("*").eq("id", user.id).single()
  const sp = await searchParams
  const editing = sp.edit === "true"

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        {!editing && (
          <a href="?edit=true" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Edit Profile</a>
        )}
      </div>

      {editing ? (
        <ProfileEditForm profile={profile} />
      ) : (
        <>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-white/60 mb-4">Personal Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between"><span className="text-white/50 sm:min-w-[80px]">Name</span><span className="truncate">{profile.first_name} {profile.last_name}</span></div>
              <div className="flex flex-col sm:flex-row sm:justify-between"><span className="text-white/50 sm:min-w-[80px]">Username</span><span className="truncate">@{profile.username}</span></div>
              <div className="flex flex-col sm:flex-row sm:justify-between"><span className="text-white/50 sm:min-w-[80px]">Phone</span><span>{profile.phone_number || "—"}</span></div>
              <div className="flex flex-col sm:flex-row sm:justify-between"><span className="text-white/50 sm:min-w-[80px]">Role</span><span className="capitalize">{profile.role}</span></div>
              {profile.barangay && <div className="flex flex-col sm:flex-row sm:justify-between"><span className="text-white/50 sm:min-w-[80px]">Barangay</span><span>{profile.barangay}</span></div>}
              {profile.address && <div className="flex flex-col sm:flex-row sm:justify-between"><span className="text-white/50 sm:min-w-[80px]">Address</span><span>{profile.address}</span></div>}
              {profile.is_fca_member && <div className="flex flex-col sm:flex-row sm:justify-between"><span className="text-white/50 sm:min-w-[80px]">FCA Member</span><span className="text-emerald-400">Yes</span></div>}
              {lenderProfile && <div className="flex flex-col sm:flex-row sm:justify-between"><span className="text-white/50 sm:min-w-[80px]">Hectares</span><span>{lenderProfile.hectares} ha</span></div>}
              {profile.id_type && profile.id_number && <div className="flex flex-col sm:flex-row sm:justify-between"><span className="text-white/50 sm:min-w-[80px]">ID Type</span><span className="capitalize">{profile.id_type.replace(/_/g, ' ')}</span></div>}
              {profile.id_number && <div className="flex flex-col sm:flex-row sm:justify-between"><span className="text-white/50 sm:min-w-[80px]">ID Number</span><span>{profile.id_number}</span></div>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
