"use client"

import { useState, useEffect, useCallback } from "react"
import { PageWrapper } from "@/components/shared"
import { PurchaseRequests } from "@/components/purchase-requests/purchase-requests"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Ship, FileText, ClipboardList, Loader2 } from "lucide-react"

interface VesselInfo {
  name: string
  imo: string
  status: string
}

interface PRStats {
  total: number
  pending: number
  draft: number
}

/**
 * CapitaineContent - Captain's interface
 * 
 * Features:
 * - Purchase Requests management
 * - Overview of vessel status
 */
export function CapitaineContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [vessel, setVessel] = useState<VesselInfo | null>(null)
  const [prStats, setPRStats] = useState<PRStats>({ total: 0, pending: 0, draft: 0 })
  const [documentCount, setDocumentCount] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [vesselsRes, prsRes, docsRes] = await Promise.all([
        fetch("/api/vessels"),
        fetch("/api/purchase-requests"),
        fetch("/api/documents"),
      ])

      const [vesselsData, prsData, docsData] = await Promise.all([
        vesselsRes.json(),
        prsRes.json(),
        docsRes.json(),
      ])

      if (vesselsData.success && vesselsData.data.length > 0) {
        const v = vesselsData.data[0]
        setVessel({ name: v.name, imo: v.imo, status: v.status })
      }

      if (prsData.success) {
        const prs = prsData.data
        setPRStats({
          total: prs.length,
          pending: prs.filter((pr: { status: string }) => pr.status === "PENDING").length,
          draft: prs.filter((pr: { status: string }) => pr.status === "DRAFT").length,
        })
      }

      if (docsData.success) {
        setDocumentCount(docsData.data.length)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <PageWrapper
        title="Interface Capitaine"
        description="Gestion des demandes d'achat et supervision du navire"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Interface Capitaine"
      description="Gestion des demandes d'achat et supervision du navire"
    >
      <Tabs defaultValue="purchase-requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Ship className="w-4 h-4" />
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger value="purchase-requests" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Demandes d&apos;achat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ship className="w-5 h-5" />
                  Navire
                </CardTitle>
                <CardDescription>Informations du navire</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nom</span>
                    <span className="font-medium">{vessel?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IMO</span>
                    <span className="font-medium">{vessel?.imo || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut</span>
                    <span className="font-medium">{vessel?.status || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  PRs en cours
                </CardTitle>
                <CardDescription>Demandes d&apos;achat actives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{prStats.total}</div>
                <p className="text-sm text-muted-foreground">
                  {prStats.pending} en attente, {prStats.draft} brouillon(s)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents
                </CardTitle>
                <CardDescription>Documents récents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{documentCount}</div>
                <p className="text-sm text-muted-foreground">Documents disponibles</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="purchase-requests">
          <PurchaseRequests userRole="capitaine" />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  )
}
