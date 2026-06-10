"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  Users,
  Tractor,
  CalendarCheck,
  FileText,
  Settings,
  Bell,
} from "lucide-react"

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/machinery", label: "All Machinery", icon: Tractor },
  { href: "/admin/bookings", label: "All Bookings", icon: CalendarCheck },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="relative z-10 hidden w-64 shrink-0 border-r border-white/10 bg-black/50 backdrop-blur-lg lg:block">
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
        <Tractor className="size-6 text-primary" />
        <span className="text-lg font-semibold text-white">Agrimalachina</span>
        <span className="ml-auto rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Admin
        </span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {adminLinks.map((link) => {
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
          href="/dashboard"
          className={cn(buttonVariants({ variant: "ghost" }), "justify-start gap-3 h-8 px-2.5 text-white/70 hover:text-white hover:bg-white/10")}
        >
          <LayoutDashboard className="size-4" />
          Switch to User View
        </Link>
      </nav>
    </aside>
  )
}
