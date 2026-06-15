"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { MobileSheetNav } from "@/components/layout/mobile-sheet-nav"
import type { UserRole } from "@/types/database"

interface MobileLayoutWrapperProps {
  role: UserRole
  user: {
    firstName: string
    lastName: string
    username: string
    avatarUrl: string | null
  }
  children: React.ReactNode
}

export function MobileLayoutWrapper({ role, user, children }: MobileLayoutWrapperProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
      <Header user={user} onMenuClick={() => setSheetOpen(true)} />
      <main className="flex-1 overflow-y-auto p-3 md:p-6 pb-20 lg:pb-6">
        <div className="rounded-xl border border-white/15 bg-black/60 p-4 md:p-6 backdrop-blur-xl text-white/90">
          {children}
        </div>
      </main>
      <div className="lg:hidden">
        <MobileNav role={role} />
        <MobileSheetNav role={role} open={sheetOpen} onOpenChange={setSheetOpen} />
      </div>
    </div>
  )
}
