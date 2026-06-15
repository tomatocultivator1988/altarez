"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Tractor, CalendarCheck, Bell, Users } from "lucide-react"
import type { UserRole } from "@/types/database"

const farmerTabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/machinery", label: "Browse", icon: Tractor },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/notifications", label: "Alerts", icon: Bell },
]

const lenderTabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/machinery/manage", label: "Machinery", icon: Tractor },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/notifications", label: "Alerts", icon: Bell },
]

const adminTabs = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/machinery", label: "Machinery", icon: Tractor },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
]

interface MobileNavProps {
  role: UserRole
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname()
  const tabs = role === "admin" ? adminTabs : role === "lender" ? lenderTabs : farmerTabs

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-white/10 bg-black/80 backdrop-blur-xl pb-safe lg:hidden">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 text-[10px] transition-colors",
              isActive ? "text-primary" : "text-white/40 hover:text-white/70"
            )}
          >
            <tab.icon className={cn("size-5", isActive && "text-primary")} />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
