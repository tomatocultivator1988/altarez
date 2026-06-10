import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  const { data: lenderProfile } = await supabase
    .from("lender_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Name:</span><span>{profile.first_name} {profile.last_name}</span></div>
          <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Username:</span><span>@{profile.username}</span></div>
          <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Role:</span><span className="capitalize">{profile.role}</span></div>
          {profile.barangay && <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Barangay:</span><span>{profile.barangay}</span></div>}
          {profile.is_fca_member && <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">FCA Member:</span><span>Yes</span></div>}
          {lenderProfile && (
            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Hectares:</span><span>{lenderProfile.hectares} ha</span></div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
