"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, LogOut, Menu, User } from "lucide-react"

interface HeaderProps {
  user: {
    firstName: string
    lastName: string
    username: string
    avatarUrl: string | null
  }
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const iconBtnClass = cn(buttonVariants({ variant: "ghost", size: "icon" }))

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-black/40 backdrop-blur-lg px-4 lg:px-6">
      <button className={cn(iconBtnClass, "lg:hidden")}>
        <Menu className="size-5" />
      </button>
      <div className="flex-1" />
      <Link href="/notifications" className={iconBtnClass}>
        <Bell className="size-5" />
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}
        >
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block">{user.firstName}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            render={<Link href="/profile" />}
            className="cursor-pointer"
          >
            <User className="mr-2 size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
            <LogOut className="mr-2 size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
