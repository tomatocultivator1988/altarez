import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Tractor } from "lucide-react"

export const metadata: Metadata = {
  title: "Agrimalachina — Agricultural Machinery Platform",
  description:
    "Browse and rent agricultural machinery in Mina, Iloilo. Tractors, harvesters, tillers, and more — connecting farmers with equipment owners.",
  openGraph: {
    title: "Agrimalachina — Agricultural Machinery Platform",
    description: "Browse and rent agricultural machinery for your farming needs.",
    type: "website",
  },
}

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Hero Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')" }}
      />

      {/* Cinematic gradient overlay — dark left, clear right where tractor is */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      {/* Transparent Navigation */}
      <header className="relative z-20 flex h-20 items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5 text-white">
          <Tractor className="size-7" />
          <span className="text-xl font-semibold tracking-tight">Agrimalachina</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            About Us
          </Link>
          <Link
            href="/login"
            className="ml-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            Log In
            <ArrowRight className="size-3.5" />
          </Link>
        </nav>
      </header>

      {/* Hero Content — left-aligned, vertically centered */}
      <main className="relative z-10 flex flex-1 items-center px-6 lg:px-12">
        <div className="max-w-xl lg:max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary/90">
            Mina, Iloilo
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-6xl lg:leading-[1.05]">
            WELCOME TO
            <br />
            <span className="text-primary">AGRIMALACHINA</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/70 lg:text-lg">
            Explore a wide range of advanced agricultural machinery tailored to make farming
            easier and more productive. From harvesters to transplanters, our equipment
            supports every stage of the farming process.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/machinery"
              className="group inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              Explore Machinery
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-7 py-3.5 text-base font-medium text-white transition-all hover:border-white/50 hover:bg-white/10 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/60 py-5 text-center text-sm text-white/40">
        &copy; {new Date().getFullYear()} Agrimalachina. Mina, Iloilo — Agricultural Machinery Platform
      </footer>
    </div>
  )
}
