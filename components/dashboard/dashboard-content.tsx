"use client"

import { Ship, Users, Shield, FileStack } from "lucide-react"
import { PageWrapper, StatsGrid, ActivityList, QuickStatsCard } from "@/components/shared"
import { mockActivities } from "@/data/mock-data"
import type { StatCard } from "@/types"

/**
 * DashboardContent - Main dashboard component
 * 
 * Displays overview stats, recent activity, and quick status
 * Isolated for easy testing and debugging
 */
export function DashboardContent() {
  // Stats configuration - easy to modify
  const stats: StatCard[] = [
    {
      title: "Total Vessels",
      value: "2",
      description: "Active vessels in fleet",
      icon: Ship,
      color: "bg-blue-500/10 text-blue-600",
      trend: "+0 this month",
    },
    {
      title: "Total Users",
      value: "5",
      description: "Active crew members",
      icon: Users,
      color: "bg-purple-500/10 text-purple-600",
      trend: "+1 this month",
    },
    {
      title: "Active Roles",
      value: "3",
      description: "Captain, CSO, DPA",
      icon: Shield,
      color: "bg-green-500/10 text-green-600",
      trend: "Configured",
    },
    {
      title: "Documents",
      value: "3",
      description: "Pending review",
      icon: FileStack,
      color: "bg-amber-500/10 text-amber-600",
      trend: "1 overdue",
    },
  ]

  // Quick stats configuration
  const quickStats = [
    { label: "Fleet Status", value: "Operational", variant: "success" as const },
    { label: "Documents Compliance", value: "60%", variant: "warning" as const },
    { label: "Team Availability", value: "100%", variant: "success" as const },
    { label: "Security Status", value: "Active", variant: "info" as const },
  ]

  return (
    <PageWrapper
      title="Admin Dashboard"
      description="Overview of vessel operations, crew management, and security compliance."
    >
      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      {/* Activity and Quick Stats */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ActivityList activities={mockActivities} />
        </div>
        <QuickStatsCard stats={quickStats} />
      </div>
    </PageWrapper>
  )
}
