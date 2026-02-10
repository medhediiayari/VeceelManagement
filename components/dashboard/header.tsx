"use client"

import { Search, Mail, Bell, Command } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MobileNav } from "./mobile-nav"
import { useState, useEffect, type ReactNode } from "react"

interface HeaderProps {
  title: string
  description: string
  actions?: ReactNode
}

interface CurrentUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

export function Header({ title, description, actions }: HeaderProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/session")
        if (response.ok) {
          const data = await response.json()
          if (data.authenticated && data.user) {
            setCurrentUser({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              avatar: data.user.avatar,
              role: data.user.role,
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
      }
    }
    fetchUser()
  }, [])

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="space-y-6">
      {/* Top bar with search and actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <MobileNav />

          {/* Enhanced search bar */}
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Search anything..."
              className="pl-10 pr-20 h-10 text-sm bg-secondary/50 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-muted-foreground bg-background border rounded-md shadow-sm">
              <Command className="w-3 h-3" />K
            </kbd>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-secondary transition-colors"
          >
            <Mail className="w-[18px] h-[18px] text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-xl hover:bg-secondary transition-colors"
          >
            <Bell className="w-[18px] h-[18px] text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-background animate-pulse" />
          </Button>

          {/* User profile */}
          <div className="flex items-center gap-3 pl-3 ml-2 border-l border-border/50">
            <Avatar className="w-9 h-9 ring-2 ring-primary/10 transition-all hover:ring-primary/30">
              <AvatarImage src={currentUser?.avatar || "/profile.jpg"} alt={currentUser?.name || "User"} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                {currentUser?.name ? getInitials(currentUser.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-foreground leading-tight">{currentUser?.name || "Utilisateur"}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.email || ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page title section */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          {description}
        </p>
      </div>

      {/* Action buttons */}
      {actions && (
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {actions}
        </div>
      )}
    </header>
  )
}
