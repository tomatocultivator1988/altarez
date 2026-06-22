export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm space-y-4">
        <h3 className="text-sm font-medium text-white/60">System Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Platform</span>
            <span>Agrimalachina v1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Database</span>
            <span>Supabase PostgreSQL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Storage</span>
            <span>Vercel Blob</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Hosting</span>
            <span>Vercel</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Anomaly Threshold</span>
            <span>50% over declared hours</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm space-y-4">
        <h3 className="text-sm font-medium text-white/60">Pricing Configuration</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Pricing Model</span>
            <span>Per Hectare (rate_per_hectare)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Deposit Rate</span>
            <span>30% of total booking amount</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Strike Limit</span>
            <span>3 strikes = permanent ban</span>
          </div>
        </div>
      </div>
    </div>
  )
}
