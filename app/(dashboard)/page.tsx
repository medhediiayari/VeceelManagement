import { DashboardContent } from "@/components/dashboard/dashboard-content"

/**
 * Dashboard Page
 * 
 * Uses: DashboardContent component
 * Layout: (dashboard)/layout.tsx provides sidebar and navigation
 * 
 * To troubleshoot:
 * 1. Check components/dashboard/dashboard-content.tsx for content issues
 * 2. Check app/(dashboard)/layout.tsx for layout issues
 * 3. Check components/shared/ for shared component issues
 */
export default function DashboardPage() {
  return <DashboardContent />
}
