"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreVertical,
  Eye,
  Search,
  ShoppingCart,
  Package,
  CheckCircle,
  Ship,
  Loader2,
  Send,
  FileText,
  ClipboardList,
  Minus,
  Trash2,
  Plus,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageWrapper } from "@/components/shared"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  quantity: number
  unit: string
  rob?: number | null
  images?: string[]
  quotedPrice?: number | null
  supplierName?: string | null
  remark?: string | null
  unavailableReason?: string | null
  wasUnavailable?: boolean
  orderedQuantity?: number
}

interface PurchaseRequest {
  id: string
  reference: string
  category: string
  products: Product[]
  masterApproved: boolean
  priority: string
  notes: string | null
  vesselName: string | null
  createdByName: string | null
  createdBy: {
    id: string
    name: string
    email: string
    role: string
  } | null
  masterApprovedBy?: {
    id: string
    name: string
  } | null
  masterApprovedAt?: string | null
  // Quotation fields
  sentToQuotation?: boolean
  quotationSentAt?: string | null
  quotationSentBy?: {
    id: string
    name: string
  } | null
  quotationCompletedAt?: string | null
  quotationRemark?: string | null
  vessel: {
    id: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
}

interface Vessel {
  id: string
  name: string
}

interface PurchaseOrder {
  id: string
  reference: string
  status: string
  notes: string | null
  createdBy: {
    id: string
    name: string
    role: string
  } | null
  purchaseRequest: {
    id: string
    reference: string
    category: string
    priority: string
    vesselName: string | null
    createdByName: string | null
    createdById: string | null
    createdBy: {
      id: string
      name: string
      role: string
    } | null
    vessel: {
      id: string
      name: string
    } | null
  }
  products: Array<{
    id: string
    name: string
    originalQuantity: number
    validatedQuantity: number
    unit: string
    quotedPrice: number | null
    supplierName: string | null
    remark: string | null
  }>
  createdAt: string
  updatedAt: string
}

// Role labels
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  CSO: "CSO",
  DPA: "DPA",
  OPS: "OPS",
  FINANCE: "Finance",
  COMPTABILITE: "Comptabilité",
  DIRECTION_TECHNIQUE: "Direction Technique",
  DIRECTION_GENERALE: "Direction Générale",
  CAPITAINE: "Capitaine (Master)",
  CHIEF_MATE: "Chief Mate",
  CHEF_MECANICIEN: "Chef Mécanicien",
  SECOND: "Second",
  YOTNA: "Yotna",
  COMMERCIAL: "Commercial",
}

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  SPARE_PARTS: "Pièces de rechange",
  CONSUMABLES: "Consommables",
  SAFETY_EQUIPMENT: "Équipement de sécurité",
  TOOLS: "Outils",
  LUBRICANTS: "Lubrifiants",
  OTHER: "Autre",
}

// Priority labels and colors
const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: "Basse", color: "bg-slate-100 text-slate-800" },
  MEDIUM: { label: "Moyenne", color: "bg-blue-100 text-blue-800" },
  HIGH: { label: "Haute", color: "bg-orange-100 text-orange-800" },
  URGENT: { label: "Urgente", color: "bg-red-100 text-red-800" },
}

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function AdminPurchaseRequestsContent() {
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([])
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<string>("demands")
  const [vesselFilter, setVesselFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false)
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null)

  // Quotation form state
  const [quotationProducts, setQuotationProducts] = useState<Array<{
    id: string
    name: string
    quantity: number
    unit: string
    quotedPrice: number | null
    supplierName: string
    remark: string
    unavailableReason: string | null
  }>>([])
  const [quotationRemark, setQuotationRemark] = useState("")

  // Purchase Order (BC) state
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isBCDialogOpen, setIsBCDialogOpen] = useState(false)
  const [bcProducts, setBcProducts] = useState<Array<{
    id: string
    prProductId: string
    name: string
    originalQuantity: number
    validatedQuantity: number
    unit: string
    quotedPrice: number | null
    supplierName: string
    remark: string
    isRemoved: boolean
  }>>([])
  const [bcNotes, setBcNotes] = useState("")
  const [isViewBCDialogOpen, setIsViewBCDialogOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [prsRes, vesselsRes, sessionRes, posRes] = await Promise.all([
        fetch("/api/purchase-requests"),
        fetch("/api/vessels"),
        fetch("/api/auth/session"),
        fetch("/api/purchase-orders"),
      ])
      
      const prsData = await prsRes.json()
      const vesselsData = await vesselsRes.json()
      const sessionData = await sessionRes.json()
      const posData = await posRes.json()
      
      if (prsData.success) setPurchaseRequests(prsData.data)
      if (vesselsData.success) setVessels(vesselsData.data)
      if (posData.success) setPurchaseOrders(posData.data)
      if (sessionData.authenticated && sessionData.user) {
        setCurrentUser({ id: sessionData.user.id, name: sessionData.user.name })
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

  // Subscribe to Server-Sent Events for real-time PR updates
  // Only refresh when no dialog is open to prevent disrupting user work
  useEffect(() => {
    const eventSource = new EventSource("/api/purchase-requests/events")
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "pr-change") {
          // Only refresh if no dialog is open
          const anyDialogOpen = isViewDialogOpen || isQuotationDialogOpen || isBCDialogOpen || isViewBCDialogOpen
          if (!anyDialogOpen) {
            fetchData()
          }
        }
      } catch (error) {
        console.error("SSE parse error:", error)
      }
    }
    
    eventSource.onerror = () => {
      // Reconnect will happen automatically
      console.log("SSE connection error, will reconnect...")
    }
    
    return () => {
      eventSource.close()
    }
  }, [fetchData, isViewDialogOpen, isQuotationDialogOpen, isBCDialogOpen, isViewBCDialogOpen])

  // Stats
  const stats = useMemo(() => ({
    total: purchaseRequests.length,
    masterApproved: purchaseRequests.filter((pr) => pr.masterApproved).length,
    inQuotation: purchaseRequests.filter((pr) => pr.sentToQuotation && !pr.quotationCompletedAt).length,
    quotationCompleted: purchaseRequests.filter((pr) => pr.quotationCompletedAt).length,
  }), [purchaseRequests])

  // Filtered PRs for "Demandes d'achat" tab (not sent to quotation)
  const demandsPRs = useMemo(() => {
    return purchaseRequests.filter((pr) => {
      const matchesSearch =
        pr.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.products.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const notInQuotation = !pr.sentToQuotation
      const matchesVessel = vesselFilter === "all" || pr.vessel?.id === vesselFilter
      const matchesRole = roleFilter === "all" || pr.createdBy?.role === roleFilter
      return matchesSearch && notInQuotation && matchesVessel && matchesRole
    })
  }, [purchaseRequests, searchQuery, vesselFilter, roleFilter])

  // Filtered PRs for "Devis" tab (sent to quotation)
  const quotationPRs = useMemo(() => {
    return purchaseRequests.filter((pr) => {
      const matchesSearch =
        pr.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.products.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const inQuotation = !!pr.sentToQuotation
      const matchesVessel = vesselFilter === "all" || pr.vessel?.id === vesselFilter
      const matchesRole = roleFilter === "all" || pr.createdBy?.role === roleFilter
      return matchesSearch && inQuotation && matchesVessel && matchesRole
    })
  }, [purchaseRequests, searchQuery, vesselFilter, roleFilter])

  // Check if a PR already has a BC
  const prHasBC = useCallback((prId: string) => {
    return purchaseOrders.some((po) => po.purchaseRequest?.id === prId)
  }, [purchaseOrders])

  // Check if PR has pending (unavailable) articles
  const prHasPendingArticles = useCallback((pr: PurchaseRequest) => {
    return pr.products.some(p => p.unavailableReason)
  }, [])

  // PRs ready for BC creation (quotation completed, has available products not yet ordered)
  const readyForBCPRs = useMemo(() => {
    return purchaseRequests.filter((pr) => {
      const matchesSearch =
        pr.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.products.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const quotationCompleted = !!pr.quotationCompletedAt
      // Has at least one available product (no unavailableReason) not fully ordered
      const hasAvailableProducts = pr.products.some(p => 
        !p.unavailableReason && (p.orderedQuantity || 0) < p.quantity
      )
      const matchesVessel = vesselFilter === "all" || pr.vessel?.id === vesselFilter
      const matchesRole = roleFilter === "all" || pr.createdBy?.role === roleFilter
      return matchesSearch && quotationCompleted && hasAvailableProducts && matchesVessel && matchesRole
    })
  }, [purchaseRequests, searchQuery, vesselFilter, roleFilter])

  // PRs with pending articles (articles marked as unavailable or reactivated needing BC)
  const pendingArticlesPRs = useMemo(() => {
    return purchaseRequests.filter((pr) => {
      const matchesSearch =
        pr.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.products.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      
      // Products still unavailable
      const hasPendingProducts = pr.products.some(p => p.unavailableReason)
      // Products that were unavailable, now available, with price, but not fully ordered (need BC)
      const hasReactivatedProducts = pr.products.some(p => 
        p.wasUnavailable && !p.unavailableReason && p.quotedPrice && (p.orderedQuantity || 0) < p.quantity
      )
      const matchesVessel = vesselFilter === "all" || pr.vessel?.id === vesselFilter
      const matchesRole = roleFilter === "all" || pr.createdBy?.role === roleFilter
      return matchesSearch && (hasPendingProducts || hasReactivatedProducts) && matchesVessel && matchesRole
    })
  }, [purchaseRequests, searchQuery, vesselFilter, roleFilter])

  // Handlers
  const handleViewPR = (pr: PurchaseRequest) => {
    setSelectedPR(pr)
    setIsViewDialogOpen(true)
  }

  const handleSendToQuotation = async (prId: string) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/purchase-requests/${prId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentToQuotation: true,
          quotationSentById: currentUser?.id || null,
        }),
      })

      if (response.ok) {
        await fetchData() // Refresh data after operation
      } else {
        console.error("Failed to send to quotation:", await response.text())
      }
    } catch (error) {
      console.error("Error sending to quotation:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenQuotation = (pr: PurchaseRequest) => {
    setSelectedPR(pr)
    setQuotationProducts(
      pr.products.map((p) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        unit: p.unit,
        quotedPrice: p.quotedPrice ?? null,
        supplierName: p.supplierName ?? "",
        remark: p.remark ?? "",
        unavailableReason: p.unavailableReason ?? null,
      }))
    )
    setQuotationRemark(pr.quotationRemark ?? "")
    setIsQuotationDialogOpen(true)
  }

  // Open quotation dialog for only pending/unavailable products
  const handleOpenQuotationForPending = (pr: PurchaseRequest) => {
    setSelectedPR(pr)
    setQuotationProducts(
      pr.products
        .filter((p) => p.unavailableReason) // Only unavailable products
        .map((p) => ({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          unit: p.unit,
          quotedPrice: p.quotedPrice ?? null,
          supplierName: p.supplierName ?? "",
          remark: p.remark ?? "",
          unavailableReason: p.unavailableReason ?? null,
        }))
    )
    setQuotationRemark(pr.quotationRemark ?? "")
    setIsQuotationDialogOpen(true)
  }

  const handleSubmitQuotation = async () => {
    if (!selectedPR) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/purchase-requests/${selectedPR.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationRemark,
          quotationProducts: quotationProducts.map((p) => ({
            id: p.id,
            quotedPrice: p.quotedPrice,
            supplierName: p.supplierName,
            remark: p.remark,
            unavailableReason: p.unavailableReason,
          })),
        }),
      })

      if (response.ok) {
        setPurchaseRequests((prev) =>
          prev.map((pr) =>
            pr.id === selectedPR.id
              ? {
                  ...pr,
                  quotationCompletedAt: new Date().toISOString(),
                  quotationRemark,
                  products: pr.products.map((p) => {
                    const updated = quotationProducts.find((qp) => qp.id === p.id)
                    if (updated) {
                      // Set wasUnavailable to true if product had or has unavailableReason
                      const wasUnavailable = p.wasUnavailable || p.unavailableReason || updated.unavailableReason ? true : p.wasUnavailable
                      return {
                        ...p,
                        quotedPrice: updated.quotedPrice,
                        supplierName: updated.supplierName,
                        remark: updated.remark,
                        unavailableReason: updated.unavailableReason,
                        wasUnavailable,
                      }
                    }
                    return p
                  }),
                  updatedAt: new Date().toISOString(),
                }
              : pr
          )
        )
        setIsQuotationDialogOpen(false)
        setSelectedPR(null)
        await fetchData() // Refresh data after operation
      }
    } catch (error) {
      console.error("Error submitting quotation:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // BC Handlers
  const handleOpenBCDialog = (pr: PurchaseRequest) => {
    setSelectedPR(pr)
    // Only include products that are available (no unavailableReason) and not fully ordered
    const availableProducts = pr.products.filter(p => 
      !p.unavailableReason && (p.orderedQuantity || 0) < p.quantity
    )
    setBcProducts(
      availableProducts.map((p) => ({
        id: crypto.randomUUID(),
        prProductId: p.id,
        name: p.name,
        originalQuantity: p.quantity - (p.orderedQuantity || 0),
        validatedQuantity: p.quantity - (p.orderedQuantity || 0),
        unit: p.unit,
        quotedPrice: p.quotedPrice ?? null,
        supplierName: p.supplierName ?? "",
        remark: p.remark ?? "",
        isRemoved: false,
      }))
    )
    setBcNotes("")
    setIsBCDialogOpen(true)
  }

  // BC Handler for pending tab - only products that were previously unavailable
  const handleOpenBCDialogForPending = (pr: PurchaseRequest) => {
    setSelectedPR(pr)
    // Only include products that WERE unavailable and are NOW available
    const reactivatedProducts = pr.products.filter(p => 
      p.wasUnavailable && !p.unavailableReason && (p.orderedQuantity || 0) < p.quantity
    )
    setBcProducts(
      reactivatedProducts.map((p) => ({
        id: crypto.randomUUID(),
        prProductId: p.id,
        name: p.name,
        originalQuantity: p.quantity - (p.orderedQuantity || 0),
        validatedQuantity: p.quantity - (p.orderedQuantity || 0),
        unit: p.unit,
        quotedPrice: p.quotedPrice ?? null,
        supplierName: p.supplierName ?? "",
        remark: p.remark ?? "",
        isRemoved: false,
      }))
    )
    setBcNotes("")
    setIsBCDialogOpen(true)
  }

  const handleCreateBC = async () => {
    if (!selectedPR) return
    setIsSaving(true)
    try {
      const activeProducts = bcProducts.filter((p) => !p.isRemoved && p.validatedQuantity > 0)
      
      if (activeProducts.length === 0) {
        console.error("At least one product required")
        setIsSaving(false)
        return
      }

      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseRequestId: selectedPR.id,
          createdById: currentUser?.id || null,
          notes: bcNotes || null,
          products: activeProducts.map((p) => ({
            name: p.name,
            originalQuantity: p.originalQuantity,
            validatedQuantity: p.validatedQuantity,
            unit: p.unit,
            quotedPrice: p.quotedPrice,
            supplierName: p.supplierName,
            remark: p.remark,
            prProductId: p.prProductId,
          })),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setIsBCDialogOpen(false)
          setSelectedPR(null)
          await fetchData() // Refresh data after operation
        }
      } else {
        console.error("Failed to create BC:", await response.text())
      }
    } catch (error) {
      console.error("Error creating BC:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <PageWrapper
        title="Demandes d'achat"
        description="Gestion des demandes d'achat de tous les navires"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Demandes d'achat"
      description="Gestion des demandes d'achat de tous les navires"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total PRs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.masterApproved}</p>
                  <p className="text-xs text-muted-foreground">Approuvés Master</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Send className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inQuotation}</p>
                  <p className="text-xs text-muted-foreground">En devis</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.quotationCompleted}</p>
                  <p className="text-xs text-muted-foreground">Devis complétés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une PR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={vesselFilter} onValueChange={setVesselFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Navire" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les navires</SelectItem>
              {vessels.map((vessel) => (
                <SelectItem key={vessel.id} value={vessel.id}>
                  {vessel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="CAPITAINE">Capitaine</SelectItem>
              <SelectItem value="CHIEF_MATE">Chief Mate</SelectItem>
              <SelectItem value="CHEF_MECANICIEN">Chef Mécanicien</SelectItem>
              <SelectItem value="SECOND">Second</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs for Demands, Quotation, Pending, and BC */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="demands" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Demandes
              <Badge variant="secondary" className="ml-1">{demandsPRs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="quotation" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Devis
              <Badge variant="secondary" className="ml-1">{quotationPRs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              En attente
              <Badge variant="secondary" className={cn("ml-1", pendingArticlesPRs.length > 0 && "bg-orange-100 text-orange-800")}>{pendingArticlesPRs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="bc" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              BC
              <Badge variant="secondary" className="ml-1">{purchaseOrders.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Demandes d'achat */}
          <TabsContent value="demands" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Navire</TableHead>
                    <TableHead>Demandeur</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Produits</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Master</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demandsPRs.length > 0 ? (
                    demandsPRs.map((pr) => {
                      const priorityConfig = PRIORITY_CONFIG[pr.priority] || PRIORITY_CONFIG.MEDIUM
                      return (
                        <TableRow key={pr.id}>
                          <TableCell className="font-medium">{pr.reference}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Ship className="w-4 h-4 text-muted-foreground" />
                              <span>{pr.vessel?.name || pr.vesselName || "Navire supprimé"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{pr.createdBy?.name || pr.createdByName || "Utilisateur supprimé"}</span>
                              <span className="text-xs text-muted-foreground">{pr.createdBy?.role ? ROLE_LABELS[pr.createdBy.role] || pr.createdBy.role : ""}</span>
                            </div>
                          </TableCell>
                          <TableCell>{CATEGORY_LABELS[pr.category] || pr.category}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span>{pr.products.length} article(s)</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("font-normal", priorityConfig.color)}>
                              {priorityConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {pr.masterApproved ? (
                              <Badge className="bg-green-100 text-green-700 font-normal gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Approuvé
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-600 font-normal">
                                En attente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(pr.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewPR(pr)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleSendToQuotation(pr.id)}
                                    className="text-yellow-600"
                                    disabled={isSaving}
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Envoyer en devis
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <p className="text-muted-foreground">Aucune demande d&apos;achat en attente</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Tab: Devis (Quotation) */}
          <TabsContent value="quotation" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Navire</TableHead>
                    <TableHead>Demandeur</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Produits</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut Devis</TableHead>
                    <TableHead>Date envoi</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotationPRs.length > 0 ? (
                    quotationPRs.map((pr) => {
                      const priorityConfig = PRIORITY_CONFIG[pr.priority] || PRIORITY_CONFIG.MEDIUM
                      return (
                        <TableRow key={pr.id}>
                          <TableCell className="font-medium">{pr.reference}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Ship className="w-4 h-4 text-muted-foreground" />
                              <span>{pr.vessel?.name || pr.vesselName || "Navire supprimé"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{pr.createdBy?.name || pr.createdByName || "Utilisateur supprimé"}</span>
                              <span className="text-xs text-muted-foreground">{pr.createdBy?.role ? ROLE_LABELS[pr.createdBy.role] || pr.createdBy.role : ""}</span>
                            </div>
                          </TableCell>
                          <TableCell>{CATEGORY_LABELS[pr.category] || pr.category}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span>{pr.products.length} article(s)</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("font-normal", priorityConfig.color)}>
                              {priorityConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {pr.quotationCompletedAt ? (
                              <Badge className="bg-blue-100 text-blue-700 font-normal gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Complété
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-700 font-normal gap-1">
                                <Send className="w-3 h-3" />
                                En cours
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{pr.quotationSentAt ? formatDate(pr.quotationSentAt) : "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewPR(pr)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {!pr.quotationCompletedAt ? (
                                    <DropdownMenuItem
                                      onClick={() => handleOpenQuotation(pr)}
                                      className="text-blue-600"
                                    >
                                      <FileText className="w-4 h-4 mr-2" />
                                      Remplir devis
                                    </DropdownMenuItem>
                                  ) : (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => handleOpenQuotation(pr)}
                                        className="text-blue-600"
                                      >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Voir devis
                                      </DropdownMenuItem>
                                      {!prHasBC(pr.id) && (
                                        <DropdownMenuItem
                                          onClick={() => handleOpenBCDialog(pr)}
                                          className="text-green-600"
                                        >
                                          <ClipboardList className="w-4 h-4 mr-2" />
                                          Créer BC
                                        </DropdownMenuItem>
                                      )}
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <p className="text-muted-foreground">Aucun devis en cours</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Tab: Articles en attente */}
          <TabsContent value="pending" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence PR</TableHead>
                    <TableHead>Navire</TableHead>
                    <TableHead>Articles en attente</TableHead>
                    <TableHead>Articles réactivés</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingArticlesPRs.length > 0 ? (
                    pendingArticlesPRs.map((pr) => {
                      const pendingProducts = pr.products.filter(p => p.unavailableReason)
                      // Only show reactivated products (were unavailable, now available)
                      const reactivatedProducts = pr.products.filter(p => p.wasUnavailable && !p.unavailableReason && p.quotedPrice && (p.orderedQuantity || 0) < p.quantity)
                      return (
                        <TableRow key={pr.id} className="bg-orange-50/50">
                          <TableCell className="font-medium">{pr.reference}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Ship className="w-4 h-4 text-muted-foreground" />
                              <span>{pr.vessel?.name || pr.vesselName || "Navire"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {pendingProducts.map((p) => (
                                <div key={p.id} className="flex items-center gap-2">
                                  <Package className="w-3 h-3 text-orange-600" />
                                  <span className="text-sm">{p.name}</span>
                                  <Badge variant="destructive" className="text-xs">
                                    {p.unavailableReason === "OUT_OF_STOCK" ? "Rupture" : "Pas d'offre"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {reactivatedProducts.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {reactivatedProducts.map((p) => (
                                  <div key={p.id} className="flex items-center gap-2">
                                    <Package className="w-3 h-3 text-green-600" />
                                    <span className="text-sm">{p.name}</span>
                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                      Prêt pour BC
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(pr.updatedAt).toLocaleDateString("fr-FR")}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewPR(pr)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleOpenQuotationForPending(pr)}
                                  className="text-orange-600"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Devis (produit manquant)
                                </DropdownMenuItem>
                                {/* Show "Créer BC" if PR has reactivated products (were unavailable, now available) */}
                                {pr.products.some(p => p.wasUnavailable && !p.unavailableReason && p.quotedPrice && (p.orderedQuantity || 0) < p.quantity) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleOpenBCDialogForPending(pr)}
                                      className="text-blue-600"
                                    >
                                      <ClipboardList className="w-4 h-4 mr-2" />
                                      Créer BC (articles réactivés)
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">Aucun article en attente</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Tab: Bon de Commande */}
          <TabsContent value="bc" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Réf. BC</TableHead>
                    <TableHead>Réf. PR</TableHead>
                    <TableHead>Navire</TableHead>
                    <TableHead>Demandeur Original</TableHead>
                    <TableHead>Produits</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé par</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.length > 0 ? (
                    purchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.reference}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{po.purchaseRequest?.reference}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Ship className="w-4 h-4 text-muted-foreground" />
                            <span>{po.purchaseRequest?.vessel?.name || po.purchaseRequest?.vesselName || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{po.purchaseRequest?.createdBy?.name || po.purchaseRequest?.createdByName || "N/A"}</span>
                            <span className="text-xs text-muted-foreground">
                              {po.purchaseRequest?.createdBy?.role ? ROLE_LABELS[po.purchaseRequest.createdBy.role] || po.purchaseRequest.createdBy.role : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span>{po.products.length} article(s)</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "font-normal",
                            po.status === "DRAFT" && "bg-gray-100 text-gray-700",
                            po.status === "VALIDATED" && "bg-green-100 text-green-700",
                            po.status === "SENT" && "bg-blue-100 text-blue-700",
                            po.status === "DELIVERED" && "bg-purple-100 text-purple-700",
                            po.status === "CANCELLED" && "bg-red-100 text-red-700"
                          )}>
                            {po.status === "DRAFT" && "Brouillon"}
                            {po.status === "VALIDATED" && "Validé"}
                            {po.status === "SENT" && "Envoyé"}
                            {po.status === "DELIVERED" && "Livré"}
                            {po.status === "CANCELLED" && "Annulé"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{po.createdBy?.name || "N/A"}</span>
                        </TableCell>
                        <TableCell>{formatDate(po.createdAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedPO(po)
                                setIsViewBCDialogOpen(true)
                              }}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <p className="text-muted-foreground">Aucun bon de commande créé</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View PR Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPR?.reference}
              {selectedPR?.masterApproved && (
                <Badge className="bg-green-100 text-green-700 font-normal">
                  Approuvé Master
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Détails de la demande d&apos;achat
            </DialogDescription>
          </DialogHeader>
          {selectedPR && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Navire</p>
                  <p className="font-medium">{selectedPR.vessel?.name || selectedPR.vesselName || "Navire supprimé"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Demandeur</p>
                  <div>
                    <p className="font-medium">{selectedPR.createdBy?.name || selectedPR.createdByName || "Utilisateur supprimé"}</p>
                    <p className="text-xs text-muted-foreground">{selectedPR.createdBy?.role ? (ROLE_LABELS[selectedPR.createdBy.role] || selectedPR.createdBy.role) : ""}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Catégorie</p>
                  <p className="font-medium">{CATEGORY_LABELS[selectedPR.category] || selectedPR.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priorité</p>
                  {PRIORITY_CONFIG[selectedPR.priority] && (
                    <Badge className={cn("font-normal", PRIORITY_CONFIG[selectedPR.priority].color)}>
                      {PRIORITY_CONFIG[selectedPR.priority].label}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Créée le</p>
                  <p className="font-medium">{formatDate(selectedPR.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approbation Master</p>
                  {selectedPR.masterApproved ? (
                    <div>
                      <p className="font-medium text-green-600">Approuvé par {selectedPR.masterApprovedBy?.name || "Master"}</p>
                      {selectedPR.masterApprovedAt && (
                        <p className="text-xs text-muted-foreground">{formatDate(selectedPR.masterApprovedAt)}</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-gray-500">En attente</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut Devis</p>
                  {selectedPR.quotationCompletedAt ? (
                    <div>
                      <p className="font-medium text-blue-600">Devis complété</p>
                      <p className="text-xs text-muted-foreground">{formatDate(selectedPR.quotationCompletedAt)}</p>
                    </div>
                  ) : selectedPR.sentToQuotation ? (
                    <div>
                      <p className="font-medium text-yellow-600">En cours de devis</p>
                      {selectedPR.quotationSentAt && (
                        <p className="text-xs text-muted-foreground">Envoyé le {formatDate(selectedPR.quotationSentAt)}</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-gray-500">Non envoyé</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Produits ({selectedPR.products.length})</p>
                <div className="border rounded-lg divide-y">
                  {selectedPR.products.map((product) => (
                    <div key={product.id} className={cn(
                      "p-3",
                      product.unavailableReason && "bg-orange-50"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Package className={cn(
                            "w-4 h-4",
                            product.unavailableReason ? "text-orange-500" : "text-muted-foreground"
                          )} />
                          <span className="font-medium">{product.name}</span>
                          <Badge variant="outline">
                            {product.quantity} {product.unit}
                          </Badge>
                          {product.rob !== null && product.rob !== undefined && (
                            <Badge variant="secondary" className="text-xs">
                              ROB: {product.rob}
                            </Badge>
                          )}
                          {/* Status badges */}
                          {product.unavailableReason ? (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <Clock className="w-3 h-3" />
                              {product.unavailableReason === "OUT_OF_STOCK" ? "Rupture stock" : "Pas d'offre"}
                            </Badge>
                          ) : product.quotedPrice ? (
                            <Badge className="bg-green-100 text-green-800 text-xs gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {product.quotedPrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                              {product.supplierName && ` - ${product.supplierName}`}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      {/* Product images */}
                      {product.images && product.images.length > 0 && (
                        <div className="flex gap-2 mt-2 ml-7 flex-wrap">
                          {product.images.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img 
                                src={url} 
                                alt={`${product.name} photo ${idx + 1}`} 
                                className="w-16 h-16 rounded object-cover border hover:ring-2 hover:ring-primary transition-all"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedPR.notes && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedPR.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fermer
            </Button>
            {selectedPR && !selectedPR.sentToQuotation && (
              <Button
                onClick={() => {
                  handleSendToQuotation(selectedPR.id)
                  setIsViewDialogOpen(false)
                }}
                disabled={isSaving}
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer en devis
              </Button>
            )}
            {selectedPR && selectedPR.sentToQuotation && !selectedPR.quotationCompletedAt && (
              <Button
                onClick={() => {
                  handleOpenQuotation(selectedPR)
                  setIsViewDialogOpen(false)
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Remplir devis
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quotation Dialog */}
      <Dialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Remplir le devis - {selectedPR?.reference}
            </DialogTitle>
            <DialogDescription>
              Renseignez le prix, le fournisseur et les remarques pour chaque article
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              {quotationProducts.map((product, index) => (
                <div key={product.id} className={cn(
                  "border rounded-lg p-4 space-y-4",
                  product.unavailableReason && "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{product.name}</span>
                      <Badge variant="outline">
                        {product.quantity} {product.unit}
                      </Badge>
                      {product.unavailableReason && (
                        <Badge variant="destructive" className="text-xs">
                          {product.unavailableReason === "OUT_OF_STOCK" ? "Rupture de stock" : "Pas d'offre"}
                        </Badge>
                      )}
                    </div>
                    <Select
                      value={product.unavailableReason || "AVAILABLE"}
                      onValueChange={(value) => {
                        const newProducts = [...quotationProducts]
                        newProducts[index].unavailableReason = value === "AVAILABLE" ? null : value
                        setQuotationProducts(newProducts)
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            Disponible
                          </span>
                        </SelectItem>
                        <SelectItem value="OUT_OF_STOCK">
                          <span className="flex items-center gap-2">
                            <XCircle className="w-3 h-3 text-red-600" />
                            Rupture de stock
                          </span>
                        </SelectItem>
                        <SelectItem value="NO_OFFER">
                          <span className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-orange-600" />
                            Pas d&apos;offre
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {!product.unavailableReason && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`price-${product.id}`}>Prix unitaire (€)</Label>
                        <Input
                          id={`price-${product.id}`}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={product.quotedPrice ?? ""}
                          onChange={(e) => {
                            const newProducts = [...quotationProducts]
                            newProducts[index].quotedPrice = e.target.value ? parseFloat(e.target.value) : null
                            setQuotationProducts(newProducts)
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`supplier-${product.id}`}>Fournisseur</Label>
                        <Input
                          id={`supplier-${product.id}`}
                          placeholder="Nom du fournisseur"
                          value={product.supplierName}
                          onChange={(e) => {
                            const newProducts = [...quotationProducts]
                            newProducts[index].supplierName = e.target.value
                            setQuotationProducts(newProducts)
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`remark-${product.id}`}>Remarque</Label>
                        <Input
                          id={`remark-${product.id}`}
                          placeholder="Remarque pour cet article"
                          value={product.remark}
                          onChange={(e) => {
                            const newProducts = [...quotationProducts]
                            newProducts[index].remark = e.target.value
                            setQuotationProducts(newProducts)
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quotationRemark">Remarque générale</Label>
              <Textarea
                id="quotationRemark"
                placeholder="Remarque générale sur le devis..."
                value={quotationRemark}
                onChange={(e) => setQuotationRemark(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuotationDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmitQuotation}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider le devis
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BC Creation Dialog */}
      <Dialog open={isBCDialogOpen} onOpenChange={setIsBCDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un Bon de Commande</DialogTitle>
            <DialogDescription>
              Validez les quantités et supprimez les articles non nécessaires avant de créer le BC.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Products List */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Articles ({bcProducts.length})</Label>
              <div className="border rounded-lg divide-y">
                {bcProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className={`p-4 ${product.isRemoved ? 'bg-muted/50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className={`font-medium truncate ${product.isRemoved ? 'line-through text-muted-foreground' : ''}`}>
                          {product.name}
                        </span>
                        {product.isRemoved && (
                          <Badge variant="destructive" className="text-xs flex-shrink-0">Supprimé</Badge>
                        )}
                      </div>
                      <Button
                        variant={product.isRemoved ? "outline" : "ghost"}
                        size="sm"
                        className={product.isRemoved ? "" : "text-destructive hover:text-destructive hover:bg-destructive/10"}
                        onClick={() => {
                          setBcProducts(prev => prev.map((p, i) => 
                            i === index ? { ...p, isRemoved: !p.isRemoved } : p
                          ))
                        }}
                      >
                        {product.isRemoved ? (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Restaurer
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Retirer
                          </>
                        )}
                      </Button>
                    </div>

                    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm ${product.isRemoved ? 'opacity-50' : ''}`}>
                      <div className="bg-muted/50 rounded-md p-2">
                        <div className="text-muted-foreground text-xs mb-1">Qté demandée</div>
                        <div className="font-semibold">{product.originalQuantity} {product.unit}</div>
                      </div>
                      
                      <div className="bg-primary/5 rounded-md p-2 border border-primary/20">
                        <div className="text-muted-foreground text-xs mb-1">Qté à commander</div>
                        <Input
                          type="number"
                          min="0"
                          value={product.validatedQuantity}
                          onChange={(e) => {
                            const newQty = Math.max(0, parseInt(e.target.value) || 0)
                            setBcProducts(prev => prev.map((p, i) => 
                              i === index ? { ...p, validatedQuantity: newQty } : p
                            ))
                          }}
                          disabled={product.isRemoved}
                          className="h-7 w-full font-semibold"
                        />
                      </div>

                      <div className="bg-muted/50 rounded-md p-2">
                        <div className="text-muted-foreground text-xs mb-1">Prix unitaire</div>
                        <div className="font-semibold">{product.quotedPrice ? `${product.quotedPrice} €` : '-'}</div>
                      </div>

                      <div className="bg-muted/50 rounded-md p-2">
                        <div className="text-muted-foreground text-xs mb-1">Fournisseur</div>
                        <div className="font-medium truncate">{product.supplierName || '-'}</div>
                      </div>
                    </div>

                    {product.remark && (
                      <p className="text-xs text-muted-foreground italic mt-2 pl-2 border-l-2 border-muted">
                        {product.remark}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="bc-notes">Notes (optionnel)</Label>
              <Textarea
                id="bc-notes"
                placeholder="Ajouter des instructions ou remarques pour ce bon de commande..."
                value={bcNotes}
                onChange={(e) => setBcNotes(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Summary */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Articles: </span>
                    <span className="font-semibold">
                      {bcProducts.filter(p => !p.isRemoved && p.validatedQuantity > 0).length} / {bcProducts.length}
                    </span>
                  </div>
                  {bcProducts.some(p => !p.isRemoved && p.quotedPrice) && (
                    <div>
                      <span className="text-muted-foreground">Total estimé: </span>
                      <span className="font-semibold">
                        {bcProducts
                          .filter(p => !p.isRemoved && p.validatedQuantity > 0)
                          .reduce((sum, p) => sum + (p.quotedPrice || 0) * p.validatedQuantity, 0)
                          .toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBCDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateBC}
              disabled={bcProducts.filter(p => !p.isRemoved && p.validatedQuantity > 0).length === 0}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Créer le BC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View BC Dialog */}
      <Dialog open={isViewBCDialogOpen} onOpenChange={setIsViewBCDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              {selectedPO?.reference}
              <Badge className={cn(
                "font-normal ml-2",
                selectedPO?.status === "DRAFT" && "bg-gray-100 text-gray-700",
                selectedPO?.status === "VALIDATED" && "bg-green-100 text-green-700",
                selectedPO?.status === "SENT" && "bg-blue-100 text-blue-700",
                selectedPO?.status === "DELIVERED" && "bg-purple-100 text-purple-700",
                selectedPO?.status === "CANCELLED" && "bg-red-100 text-red-700"
              )}>
                {selectedPO?.status === "DRAFT" && "Brouillon"}
                {selectedPO?.status === "VALIDATED" && "Validé"}
                {selectedPO?.status === "SENT" && "Envoyé"}
                {selectedPO?.status === "DELIVERED" && "Livré"}
                {selectedPO?.status === "CANCELLED" && "Annulé"}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Créé le {selectedPO && formatDate(selectedPO.createdAt)} par {selectedPO?.createdBy?.name || "N/A"}
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-6 py-4">
              {/* Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1">Demande d&apos;achat</p>
                  <p className="font-mono font-medium">{selectedPO.purchaseRequest?.reference}</p>
                </div>
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1">Navire</p>
                  <p className="font-medium">{selectedPO.purchaseRequest?.vessel?.name || selectedPO.purchaseRequest?.vesselName || "-"}</p>
                </div>
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1">Demandeur</p>
                  <p className="font-medium">{selectedPO.purchaseRequest?.createdBy?.name || selectedPO.purchaseRequest?.createdByName || "-"}</p>
                </div>
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1">Total articles</p>
                  <p className="font-medium">{selectedPO.products.length}</p>
                </div>
              </div>

              {/* Products */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Articles commandés
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article</TableHead>
                        <TableHead className="text-center">Qté demandée</TableHead>
                        <TableHead className="text-center">Qté validée</TableHead>
                        <TableHead className="text-right">Prix unit.</TableHead>
                        <TableHead>Fournisseur</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.products.map((product) => {
                        const isReduced = product.validatedQuantity < product.originalQuantity
                        const isRemoved = product.validatedQuantity === 0
                        return (
                          <TableRow key={product.id} className={isRemoved ? "opacity-50" : ""}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={cn("font-medium", isRemoved && "line-through")}>{product.name}</span>
                                {isRemoved && <Badge variant="destructive" className="text-xs">Supprimé</Badge>}
                                {isReduced && !isRemoved && <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">Réduit</Badge>}
                              </div>
                              {product.remark && (
                                <p className="text-xs text-muted-foreground mt-1 italic">{product.remark}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {product.originalQuantity} {product.unit}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={cn("font-semibold", isReduced && "text-orange-600", isRemoved && "text-red-600")}>
                                {product.validatedQuantity} {product.unit}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {product.quotedPrice ? `${product.quotedPrice.toLocaleString("fr-FR")} €` : "-"}
                            </TableCell>
                            <TableCell>{product.supplierName || "-"}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Notes */}
              {selectedPO.notes && (
                <div className="space-y-2">
                  <h3 className="font-medium">Notes</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{selectedPO.notes}</p>
                </div>
              )}

              {/* Summary */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex flex-wrap justify-between items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Articles validés: </span>
                    <span className="font-semibold">
                      {selectedPO.products.filter(p => p.validatedQuantity > 0).length} / {selectedPO.products.length}
                    </span>
                  </div>
                  {selectedPO.products.some(p => p.quotedPrice) && (
                    <div>
                      <span className="text-muted-foreground">Total estimé: </span>
                      <span className="font-bold text-lg">
                        {selectedPO.products
                          .filter(p => p.validatedQuantity > 0)
                          .reduce((sum, p) => sum + (p.quotedPrice || 0) * p.validatedQuantity, 0)
                          .toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
