"use client"

import { useState, createContext, useContext } from "react"
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)

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
