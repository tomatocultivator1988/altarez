import type { Metadata } from "next"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tractor, Leaf, Shield } from "lucide-react"

export const metadata: Metadata = { title: "About | Agrimalachina", description: "Quality, Community, Innovation in Mina, Iloilo." }

export default function AboutPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
      <div className="absolute inset-0 backdrop-blur-sm bg-black/10" />

      <header className="relative z-20 flex h-20 items-center gap-2 border-b border-white/10 bg-black/50 px-4 backdrop-blur-lg lg:px-8">
        <Tractor className="size-6 text-primary" /><span className="text-lg font-semibold text-white">Agrimalachina</span>
        <div className="flex-1" />
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "text-white/70 hover:text-white hover:bg-white/10")}>Home</Link>
        <Link href="/login" className={cn(buttonVariants({ variant: "secondary" }))}>Log In</Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 space-y-4 sm:space-y-6 md:space-y-8 px-4 py-8 sm:py-12 md:py-16">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">About Agrimalachina</h1>
          <p className="mt-4 text-white/50">An Interactive Municipality Information System for Agricultural Machineries in Mina, Iloilo</p>
        </div>
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black/60 p-4 sm:p-6 text-center backdrop-blur-xl">
            <Shield className="mx-auto size-8 text-primary" /><h3 className="mt-3 font-semibold text-white">Quality</h3>
            <p className="mt-1 text-sm text-white/50">Reliable machinery tracking and management.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/60 p-4 sm:p-6 text-center backdrop-blur-xl">
            <Leaf className="mx-auto size-8 text-primary" /><h3 className="mt-3 font-semibold text-white">Community</h3>
            <p className="mt-1 text-sm text-white/50">Built for the farmers of Mina, connecting growers with equipment owners.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/60 p-4 sm:p-6 text-center backdrop-blur-xl">
            <Tractor className="mx-auto size-8 text-primary" /><h3 className="mt-3 font-semibold text-white">Innovation</h3>
            <p className="mt-1 text-sm text-white/50">Bridging traditional farming with modern technology.</p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-5 text-center text-sm text-white/30">
        &copy; {new Date().getFullYear()} Agrimalachina. Mina, Iloilo
      </footer>
    </div>
  )
}
