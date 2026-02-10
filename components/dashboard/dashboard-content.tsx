"use client"

import { useState, useEffect, useCallback } from "react"
import { Ship, Users, Shield, FileStack, Loader2 } from "lucide-react"
import { PageWrapper, StatsGrid, ActivityList, QuickStatsCard } from "@/components/shared"
import type { StatCard, Activity } from "@/types"

/**
 * DashboardContent - Main dashboard component
 * 
 * Displays overview stats, recent activity, and quick status
 * Isolated for easy testing and debugging
 */
export function DashboardContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [vesselCount, setVesselCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const [roleCount, setRoleCount] = useState(0)
  const [pendingPRCount, setPendingPRCount] = useState(0)
  const [activities, setActivities] = useState<Activity[]>([])

  // Fetch data from API
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [vesselsRes, usersRes, rolesRes, prsRes] = await Promise.all([
        fetch("/api/vessels"),
        fetch("/api/users"),
        fetch("/api/roles"),
        fetch("/api/purchase-requests?status=PENDING"),
      ])

      const [vesselsData, usersData, rolesData, prsData] = await Promise.all([
        vesselsRes.json(),
        usersRes.json(),
        rolesRes.json(),
        prsRes.json(),
      ])

      if (vesselsData.success) setVesselCount(vesselsData.data.length)
      if (usersData.success) setUserCount(usersData.data.length)
      if (rolesData.success) setRoleCount(rolesData.data.length)
      if (prsData.success) setPendingPRCount(prsData.data.length)

      // Generate recent activities from latest data
      const recentActivities: Activity[] = []
      if (prsData.success && prsData.data.length > 0) {
        prsData.data.slice(0, 3).forEach((pr: { reference: string; createdAt: string }) => {
          recentActivities.push({
            id: `pr-${pr.reference}`,
            message: `Nouvelle demande d'achat: ${pr.reference}`,
            time: new Date(pr.createdAt).toLocaleString("fr-FR"),
            type: "warning",
          })
        })
      }
      setActivities(recentActivities)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])
  // Stats configuration - dynamic from API
  const stats: StatCard[] = [
    {
      title: "Total Navires",
      value: String(vesselCount),
      description: "Navires actifs dans la flotte",
      icon: Ship,
      color: "bg-blue-500/10 text-blue-600",
      trend: "Opérationnel",
    },
    {
      title: "Total Utilisateurs",
      value: String(userCount),
      description: "Membres d'équipage actifs",
      icon: Users,
      color: "bg-purple-500/10 text-purple-600",
      trend: "Actifs",
    },
    {
      title: "Rôles Actifs",
      value: String(roleCount),
      description: "Rôles configurés",
      icon: Shield,
      color: "bg-green-500/10 text-green-600",
      trend: "Configurés",
    },
    {
      title: "Demandes d'achat",
      value: String(pendingPRCount),
      description: "En attente d'approbation",
      icon: FileStack,
      color: "bg-amber-500/10 text-amber-600",
      trend: pendingPRCount > 0 ? `${pendingPRCount} en attente` : "Aucune",
    },
  ]

  // Quick stats configuration
  const quickStats = [
    { label: "Statut Flotte", value: "Opérationnel", variant: "success" as const },
    { label: "Conformité Documents", value: "100%", variant: "success" as const },
    { label: "Disponibilité Équipe", value: "100%", variant: "success" as const },
    { label: "Statut Sécurité", value: "Actif", variant: "info" as const },
  ]

  if (isLoading) {
    return (
      <PageWrapper
        title="Tableau de bord Admin"
        description="Vue d'ensemble des opérations, gestion d'équipage et conformité."
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Tableau de bord Admin"
      description="Vue d'ensemble des opérations, gestion d'équipage et conformité."
    >
      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      {/* Activity and Quick Stats */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ActivityList activities={activities} />
        </div>
        <QuickStatsCard stats={quickStats} />
      </div>
    </PageWrapper>
  )
}
