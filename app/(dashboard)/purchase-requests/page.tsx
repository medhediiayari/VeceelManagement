"use client"

import { useEffect, useState } from "react"
import { AdminPurchaseRequestsContent } from "@/components/purchase-requests/admin-purchase-requests-content"
import { PurchaseRequests } from "@/components/purchase-requests/purchase-requests"

/**
 * Purchase Requests Page
 * 
 * Displays different components based on user role:
 * - Shore roles (Admin/OPS/CSO/DPA/Finance/etc): AdminPurchaseRequestsContent (view all, approve/reject)
 * - Vessel crew (Capitaine/Chief Mate/Chef Mécanicien/Second/Yotna): PurchaseRequests (create/manage PRs)
 */

// Shore-based roles that see admin view
const SHORE_ROLES = ["ADMIN", "CSO", "DPA", "OPS", "FINANCE", "COMPTABILITE", "DIRECTION_TECHNIQUE", "DIRECTION_GENERALE", "COMMERCIAL"]

export default function PurchaseRequestsPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Shore roles see the admin view
  if (userRole && SHORE_ROLES.includes(userRole)) {
    return <AdminPurchaseRequestsContent />
  }

  // Vessel crew (Capitaine, Chief Mate, Chef Mécanicien, Second, Yotna) see the user view
  return <PurchaseRequests />
}
