"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  Tractor,
  CalendarCheck,
  Clock,
  User,
  Bell,
  FileText,
} from "lucide-react"
import type { UserRole } from "@/types/database"

const farmerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/machinery", label: "Browse Machinery", icon: Tractor },
  { href: "/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/renting-history", label: "Renting History", icon: Clock },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/notifications", label: "Notifications", icon: Bell },
]

const lenderLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/machinery/manage", label: "My Machinery", icon: Tractor },
  { href: "/bookings", label: "Booking Requests", icon: CalendarCheck },
  { href: "/lending-history", label: "Lending History", icon: Clock },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/notifications", label: "Notifications", icon: Bell },
]

interface SidebarProps {
  role: UserRole
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const links = role === "lender" ? lenderLinks : farmerLinks

  return (
    <aside className="relative z-10 hidden w-64 shrink-0 border-r border-white/10 bg-black/50 backdrop-blur-lg lg:block">
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
        <Tractor className="size-6 text-primary" />
        <span className="text-lg font-semibold text-white">Agrimalachina</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {links.map((link) => {
          const isActive = pathname === link.href
          const linkClass = cn(
            buttonVariants({ variant: "ghost" }),
            "justify-start gap-3 h-8 px-2.5 text-white/70 hover:text-white hover:bg-white/10",
            isActive && "bg-white/10 text-white font-medium"
          )
          return (
            <Link key={link.href} href={link.href} className={linkClass}>
              <link.icon className="size-4" />
              {link.label}
            </Link>
          )
        })}
        <Separator className="my-2 bg-white/10" />
        <Link
          href="/machinery"
          className={cn(buttonVariants({ variant: "ghost" }), "justify-start gap-3 h-8 px-2.5 text-white/70 hover:text-white hover:bg-white/10")}
        >
          <Tractor className="size-4" />
          Browse All Machinery
        </Link>
      </nav>
    </aside>
  )
}
