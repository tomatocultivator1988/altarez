import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Agrimalachina — Agricultural Machinery Platform",
  description: "Browse and rent agricultural machinery in Mina, Iloilo. Tractors, harvesters, tillers, and more — connecting farmers with equipment owners.",
  openGraph: {
    title: "Agrimalachina — Agricultural Machinery Platform",
    description: "Browse and rent agricultural machinery for your farming needs.",
    type: "website",
  },
}

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tractor } from "lucide-react"

const navLinkClass = cn(
  buttonVariants({ variant: "ghost" }),
  "h-8 gap-1.5 px-2.5 text-sm font-medium"
)

const ctaClass = cn(
  buttonVariants({ variant: "default", size: "lg" }),
  "h-9 gap-1.5 px-2.5"
)

const outlineCtaClass = cn(
  buttonVariants({ variant: "outline", size: "lg" }),
  "h-9 gap-1.5 px-2.5"
)

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-primary/20 bg-primary px-4 text-primary-foreground lg:px-8">
        <div className="flex items-center gap-2">
          <Tractor className="size-6" />
          <span className="text-lg font-semibold">Agrimalachina</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/" className={cn(navLinkClass, "text-primary-foreground hover:bg-primary-foreground/10")}>Home</Link>
          <Link href="/about" className={cn(navLinkClass, "text-primary-foreground hover:bg-primary-foreground/10")}>About</Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "secondary" }), "h-8")}>Login</Link>
        </nav>
      </header>

      <main
        className="flex flex-1 flex-col items-center justify-center px-4 text-center bg-cover bg-center"
        style={{ backgroundImage: "url('/background.png')" }}
      >
        <div className="relative z-10 -mt-16 max-w-2xl rounded-xl bg-background/80 px-8 py-12 shadow-lg backdrop-blur-sm">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            WELCOME TO AGRIMALACHINA!
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Welcome to the Machinery Page! Explore a wide range of advanced agricultural machinery
            tailored to make farming easier and more productive. From harvesters to transplanters,
            our equipment is designed to support every stage of the farming process.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/register" className={ctaClass}>Get Started</Link>
            <Link href="/machinery" className={outlineCtaClass}>Browse Machinery</Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-primary/20 bg-primary py-6 text-center text-sm text-primary-foreground/80">
        &copy; {new Date().getFullYear()} Agrimalachina. Mina, Iloilo.
      </footer>
    </div>
  )
}
