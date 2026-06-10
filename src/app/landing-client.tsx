"use client"

import { useState, useActionState } from "react"
import { login, register } from "@/actions/auth"
import Link from "next/link"
import { ArrowRight, Tractor, X, Shield } from "lucide-react"

const loginInitial = { error: "" }
const registerInitial = { error: "" }

export default function LandingClient() {
  const [showAuth, setShowAuth] = useState<"login" | "register" | null>(null)
  const [loginState, loginAction, loginPending] = useActionState(login, loginInitial)
  const [regState, regAction, regPending] = useActionState(register, registerInitial)

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

      {/* Extra darkening when auth modal is open */}
      <div
        className="pointer-events-none absolute inset-0 bg-black/20 transition-opacity duration-500"
        style={{ opacity: showAuth ? 1 : 0 }}
      />

      {/* Navigation */}
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
          <button
            onClick={() => setShowAuth("login")}
            className="ml-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            Log In
            <ArrowRight className="size-3.5" />
          </button>
        </nav>
      </header>

      {/* Hero Content — fades out when auth modal is open */}
      <main className="relative z-10 flex flex-1 items-center px-6 lg:px-12">
        <div
          className="max-w-xl transition-all duration-500 ease-out lg:max-w-2xl"
          style={{
            opacity: showAuth ? 0 : 1,
            transform: showAuth ? "translateX(-40px)" : "translateX(0)",
            pointerEvents: showAuth ? "none" : "auto",
          }}
        >
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
            <button
              onClick={() => setShowAuth("register")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-7 py-3.5 text-base font-medium text-white transition-all hover:border-white/50 hover:bg-white/10 hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Auth Modal — fades in on the left dark portion */}
        <div
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-start px-6 lg:px-12"
          style={{ opacity: showAuth ? 1 : 0 }}
        >
          <div
            className="pointer-events-auto w-full max-w-md transition-all duration-500 ease-out"
            style={{
              opacity: showAuth ? 1 : 0,
              transform: showAuth ? "translateX(0)" : "translateX(20px)",
            }}
          >
            {/* Tabs */}
            <div className="mb-6 flex gap-1 rounded-lg bg-white/10 p-1 backdrop-blur-sm">
              <button
                onClick={() => setShowAuth("login")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  showAuth === "login"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => setShowAuth("register")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  showAuth === "register"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Register
              </button>
              <button
                onClick={() => setShowAuth(null)}
                className="flex items-center justify-center rounded-md px-2 text-white/50 transition-colors hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Login Form */}
            {showAuth === "login" && (
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
                  <button type="button" onClick={() => setShowAuth("register")} className="text-primary/80 hover:text-primary">
                    Don&apos;t have an account?
                  </button>
                </p>
              </form>
            )}

            {/* Register Form */}
            {showAuth === "register" && (
              <form action={regAction} className="space-y-3">
                {regState?.error && (
                  <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
                    {regState.error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-first" className="mb-1 block text-xs font-medium text-white/70">
                      First Name
                    </label>
                    <input
                      id="reg-first"
                      name="firstName"
                      required
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-last" className="mb-1 block text-xs font-medium text-white/70">
                      Last Name
                    </label>
                    <input
                      id="reg-last"
                      name="lastName"
                      required
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="reg-user" className="mb-1 block text-xs font-medium text-white/70">
                    Username
                  </label>
                  <input
                    id="reg-user"
                    name="username"
                    required
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label htmlFor="reg-email" className="mb-1 block text-xs font-medium text-white/70">
                    Email
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-pass" className="mb-1 block text-xs font-medium text-white/70">
                      Password
                    </label>
                    <input
                      id="reg-pass"
                      name="password"
                      type="password"
                      required
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-confirm" className="mb-1 block text-xs font-medium text-white/70">
                      Confirm
                    </label>
                    <input
                      id="reg-confirm"
                      name="confirmPassword"
                      type="password"
                      required
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="reg-role" className="mb-1 block text-xs font-medium text-white/70">
                    I am a
                  </label>
                  <select
                    id="reg-role"
                    name="role"
                    defaultValue="farmer"
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="farmer">Farmer</option>
                    <option value="lender">Lender</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={regPending}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {regPending ? "Creating Account..." : "Create Account"}
                </button>
                <p className="text-center text-xs text-white/40">
                  <button type="button" onClick={() => setShowAuth("login")} className="text-primary/80 hover:text-primary">
                    Already have an account?
                  </button>
                </p>
              </form>
            )}
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
