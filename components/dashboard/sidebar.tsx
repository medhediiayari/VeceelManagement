"use client"

import { LayoutDashboard, Ship, Shield, Users, FileStack, Settings, HelpCircle, LogOut, ChevronLeft, ChevronRight, ShoppingCart, Anchor, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, createContext, useContext, useEffect } from "react"
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

// Shore-based roles (office)
const SHORE_ROLES = ["ADMIN", "CSO", "DPA", "OPS", "FINANCE", "COMPTABILITE", "DIRECTION_TECHNIQUE", "DIRECTION_GENERALE", "COMMERCIAL"]
// Vessel-based roles (crew)
const VESSEL_ROLES = ["CAPITAINE", "CHIEF_MATE", "CHEF_MECANICIEN", "SECOND", "YOTNA"]
// All roles
const ALL_ROLES = [...SHORE_ROLES, ...VESSEL_ROLES]

// Define all menu items with role access
const allMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", roles: SHORE_ROLES },
  { icon: Ship, label: "Vessels", href: "/vessels", roles: SHORE_ROLES },
  { icon: Shield, label: "Roles", href: "/roles", roles: ["ADMIN"] },
  { icon: Users, label: "Users", href: "/users", roles: ["ADMIN", "OPS", "DPA"] },
  { icon: FileStack, label: "Documents CSO", href: "/documentscso", roles: [...SHORE_ROLES, ...VESSEL_ROLES] },
  { icon: ShoppingCart, label: "Purchase Requests", href: "/purchase-requests", roles: ALL_ROLES },
  { icon: ClipboardList, label: "Bons de Commande", href: "/purchase-orders", roles: VESSEL_ROLES },
]

const allGeneralItems = [
  { icon: Settings, label: "Settings", href: "/settings", roles: SHORE_ROLES },
  { icon: HelpCircle, label: "Help", href: "/help", roles: ALL_ROLES },
  { icon: LogOut, label: "Logout", href: "/logout", danger: true, roles: ALL_ROLES },
]

function NavItem({ 
  item, 
  isActive, 
  isCollapsed 
}: { 
  item: typeof allMenuItems[0] & { danger?: boolean }
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
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userVessel, setUserVessel] = useState<{ id: string; name: string } | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/session")
        if (response.ok) {
          const data = await response.json()
          if (data.user?.role) {
            setUserRole(data.user.role)
            setUserName(data.user.name || null)
            setUserVessel(data.user.vessel || null)
          }
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error)
      }
    }
    fetchCurrentUser()
  }, [])

  const isVesselRole = userRole && VESSEL_ROLES.includes(userRole)

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    userRole && item.roles.includes(userRole)
  )
  const generalItems = allGeneralItems.filter(item => 
    userRole && item.roles.includes(userRole)
  )

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

        {/* Vessel Info for Vessel Roles */}
        {isVesselRole && userVessel && !isCollapsed && (
          <div className="px-4 py-3 border-b border-border/50 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Navire</p>
                <p className="text-sm font-semibold text-blue-600">{userVessel.name}</p>
              </div>
            </div>
            {userName && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{userName}</p>
            )}
          </div>
        )}
        {isVesselRole && userVessel && isCollapsed && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex justify-center py-3 border-b border-border/50 bg-blue-50/50 dark:bg-blue-950/20">
                <Ship className="w-5 h-5 text-blue-600" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>{userVessel.name}</p>
              {userName && <p className="text-xs text-muted-foreground">{userName}</p>}
            </TooltipContent>
          </Tooltip>
        )}

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
