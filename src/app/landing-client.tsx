"use client"

import { useState, useActionState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { login, register } from "@/actions/auth"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ArrowRight, Tractor, X, Leaf, Shield, Users, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type ModalType = "login" | "register" | "about" | null

const loginInitial = { error: "", success: "" }
const registerInitial = { error: "", success: "" }

export default function LandingClient() {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [navOpen, setNavOpen] = useState(false)

  const handleLogin = useCallback(async (_prev: typeof loginInitial, formData: FormData) => {
    const result = await login(_prev, formData)
    if (result.success) {
      router.push(result.success)
      return result
    }
    return result
  }, [router])

  const handleRegister = useCallback(async (_prev: typeof registerInitial, formData: FormData) => {
    const result = await register(_prev, formData)
    if (result.success) {
      router.push(result.success)
      return result
    }
    return result
  }, [router])

  const [loginState, loginAction, loginPending] = useActionState(handleLogin as never, loginInitial)
  const [regState, regAction, regPending] = useActionState(handleRegister as never, registerInitial)

  const isModalOpen = activeModal !== null

  function closeModal() {
    setActiveModal(null)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Hero Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: "url('/background.png')" }}
      />

      {/* Cinematic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

      {/* Extra darkening when modal is open */}
      <div
        className="pointer-events-none absolute inset-0 bg-black/20 transition-opacity duration-500"
        style={{ opacity: isModalOpen ? 1 : 0 }}
      />

      {/* Navigation */}
      <header className="relative z-20 flex h-20 items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5 text-white">
          <Tractor className="size-7" />
          <span className="text-xl font-semibold tracking-tight">Agrimalachina</span>
        </Link>
        <nav className="flex items-center gap-1">
          <div className="hidden gap-1 lg:flex items-center">
            <button
              onClick={closeModal}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              Home
            </button>
            <button
              onClick={() => setActiveModal("about")}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              About Us
            </button>
          </div>
          <button
            onClick={() => setNavOpen(true)}
            className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <button
            onClick={() => setActiveModal("login")}
            className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 sm:px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            Log In
            <ArrowRight className="size-3.5" />
          </button>
        </nav>
      </header>

      {/* Hero Content — fades out when any modal is open */}
      <main className="relative z-10 flex flex-1 items-center px-6 lg:px-12">
        <div
          className="max-w-xl transition-all duration-500 ease-out lg:max-w-2xl"
          style={{
            opacity: isModalOpen ? 0 : 1,
            transform: isModalOpen ? "translateX(-40px)" : "translateX(0)",
            pointerEvents: isModalOpen ? "none" : "auto",
          }}
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary/90">
            Mina, Iloilo
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-6xl lg:leading-[1.05]">
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
              className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 sm:px-7 sm:py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              Explore Machinery
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              onClick={() => setActiveModal("register")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 sm:px-7 sm:py-3.5 text-base font-medium text-white transition-all hover:border-white/50 hover:bg-white/10 hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Modal Overlay — fades in on the left dark portion */}
        <div
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-start px-6 lg:px-12"
          style={{ opacity: isModalOpen ? 1 : 0 }}
        >
          <div
            className={cn(
              "pointer-events-auto w-full transition-all duration-500 ease-out overflow-y-auto max-h-[85vh]",
              activeModal === "about" ? "max-w-lg md:max-w-2xl" : "max-w-sm md:max-w-md",
              isModalOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5"
            )}
          >
            {/* Close button — top right of modal area */}
            <button
              onClick={closeModal}
              className="mb-4 ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-3.5" />
              Close
            </button>

            {/* LOGIN / REGISTER Modal */}
            {(activeModal === "login" || activeModal === "register") && (
              <>
                {/* Tabs */}
                <div className="mb-6 flex gap-1 rounded-lg bg-white/10 p-1 backdrop-blur-sm">
                  <button
                    onClick={() => setActiveModal("login")}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                      activeModal === "login"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => setActiveModal("register")}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                      activeModal === "register"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Register
                  </button>
                </div>

                {activeModal === "login" && (
                  <form action={loginAction} className="space-y-4">
                    {loginState?.error && (
                      <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
                        {loginState.error}
                      </div>
                    )}
                    <div>
                      <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-white/80">
                        Email
                      </label>
                      <input
                        id="login-email"
                        name="email"
                        type="email"
                        required
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-sm transition-colors focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-white/80">
                        Password
                      </label>
                      <input
                        id="login-password"
                        name="password"
                        type="password"
                        required
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-sm transition-colors focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="••••••••"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loginPending}
                      className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50"
                    >
                      {loginPending ? "Logging in..." : "Log In"}
                    </button>
                    <p className="text-center text-xs text-white/40">
                      <button type="button" onClick={() => setActiveModal("register")} className="text-primary/80 hover:text-primary">
                        Don&apos;t have an account?
                      </button>
                    </p>
                  </form>
                )}

                {activeModal === "register" && (
                  <form action={regAction} className="space-y-3">
                    {regState?.error && (
                      <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
                        {regState.error}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="reg-first" className="mb-1 block text-xs font-medium text-white/70">First Name</label>
                        <input id="reg-first" name="firstName" required className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div>
                        <label htmlFor="reg-last" className="mb-1 block text-xs font-medium text-white/70">Last Name</label>
                        <input id="reg-last" name="lastName" required className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="reg-user" className="mb-1 block text-xs font-medium text-white/70">Username</label>
                      <input id="reg-user" name="username" required className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label htmlFor="reg-email" className="mb-1 block text-xs font-medium text-white/70">Email</label>
                      <input id="reg-email" name="email" type="email" required className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="reg-pass" className="mb-1 block text-xs font-medium text-white/70">Password</label>
                        <input id="reg-pass" name="password" type="password" required className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div>
                        <label htmlFor="reg-confirm" className="mb-1 block text-xs font-medium text-white/70">Confirm</label>
                        <input id="reg-confirm" name="confirmPassword" type="password" required className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="reg-role" className="mb-1 block text-xs font-medium text-white/70">I am a</label>
                      <select id="reg-role" name="role" defaultValue="farmer" className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="farmer">Farmer</option>
                        <option value="lender">Lender</option>
                      </select>
                    </div>
                    <button type="submit" disabled={regPending} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50">
                      {regPending ? "Creating Account..." : "Create Account"}
                    </button>
                    <p className="text-center text-xs text-white/40">
                      <button type="button" onClick={() => setActiveModal("login")} className="text-primary/80 hover:text-primary">
                        Already have an account?
                      </button>
                    </p>
                  </form>
                )}
              </>
            )}

            {/* ABOUT Modal */}
            {activeModal === "about" && (
              <div className="space-y-6 text-white/90">
                <div>
                  <h2 className="text-2xl font-bold text-white lg:text-3xl">About Us</h2>
                  <p className="mt-4 leading-relaxed text-white/70">
                    Welcome to Agrimalachina, a groundbreaking initiative designed to empower the
                    agricultural community by bridging the technological gap between traditional
                    farming practices and modern agricultural innovations. Our mission is to provide
                    farmers in the Municipality of Mina, Iloilo, with the tools they need to increase
                    productivity and efficiency through technology-driven solutions.
                  </p>
                  <p className="mt-3 leading-relaxed text-white/70">
                    Founded as an undergraduate project by a team of passionate students at West Visayas State
                    University, College of Information and Communications Technology, Agrimalachina
                    aims to create an interactive municipality information system for agricultural
                    machineries. By addressing the challenges faced by local farmers, we envision a
                    future where agricultural practices are not only more efficient but also sustainable
                    and economically beneficial for everyone involved.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                    <Shield className="mb-3 size-6 text-primary" />
                    <h3 className="font-semibold text-white">Our Mission</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">
                      Our mission is to empower farmers by providing them with the resources they need
                      to thrive.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                    <Leaf className="mb-3 size-6 text-primary" />
                    <h3 className="font-semibold text-white">Our Vision</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">
                      We envision a community where agriculture is sustainable, efficient, and
                      economically rewarding.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                    <Users className="mb-3 size-6 text-primary" />
                    <h3 className="font-semibold text-white">Our Values</h3>
                    <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-white/60">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-primary">•</span>
                        <span><strong className="text-white/80">Commitment to Quality:</strong> We prioritize reliable, high-quality machinery.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-primary">•</span>
                        <span><strong className="text-white/80">Community Focused:</strong> Supporting local agriculture is at our core.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-primary">•</span>
                        <span><strong className="text-white/80">Innovation:</strong> We continuously offer the latest and most effective machinery.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Navigation Sheet */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="right" className="border-l border-white/10 bg-black/95 backdrop-blur-xl text-white p-0 gap-0">
          <SheetHeader className="flex h-14 shrink-0 items-center border-b border-white/10 px-4">
            <SheetTitle className="text-lg font-semibold text-white">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 p-3" onClick={() => setNavOpen(false)}>
            <button onClick={closeModal} className="rounded-lg px-4 py-3 text-left text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white">
              Home
            </button>
            <button onClick={() => { setActiveModal("about"); setNavOpen(false) }} className="rounded-lg px-4 py-3 text-left text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white">
              About Us
            </button>
            <button onClick={() => { setActiveModal("login"); setNavOpen(false) }} className="mt-2 rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground">
              Log In
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center text-sm text-white/30">
        &copy; {new Date().getFullYear()} Agrimalachina. Mina, Iloilo
      </footer>
    </div>
  )
}
