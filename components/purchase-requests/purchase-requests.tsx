"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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
  DialogDescription,
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
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Search,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Loader2,
  FileText,
  ImageIcon,
  X,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  quantity: number
  unit: string
  reference?: string | null
  rob?: number | null
  images?: string[]
  quotedPrice?: number | null
  supplierName?: string | null
  remark?: string | null
  unavailableReason?: string | null
}

interface PurchaseRequest {
  id: string
  reference: string
  customReference?: string | null
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

interface PurchaseRequestsProps {
  title?: string
}

export function PurchaseRequests({ title }: PurchaseRequestsProps) {
  // State
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [masterApprovedFilter, setMasterApprovedFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false)
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string; vesselId?: string } | null>(null)
  const [vessels, setVessels] = useState<{ id: string; name: string }[]>([])
  const [selectedVesselId, setSelectedVesselId] = useState<string>("")

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

  // Form state
  const [formData, setFormData] = useState<{
    category: string
    priority: string
    notes: string
    customReference: string
    products: Product[]
  }>({
    category: "SPARE_PARTS",
    priority: "MEDIUM",
    notes: "",
    customReference: "",
    products: [],
  })

  // New product form
  const [newProduct, setNewProduct] = useState<Omit<Product, "id">>(
    {
    name: "",
    quantity: 1,
    unit: "pcs",
    reference: "",
    rob: null,
    images: [],
  })
  const [isUploading, setIsUploading] = useState(false)

  // Fetch purchase requests and user data
  const fetchPurchaseRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      // First fetch session to get user info
      const sessionResponse = await fetch("/api/auth/session")
      const sessionData = await sessionResponse.json()
      
      let userVesselId = null
      if (sessionData.authenticated && sessionData.user) {
        const vesselId = sessionData.user.vessel?.id || sessionData.user.vesselId
        setCurrentUser({
          id: sessionData.user.id,
          name: sessionData.user.name,
          role: sessionData.user.role,
          vesselId: vesselId,
        })
        userVesselId = vesselId
        if (vesselId) {
          setSelectedVesselId(vesselId)
        }
      }
      
      // Fetch PRs - filter by user's vessel for non-admin roles
      const prUrl = userVesselId 
        ? `/api/purchase-requests?vesselId=${userVesselId}`
        : "/api/purchase-requests"
      
      const [prResponse, vesselsResponse] = await Promise.all([
        fetch(prUrl),
        fetch("/api/vessels"),
      ])
      
      const [prData, vesselsData] = await Promise.all([
        prResponse.json(),
        vesselsResponse.json(),
      ])
      
      if (prData.success) {
        setPurchaseRequests(prData.data)
      }
      if (vesselsData.success) {
        setVessels(vesselsData.data)
        if (vesselsData.data.length > 0 && !selectedVesselId) {
          setSelectedVesselId(vesselsData.data[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedVesselId])

  useEffect(() => {
    fetchPurchaseRequests()
  }, [fetchPurchaseRequests])

  // Filtered PRs
  const filteredPRs = useMemo(() => {
    return purchaseRequests.filter((pr) => {
      const matchesSearch =
        pr.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.products.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesMasterApproved = 
        masterApprovedFilter === "all" || 
        (masterApprovedFilter === "approved" && pr.masterApproved) ||
        (masterApprovedFilter === "not-approved" && !pr.masterApproved)
      return matchesSearch && matchesMasterApproved
    })
  }, [purchaseRequests, searchQuery, masterApprovedFilter])

  // Stats
  const stats = useMemo(() => ({
    total: purchaseRequests.length,
    masterApproved: purchaseRequests.filter((pr) => pr.masterApproved).length,
    notApproved: purchaseRequests.filter((pr) => !pr.masterApproved).length,
  }), [purchaseRequests])

  // Handlers
  const handleAddProduct = useCallback(() => {
    if (!newProduct.name.trim()) return
    const product: Product = {
      id: `temp-${Date.now()}`,
      ...newProduct,
    }
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, product],
    }))
    setNewProduct({ name: "", quantity: 1, unit: "pcs", reference: "", rob: null, images: [] })
  }, [newProduct])

  const handleRemoveProduct = useCallback((productId: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }))
  }, [])

  const handleCreatePR = useCallback(async () => {
    if (formData.products.length === 0 || !currentUser || !selectedVesselId) return

    try {
      setIsSaving(true)
      const response = await fetch("/api/purchase-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formData.category,
          priority: formData.priority,
          notes: formData.notes || null,
          customReference: formData.customReference || null,
          createdById: currentUser.id,
          vesselId: selectedVesselId,
          products: formData.products.map((p) => ({
            name: p.name,
            quantity: p.quantity,
            unit: p.unit,
            reference: p.reference || null,
            rob: p.rob || null,
            images: p.images || [],
          })),
        }),
      })

      if (response.ok) {
        await fetchPurchaseRequests()
        setFormData({ category: "SPARE_PARTS", priority: "MEDIUM", notes: "", customReference: "", products: [] })
        setIsCreateDialogOpen(false)
      } else {
        const errorData = await response.json()
        console.error("Error creating PR:", errorData.error, errorData.details)
      }
    } catch (error) {
      console.error("Error creating PR:", error)
    } finally {
      setIsSaving(false)
    }
  }, [formData, fetchPurchaseRequests, currentUser, selectedVesselId])

  const handleToggleMasterApproved = useCallback(async (prId: string, approve: boolean) => {
    if (!currentUser) return
    try {
      const response = await fetch(`/api/purchase-requests/${prId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          masterApproved: approve,
          masterApprovedById: approve ? currentUser.id : null
        }),
      })

      if (response.ok) {
        setPurchaseRequests((prev) =>
          prev.map((pr) =>
            pr.id === prId
              ? { 
                  ...pr, 
                  masterApproved: approve, 
                  masterApprovedBy: approve ? { id: currentUser.id, name: currentUser.name } : undefined,
                  masterApprovedAt: approve ? new Date().toISOString() : undefined,
                  updatedAt: new Date().toISOString() 
                }
              : pr
          )
        )
      }
    } catch (error) {
      console.error("Error updating master approval:", error)
    }
  }, [currentUser])

  const handleDeletePR = useCallback(async (prId: string) => {
    try {
      const response = await fetch(`/api/purchase-requests/${prId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPurchaseRequests((prev) => prev.filter((pr) => pr.id !== prId))
      }
    } catch (error) {
      console.error("Error deleting PR:", error)
    }
  }, [])

  // Send PR to quotation (admin action)
  const handleSendToQuotation = useCallback(async (prId: string) => {
    if (!currentUser) return
    try {
      const response = await fetch(`/api/purchase-requests/${prId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sentToQuotation: true,
          quotationSentById: currentUser.id
        }),
      })

      if (response.ok) {
        setPurchaseRequests((prev) =>
          prev.map((pr) =>
            pr.id === prId
              ? { 
                  ...pr, 
                  sentToQuotation: true, 
                  quotationSentAt: new Date().toISOString(),
                  quotationSentBy: { id: currentUser.id, name: currentUser.name },
                  updatedAt: new Date().toISOString() 
                }
              : pr
          )
        )
      }
    } catch (error) {
      console.error("Error sending to quotation:", error)
    }
  }, [currentUser])

  // Open quotation dialog to fill prices and suppliers
  const handleOpenQuotation = useCallback((pr: PurchaseRequest) => {
    setSelectedPR(pr)
    setQuotationProducts(pr.products.map(p => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
      quotedPrice: p.quotedPrice ?? null,
      supplierName: p.supplierName || "",
      remark: p.remark || "",
      unavailableReason: p.unavailableReason ?? null,
    })))
    setQuotationRemark(pr.quotationRemark || "")
    setIsQuotationDialogOpen(true)
  }, [])

  // Submit quotation with prices and suppliers
  const handleSubmitQuotation = useCallback(async () => {
    if (!selectedPR || !currentUser) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/purchase-requests/${selectedPR.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          quotationRemark,
          quotationProducts: quotationProducts.map(p => ({
            id: p.id,
            quotedPrice: p.quotedPrice,
            supplierName: p.supplierName,
            remark: p.remark,
            unavailableReason: p.unavailableReason,
          })),
        }),
      })

      if (response.ok) {
        await fetchPurchaseRequests()
        setIsQuotationDialogOpen(false)
      }
    } catch (error) {
      console.error("Error submitting quotation:", error)
    } finally {
      setIsSaving(false)
    }
  }, [selectedPR, currentUser, quotationRemark, quotationProducts, fetchPurchaseRequests])

  const handleViewPR = useCallback((pr: PurchaseRequest) => {
    setSelectedPR(pr)
    setIsViewDialogOpen(true)
  }, [])

  const handleEditPR = useCallback((pr: PurchaseRequest) => {
    setSelectedPR(pr)
    setFormData({
      category: pr.category,
      priority: pr.priority,
      notes: pr.notes || "",
      customReference: pr.customReference || "",
      products: [...pr.products],
    })
    setIsEditDialogOpen(true)
  }, [])

  const handleUpdatePR = useCallback(async () => {
    if (!selectedPR || formData.products.length === 0) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/purchase-requests/${selectedPR.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formData.category,
          priority: formData.priority,
          notes: formData.notes || null,
          customReference: formData.customReference || null,
          products: formData.products.map((p) => ({
            id: p.id.startsWith("temp-") ? undefined : p.id,
            name: p.name,
            quantity: p.quantity,
            unit: p.unit,
          })),
        }),
      })

      if (response.ok) {
        await fetchPurchaseRequests()
        setFormData({ category: "SPARE_PARTS", priority: "MEDIUM", notes: "", customReference: "", products: [] })
        setSelectedPR(null)
        setIsEditDialogOpen(false)
      }
    } catch (error) {
      console.error("Error updating PR:", error)
    } finally {
      setIsSaving(false)
    }
  }, [formData, selectedPR, fetchPurchaseRequests])

  const resetForm = useCallback(() => {
    setFormData({ category: "SPARE_PARTS", priority: "MEDIUM", notes: "", customReference: "", products: [] })
    setNewProduct({ name: "", quantity: 1, unit: "pcs", reference: "", rob: null, images: [] })
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
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
              <div className="p-2 rounded-lg bg-gray-100">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.notApproved}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une PR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={masterApprovedFilter} onValueChange={setMasterApprovedFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Approbation Master" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="approved">Approuvé par Master</SelectItem>
              <SelectItem value="not-approved">Non approuvé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle PR
        </Button>
      </div>

      {/* PR Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Master</TableHead>
              <TableHead>Devis</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPRs.length > 0 ? (
              filteredPRs.map((pr) => {
                const priorityConfig = PRIORITY_CONFIG[pr.priority] || PRIORITY_CONFIG.MEDIUM
                return (
                  <TableRow key={pr.id}>
                    <TableCell className="font-medium">{pr.reference}</TableCell>
                    <TableCell>{CATEGORY_LABELS[pr.category] || pr.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>{pr.products.length} article(s)</span>
                        </div>
                        {pr.products.some(p => p.unavailableReason) && (
                          <Badge variant="destructive" className="text-xs">
                            {pr.products.filter(p => p.unavailableReason).length} indispo.
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-normal", priorityConfig.color)}>
                        {priorityConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {pr.masterApproved ? (
                        <Badge className="font-normal gap-1 bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          Approuvé
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-normal gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          En attente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {pr.quotationCompletedAt ? (
                        <Badge className="font-normal gap-1 bg-purple-100 text-purple-800">
                          <FileText className="w-3 h-3" />
                          Complété
                        </Badge>
                      ) : pr.sentToQuotation ? (
                        <Badge className="font-normal gap-1 bg-blue-100 text-blue-800">
                          <Send className="w-3 h-3" />
                          En cours
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-normal gap-1 text-muted-foreground">
                          -
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(pr.createdAt)}</TableCell>
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
                          {/* Master approval toggle for Capitaine */}
                          {currentUser?.role === "CAPITAINE" && !pr.masterApproved && (
                            <DropdownMenuItem 
                              onClick={() => handleToggleMasterApproved(pr.id, true)}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approuver (Master)
                            </DropdownMenuItem>
                          )}
                          {currentUser?.role === "CAPITAINE" && pr.masterApproved && (
                            <DropdownMenuItem 
                              onClick={() => handleToggleMasterApproved(pr.id, false)}
                              className="text-orange-600"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Retirer approbation
                            </DropdownMenuItem>
                          )}
                          {/* Quotation actions for Admin/CSO */}
                          {(currentUser?.role === "ADMIN" || currentUser?.role === "CSO") && !pr.sentToQuotation && (
                            <DropdownMenuItem 
                              onClick={() => handleSendToQuotation(pr.id)}
                              className="text-blue-600"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Envoyer en devis
                            </DropdownMenuItem>
                          )}
                          {(currentUser?.role === "ADMIN" || currentUser?.role === "CSO") && pr.sentToQuotation && (
                            <DropdownMenuItem 
                              onClick={() => handleOpenQuotation(pr)}
                              className="text-purple-600"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Remplir devis
                            </DropdownMenuItem>
                          )}
                          {(currentUser?.role === "ADMIN" || currentUser?.role === "CSO") && (
                            <>
                              <DropdownMenuItem onClick={() => handleEditPR(pr)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeletePR(pr.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
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
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-muted-foreground">Aucune demande d&apos;achat trouvée</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create PR Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[90vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle demande d&apos;achat</DialogTitle>
            <DialogDescription>
              Créez une nouvelle demande d&apos;achat avec les produits nécessaires.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Vessel Selection */}
            <div className="space-y-2">
              <Label>Navire</Label>
              <Select
                value={selectedVesselId}
                onValueChange={setSelectedVesselId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un navire" />
                </SelectTrigger>
                <SelectContent>
                  {vessels.map((vessel) => (
                    <SelectItem key={vessel.id} value={vessel.id}>
                      {vessel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add Product - Create Dialog */}
            <div className="space-y-4">
              <Label>Ajouter un produit</Label>
              <div className="space-y-3">
                {/* Row 1: Name, Quantity, Unit */}
                <div className="grid grid-cols-12 gap-2">
                  <Input
                    placeholder="Nom du produit"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                    className="col-span-6"
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Qté demandée"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="col-span-2"
                  />
                  <Select
                    value={newProduct.unit}
                    onValueChange={(v) => setNewProduct((prev) => ({ ...prev, unit: v }))}
                  >
                    <SelectTrigger className="col-span-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pièces</SelectItem>
                      <SelectItem value="L">Litres</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                      <SelectItem value="m">Mètres</SelectItem>
                      <SelectItem value="box">Boîtes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 2: Reference and ROB */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <Input
                      placeholder="Référence (optionnel)"
                      value={newProduct.reference ?? ""}
                      onChange={(e) => setNewProduct((prev) => ({ ...prev, reference: e.target.value || null }))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="ROB"
                      value={newProduct.rob ?? ""}
                      onChange={(e) => setNewProduct((prev) => ({ ...prev, rob: e.target.value ? parseInt(e.target.value) : null }))}
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="w-full">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files
                          if (!files || files.length === 0) return
                          
                          setIsUploading(true)
                          try {
                            const formDataUpload = new FormData()
                            for (let i = 0; i < files.length; i++) {
                              formDataUpload.append("files", files[i])
                            }
                            
                            const response = await fetch("/api/upload", {
                              method: "POST",
                              body: formDataUpload,
                            })
                            
                            if (response.ok) {
                              const result = await response.json()
                              if (result.success) {
                                setNewProduct((prev) => ({
                                  ...prev,
                                  images: [...(prev.images || []), ...result.urls],
                                }))
                              }
                            }
                          } catch (error) {
                              console.error("Error uploading images:", error)
                            } finally {
                              setIsUploading(false)
                            }
                            e.target.value = ""
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full cursor-pointer"
                          disabled={isUploading}
                          onClick={(e) => {
                            e.preventDefault()
                            const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement
                            input?.click()
                          }}
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ImageIcon className="w-4 h-4 mr-2" />
                          )}
                          {newProduct.images && newProduct.images.length > 0 
                            ? `${newProduct.images.length} photo(s)`
                            : "Photos"}
                        </Button>
                      </label>
                    </div>
                  <Button onClick={handleAddProduct} className="col-span-2">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Image previews */}
                {newProduct.images && newProduct.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newProduct.images.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border">
                        <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-destructive text-white rounded-bl p-0.5"
                          onClick={() => {
                            setNewProduct((prev) => ({
                              ...prev,
                              images: prev.images?.filter((_, i) => i !== idx) || [],
                            }))
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Products List */}
            {formData.products.length > 0 && (
              <div className="space-y-2">
                <Label>Produits ({formData.products.length})</Label>
                <div className="border rounded-lg divide-y">
                  {formData.products.map((product) => (
                    <div key={product.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{product.name}</span>
                          {product.reference && (
                            <span className="text-sm text-muted-foreground">
                              ({product.reference})
                            </span>
                          )}
                          <Badge variant="outline">
                            {product.quantity} {product.unit}
                          </Badge>
                          {product.rob !== null && product.rob !== undefined && (
                            <Badge variant="secondary" className="text-xs">
                              ROB: {product.rob}
                            </Badge>
                          )}
                          {product.images && product.images.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <ImageIcon className="w-3 h-3 mr-1" />
                              {product.images.length}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {/* Show image thumbnails */}
                      {product.images && product.images.length > 0 && (
                        <div className="flex gap-2 mt-2 ml-7">
                          {product.images.map((url, idx) => (
                            <img 
                              key={idx} 
                              src={url} 
                              alt={`${product.name} photo ${idx + 1}`} 
                              className="w-10 h-10 rounded object-cover border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea
                placeholder="Ajoutez des notes ou commentaires..."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreatePR} disabled={formData.products.length === 0 || isSaving || !selectedVesselId}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Créer la PR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit PR Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[90vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la demande {selectedPR?.reference}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Category and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add Product */}
            <div className="space-y-4">
              <Label>Ajouter un produit</Label>
              <div className="grid grid-cols-12 gap-2">
                <Input
                  placeholder="Nom du produit"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                  className="col-span-5"
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Qté"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="col-span-2"
                />
                <Select
                  value={newProduct.unit}
                  onValueChange={(v) => setNewProduct((prev) => ({ ...prev, unit: v }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pièces</SelectItem>
                    <SelectItem value="L">Litres</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="m">Mètres</SelectItem>
                    <SelectItem value="box">Boîtes</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddProduct} className="col-span-2">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Products List */}
            {formData.products.length > 0 && (
              <div className="space-y-2">
                <Label>Produits ({formData.products.length})</Label>
                <div className="border rounded-lg divide-y">
                  {formData.products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{product.name}</span>
                        {product.reference && (
                          <span className="text-sm text-muted-foreground">
                            ({product.reference})
                          </span>
                        )}
                        <Badge variant="outline">
                          {product.quantity} {product.unit}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRemoveProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea
                placeholder="Ajoutez des notes ou commentaires..."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdatePR} disabled={formData.products.length === 0 || isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View PR Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[90vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              {selectedPR?.reference}
              {selectedPR && (
                selectedPR.masterApproved ? (
                  <Badge className="font-normal bg-green-100 text-green-800 gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Approuvé par Master
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-normal text-muted-foreground gap-1">
                    <Clock className="w-3 h-3" />
                    En attente
                  </Badge>
                )
              )}
              {selectedPR?.sentToQuotation && (
                <Badge className="font-normal bg-purple-100 text-purple-800 gap-1">
                  <Send className="w-3 h-3" />
                  En devis
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedPR && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-sm text-muted-foreground">Créée par</p>
                  <p className="font-medium">{selectedPR.createdBy?.name || selectedPR.createdByName || "Utilisateur supprimé"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approbation Master</p>
                  {selectedPR.masterApproved && selectedPR.masterApprovedBy ? (
                    <div>
                      <p className="font-medium text-green-600">Approuvé par {selectedPR.masterApprovedBy.name}</p>
                      {selectedPR.masterApprovedAt && (
                        <p className="text-xs text-muted-foreground">{formatDate(selectedPR.masterApprovedAt)}</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-muted-foreground">Non approuvé</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Créée le</p>
                  <p className="font-medium">{formatDate(selectedPR.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mise à jour</p>
                  <p className="font-medium">{formatDate(selectedPR.updatedAt)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Produits ({selectedPR.products.length})</p>
                <div className="border rounded-lg divide-y">
                  {selectedPR.products.map((product) => (
                    <div key={product.id} className={cn(
                      "flex items-center justify-between p-3",
                      product.unavailableReason && "bg-red-50"
                    )}>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{product.name}</span>
                        {product.reference && (
                          <span className="text-sm text-muted-foreground">
                            ({product.reference})
                          </span>
                        )}
                        {product.unavailableReason && (
                          <Badge variant="destructive" className="text-xs">
                            {product.unavailableReason === "OUT_OF_STOCK" ? "Rupture de stock" : "Pas d'offre"}
                          </Badge>
                        )}
                        {product.quotedPrice && !product.unavailableReason && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {product.quotedPrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                            {product.supplierName && ` - ${product.supplierName}`}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline">
                        {product.quantity} {product.unit}
                      </Badge>
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
            {selectedPR && currentUser?.role === "CAPITAINE" && !selectedPR.masterApproved && (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => { handleToggleMasterApproved(selectedPR.id, true); setIsViewDialogOpen(false); }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approuver (Master)
              </Button>
            )}
            {selectedPR && currentUser?.role === "CAPITAINE" && selectedPR.masterApproved && (
              <Button 
                variant="outline"
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
                onClick={() => { handleToggleMasterApproved(selectedPR.id, false); setIsViewDialogOpen(false); }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Retirer approbation
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quotation Dialog */}
      <Dialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Devis - {selectedPR?.reference}
              <Badge className="font-normal bg-blue-100 text-blue-800">
                <Send className="w-3 h-3 mr-1" />
                En cours de devis
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Remplissez les prix et les fournisseurs pour chaque article.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Products with quotation fields */}
            <div className="space-y-4">
              <h4 className="font-medium">Articles</h4>
              {quotationProducts.map((product, index) => (
                <div key={product.id} className={cn(
                  "border rounded-lg p-4 space-y-3",
                  product.unavailableReason && "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{product.name}</span>
                      <Badge variant="outline">{product.quantity} {product.unit}</Badge>
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
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Prix unitaire</Label>
                        <Input
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
                      <div className="space-y-1">
                        <Label className="text-xs">Fournisseur</Label>
                        <Input
                          placeholder="Nom du fournisseur"
                          value={product.supplierName}
                          onChange={(e) => {
                            const newProducts = [...quotationProducts]
                            newProducts[index].supplierName = e.target.value
                            setQuotationProducts(newProducts)
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Remarque</Label>
                        <Input
                          placeholder="Remarque..."
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

            {/* General quotation remark */}
            <div className="space-y-2">
              <Label>Remarque générale du devis</Label>
              <Textarea
                placeholder="Remarques générales..."
                value={quotationRemark}
                onChange={(e) => setQuotationRemark(e.target.value)}
                rows={3}
              />
            </div>

            {/* Total calculation */}
            {quotationProducts.some(p => p.quotedPrice !== null && !p.unavailableReason) && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total estimé (produits disponibles):</span>
                  <span className="text-xl font-bold">
                    {quotationProducts
                      .filter(p => !p.unavailableReason)
                      .reduce((sum, p) => sum + (p.quotedPrice || 0) * p.quantity, 0)
                      .toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                  </span>
                </div>
              </div>
            )}

            {/* Unavailable products summary */}
            {quotationProducts.some(p => p.unavailableReason) && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Produits indisponibles ({quotationProducts.filter(p => p.unavailableReason).length})
                </div>
                <div className="text-sm text-red-700 space-y-1">
                  {quotationProducts.filter(p => p.unavailableReason === "OUT_OF_STOCK").length > 0 && (
                    <div>• Rupture de stock: {quotationProducts.filter(p => p.unavailableReason === "OUT_OF_STOCK").length}</div>
                  )}
                  {quotationProducts.filter(p => p.unavailableReason === "NO_OFFER").length > 0 && (
                    <div>• Pas d&apos;offre: {quotationProducts.filter(p => p.unavailableReason === "NO_OFFER").length}</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuotationDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmitQuotation}
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Enregistrer le devis
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
