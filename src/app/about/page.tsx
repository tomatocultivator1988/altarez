import type { Metadata } from "next"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tractor, Leaf, Shield } from "lucide-react"

export const metadata: Metadata = { title: "About | Agrimalachina", description: "Quality, Community, Innovation in Mina, Iloilo." }

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative z-20 flex h-20 items-center gap-2 border-b border-white/10 bg-black/50 px-4 backdrop-blur-lg lg:px-8">
        <Tractor className="size-6 text-primary" /><span className="text-lg font-semibold text-white">Agrimalachina</span>
        <div className="flex-1" />
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "text-white/70 hover:text-white hover:bg-white/10")}>Home</Link>
        <Link href="/login" className={cn(buttonVariants({ variant: "secondary" }))}>Log In</Link>
      </header>

      <main className="mx-auto max-w-3xl flex-1 space-y-8 px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold">About Agrimalachina</h1>
          <p className="mt-4 text-muted-foreground">An Interactive Municipality Information System for Agricultural Machineries in Mina, Iloilo</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border p-6 text-center">
            <Shield className="mx-auto size-8 text-primary" /><h3 className="mt-3 font-semibold">Quality</h3>
            <p className="mt-1 text-sm text-muted-foreground">Reliable machinery tracking and management.</p>
          </div>
          <div className="rounded-lg border p-6 text-center">
            <Leaf className="mx-auto size-8 text-primary" /><h3 className="mt-3 font-semibold">Community</h3>
            <p className="mt-1 text-sm text-muted-foreground">Built for the farmers of Mina, connecting growers with equipment owners.</p>
          </div>
          <div className="rounded-lg border p-6 text-center">
            <Tractor className="mx-auto size-8 text-primary" /><h3 className="mt-3 font-semibold">Innovation</h3>
            <p className="mt-1 text-sm text-muted-foreground">Bridging traditional farming with modern technology.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
