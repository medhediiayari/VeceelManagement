"use client"

import { LayoutDashboard, Ship, Shield, Users, FileStack, Settings, HelpCircle, LogOut, ChevronLeft, ChevronRight, Anchor } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, createContext, useContext } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Create context for sidebar collapse state
const SidebarContext = createContext<{
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Ship, label: "Vessels", href: "/vessels" },
  { icon: Shield, label: "Roles", href: "/roles" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: FileStack, label: "Documents", href: "/documents" },
]

const generalItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
  { icon: LogOut, label: "Logout", href: "/logout", danger: true },
]

function NavItem({ 
  item, 
  isActive, 
  isCollapsed 
}: { 
  item: typeof menuItems[0] & { danger?: boolean }
  isActive: boolean
  isCollapsed: boolean 
}) {
  const content = (
    <Link
      href={item.href}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
          : item.danger
          ? "text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        isCollapsed && "justify-center px-2",
      )}
    >
      <item.icon className={cn(
        "w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200",
        isActive && "scale-110"
      )} />
      {!isCollapsed && (
        <span className="truncate">{item.label}</span>
      )}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}

export function Sidebar({ isCollapsed = false, onToggle }: { isCollapsed?: boolean; onToggle?: () => void } = {}) {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen flex flex-col bg-card border-r border-border/50 transition-all duration-300 ease-in-out z-40",
          isCollapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-border/50",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Anchor className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Veceel
              </span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/" className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
              <Anchor className="w-5 h-5 text-primary" />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-6">
            {/* Main Navigation */}
            <div>
              {!isCollapsed && (
                <p className="text-[11px] font-semibold text-muted-foreground/70 mb-2 px-3 uppercase tracking-wider">
                  Navigation
                </p>
              )}
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <NavItem
                    key={item.label}
                    item={item}
                    isActive={pathname === item.href}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </nav>
            </div>

            {/* Separator */}
            <div className="h-px bg-border/50 mx-2" />

            {/* General */}
            <div>
              {!isCollapsed && (
                <p className="text-[11px] font-semibold text-muted-foreground/70 mb-2 px-3 uppercase tracking-wider">
                  General
                </p>
              )}
              <nav className="space-y-1">
                {generalItems.map((item) => (
                  <NavItem
                    key={item.label}
                    item={item}
                    isActive={pathname === item.href}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Collapse Toggle */}
        {onToggle && (
          <div className="p-3 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn(
                "w-full h-9 rounded-xl hover:bg-secondary transition-colors",
                isCollapsed && "px-0"
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  <span className="text-sm">Collapse</span>
                </>
              )}
            </Button>
          </div>
        )}
      </aside>
    </TooltipProvider>
  )
}
