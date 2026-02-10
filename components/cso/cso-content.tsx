"use client"

import { useState, useEffect, useCallback } from "react"
import { PageWrapper } from "@/components/shared"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, Ship, Loader2 } from "lucide-react"
import { DocumentsContent } from "@/components/documents/documents-content"

interface DashboardStats {
  vesselCount: number
  documentCount: number
  pendingPRs: number
}

interface RecentActivity {
  action: string
  detail: string
  time: string
}

/**
 * CSOContent - Company Security Officer's interface
 * 
 * Features:
 * - Documents management
 * - Security overview
 */
export function CSOContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({ vesselCount: 0, documentCount: 0, pendingPRs: 0 })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [expiringDocs, setExpiringDocs] = useState<{ name: string; days: number }[]>([])

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [vesselsRes, docsRes, prsRes] = await Promise.all([
        fetch("/api/vessels"),
        fetch("/api/documents"),
        fetch("/api/purchase-requests"),
      ])

      const [vesselsData, docsData, prsData] = await Promise.all([
        vesselsRes.json(),
        docsRes.json(),
        prsRes.json(),
      ])

      const newStats: DashboardStats = { vesselCount: 0, documentCount: 0, pendingPRs: 0 }

      if (vesselsData.success) {
        newStats.vesselCount = vesselsData.data.length
      }

      if (docsData.success) {
        newStats.documentCount = docsData.data.length
        
        // Check for expiring documents
        const now = new Date()
        const expiring = docsData.data
          .filter((doc: { expirationDate?: string }) => doc.expirationDate)
          .map((doc: { name: string; expirationDate: string }) => {
            const expDate = new Date(doc.expirationDate)
            const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            return { name: doc.name, days: diffDays }
          })
          .filter((doc: { days: number }) => doc.days > 0 && doc.days <= 30)
          .sort((a: { days: number }, b: { days: number }) => a.days - b.days)
          .slice(0, 3)
        
        setExpiringDocs(expiring)
      }

      if (prsData.success) {
        newStats.pendingPRs = prsData.data.filter((pr: { status: string }) => pr.status === "PENDING").length
        
        // Generate recent activities from PRs
        const activities: RecentActivity[] = prsData.data
          .slice(0, 3)
          .map((pr: { reference: string; status: string; createdAt: string }) => {
            const date = new Date(pr.createdAt)
            const now = new Date()
            const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
            let timeStr = ""
            if (diffHours < 1) timeStr = "Il y a moins d'1h"
            else if (diffHours < 24) timeStr = `Il y a ${diffHours}h`
            else timeStr = `Il y a ${Math.floor(diffHours / 24)} jour(s)`
            
            return {
              action: pr.status === "APPROVED" ? "PR approuvée" : pr.status === "PENDING" ? "PR en attente" : "Nouvelle PR",
              detail: pr.reference,
              time: timeStr,
            }
          })
        setRecentActivities(activities)
      }

      setStats(newStats)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculate compliance rate
  const complianceRate = stats.documentCount > 0 
    ? Math.round(((stats.documentCount - expiringDocs.length) / stats.documentCount) * 100)
    : 100

  if (isLoading) {
    return (
      <PageWrapper
        title="Interface CSO"
        description="Company Security Officer - Gestion de la sécurité maritime"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Interface CSO"
      description="Company Security Officer - Gestion de la sécurité maritime"
    >
      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Shield className="w-4 h-4" />
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Ship className="w-4 h-4" />
                  Navires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.vesselCount}</div>
                <p className="text-xs text-muted-foreground">Navires gérés</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.documentCount}</div>
                <p className="text-xs text-muted-foreground">Documents actifs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Alertes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{expiringDocs.length}</div>
                <p className="text-xs text-muted-foreground">Documents à renouveler</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Conformité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{complianceRate}%</div>
                <p className="text-xs text-muted-foreground">Taux de conformité</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Documents expirant bientôt
                </CardTitle>
                <CardDescription>Documents à renouveler dans les 30 jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expiringDocs.length > 0 ? (
                    expiringDocs.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">{doc.name}</span>
                        <span className={`text-xs ${doc.days <= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {doc.days} jours
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun document expirant prochainement
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Activité récente
                </CardTitle>
                <CardDescription>Dernières actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.detail}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune activité récente
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsContent />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  )
}
