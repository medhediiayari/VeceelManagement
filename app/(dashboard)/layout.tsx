"use client"

import { useState, createContext, useContext, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { cn } from "@/lib/utils"

// Context for sidebar state - can be used by any child component
interface DashboardContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

const DashboardContext = createContext<DashboardContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  toggleSidebar: () => {},
})

export const useDashboard = () => useContext(DashboardContext)

// Shore-based roles (office)
const SHORE_ROLES = ["ADMIN", "CSO", "DPA", "OPS", "FINANCE", "COMPTABILITE", "DIRECTION_TECHNIQUE", "DIRECTION_GENERALE", "COMMERCIAL"]
// Vessel-based roles (crew)
const VESSEL_ROLES = ["CAPITAINE", "CHIEF_MATE", "CHEF_MECANICIEN", "SECOND", "YOTNA"]
// All roles
const ALL_ROLES = [...SHORE_ROLES, ...VESSEL_ROLES]

// Define route access by role
const routeAccessMap: Record<string, string[]> = {
  "/dashboard": SHORE_ROLES,
  "/vessels": SHORE_ROLES,
  "/roles": ["ADMIN"],
  "/users": ["ADMIN", "OPS", "DPA"],
  "/documentscso": ALL_ROLES,
  "/purchase-requests": ALL_ROLES,
  "/settings": SHORE_ROLES,
  "/help": ALL_ROLES,
  "/logout": ALL_ROLES,
}

// Get the default route for a role
const getDefaultRoute = (role: string): string => {
  if (VESSEL_ROLES.includes(role)) {
    return "/purchase-requests"
  }
  return "/dashboard"
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/auth/session")
        if (response.ok) {
          const data = await response.json()
          if (data.user?.role) {
            setUserRole(data.user.role)
          }
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUserRole()
  }, [])

  useEffect(() => {
    if (!isLoading && userRole) {
      // Check if user has access to current route
      const allowedRoles = routeAccessMap[pathname]
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect to default route for their role
        router.replace(getDefaultRoute(userRole))
      }
    }
  }, [isLoading, userRole, pathname, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DashboardContext.Provider value={{ isCollapsed, setIsCollapsed, toggleSidebar }}>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar - Desktop only */}
        <div className="hidden lg:block">
          <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
        </div>

        {/* Main Content Area */}
        <main
          className={cn(
            "flex-1 min-h-screen transition-all duration-300 ease-in-out",
            isCollapsed ? "lg:ml-[72px]" : "lg:ml-64",
          )}
        >
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </DashboardContext.Provider>
  )
}
