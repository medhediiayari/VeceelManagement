"use client"

import { useState, useEffect, useCallback } from "react"
import { PageWrapper } from "@/components/shared"
import { PurchaseRequests } from "@/components/purchase-requests/purchase-requests"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Cog, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"

interface PRStats {
  total: number
  pending: number
  approved: number
}

/**
 * ChefMecanicienContent - Chief Mechanic's interface
 * 
 * Features:
 * - Purchase Requests management
 * - Equipment and maintenance overview
 */
export function ChefMecanicienContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [prStats, setPRStats] = useState<PRStats>({ total: 0, pending: 0, approved: 0 })
  const [vesselCount, setVesselCount] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [prsRes, vesselsRes] = await Promise.all([
        fetch("/api/purchase-requests"),
        fetch("/api/vessels"),
      ])

      const [prsData, vesselsData] = await Promise.all([
        prsRes.json(),
        vesselsRes.json(),
      ])

      if (prsData.success) {
        const prs = prsData.data
        setPRStats({
          total: prs.length,
          pending: prs.filter((pr: { status: string }) => pr.status === "PENDING").length,
          approved: prs.filter((pr: { status: string }) => pr.status === "APPROVED").length,
        })
      }

      if (vesselsData.success) {
        setVesselCount(vesselsData.data.length)
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
        title="Interface Chef Mécanicien"
        description="Gestion des demandes d'achat et maintenance des équipements"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Interface Chef Mécanicien"
      description="Gestion des demandes d'achat et maintenance des équipements"
    >
      <Tabs defaultValue="purchase-requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Cog className="w-4 h-4" />
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
                  <Cog className="w-5 h-5" />
                  Navires
                </CardTitle>
                <CardDescription>Navires sous gestion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{vesselCount}</div>
                <p className="text-sm text-muted-foreground">Navires actifs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  PRs en attente
                </CardTitle>
                <CardDescription>Demandes en cours de traitement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{prStats.pending}</div>
                <p className="text-sm text-muted-foreground">En attente d&apos;approbation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  PRs approuvées
                </CardTitle>
                <CardDescription>Demandes validées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{prStats.approved}</div>
                <p className="text-sm text-muted-foreground">Sur {prStats.total} total</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="purchase-requests">
          <PurchaseRequests userRole="chef-mecanicien" />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  )
}
