"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  Tractor,
  CalendarCheck,
  Clock,
  User,
  Bell,
  FileText,
  Users,
  Settings,
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

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/machinery", label: "All Machinery", icon: Tractor },
  { href: "/admin/bookings", label: "All Bookings", icon: CalendarCheck },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
]

interface MobileSheetNavProps {
  role: UserRole
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSheetNav({ role, open, onOpenChange }: MobileSheetNavProps) {
  const pathname = usePathname()
  const links = role === "admin" ? adminLinks : role === "lender" ? lenderLinks : farmerLinks

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="border-r border-white/10 bg-black/95 backdrop-blur-xl text-white p-0 gap-0" showCloseButton={false}>
        <SheetHeader className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-4">
          <div className="flex items-center gap-2 flex-1">
            <Tractor className="size-6 text-primary" />
            <SheetTitle className="text-lg font-semibold text-white">Agrimalachina</SheetTitle>
          </div>
          {role === "admin" && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Admin</span>
          )}
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3" onClick={() => onOpenChange(false)}>
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "justify-start gap-3 h-9 px-2.5 text-white/70 hover:text-white hover:bg-white/10",
                  isActive && "bg-white/10 text-white font-medium"
                )}
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            )
          })}
          {role !== "admin" && (
            <>
              <Separator className="my-2 bg-white/10" />
              <Link
                href={role === "lender" ? "/machinery" : "/machinery"}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "justify-start gap-3 h-9 px-2.5 text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Tractor className="size-4" />
                Browse All Machinery
              </Link>
            </>
          )}
          {role === "admin" && (
            <>
              <Separator className="my-2 bg-white/10" />
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "justify-start gap-3 h-9 px-2.5 text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <LayoutDashboard className="size-4" />
                Switch to User View
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
