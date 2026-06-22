export default function MachineryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10" style={{ backgroundImage: "url('/background.png')" }} />
      <div className="fixed inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent -z-10" />
      <div className="fixed inset-0 backdrop-blur-sm bg-black/10 -z-10" />
      <div className="relative z-0 max-w-7xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
}
