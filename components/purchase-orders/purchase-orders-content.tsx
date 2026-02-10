"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ClipboardList,
  Eye,
  Search,
  Package,
  CheckCircle,
  Loader2,
  ArrowDown,
  ArrowUp,
  Minus,
  Trash2,
  Ship,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface POProduct {
  id: string
  name: string
  originalQuantity: number
  validatedQuantity: number
  unit: string
  quotedPrice: number | null
  supplierName: string | null
  remark: string | null
}

interface PurchaseOrder {
  id: string
  reference: string
  status: string
  notes: string | null
  createdAt: string
  products: POProduct[]
  purchaseRequest: {
    id: string
    reference: string
    category: string
    priority: string
    vessel: {
      id: string
      name: string
    } | null
  }
  createdBy: {
    id: string
    name: string
  }
}

// Status labels and colors
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Brouillon", color: "bg-slate-100 text-slate-800" },
  VALIDATED: { label: "Validé", color: "bg-blue-100 text-blue-800" },
  SENT: { label: "Envoyé", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Livré", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Annulé", color: "bg-red-100 text-red-800" },
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

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function PurchaseOrdersContent() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null)

  // Fetch purchase orders for the current user's PRs
  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // First fetch session to get user info
      const sessionResponse = await fetch("/api/auth/session")
      const sessionData = await sessionResponse.json()
      
      if (sessionData.authenticated && sessionData.user) {
        setCurrentUser({
          id: sessionData.user.id,
          name: sessionData.user.name,
          role: sessionData.user.role,
        })
        
        // Fetch purchase orders for this user's created PRs
        const response = await fetch(`/api/purchase-orders?creatorId=${sessionData.user.id}`)
        if (!response.ok) throw new Error("Failed to fetch purchase orders")
        const result = await response.json()
        setPurchaseOrders(result.success ? result.data : [])
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  // Filter purchase orders
  const filteredPOs = purchaseOrders.filter((po) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      po.reference.toLowerCase().includes(searchLower) ||
      po.purchaseRequest.reference.toLowerCase().includes(searchLower) ||
      po.purchaseRequest.vessel?.name.toLowerCase().includes(searchLower) ||
      po.products.some(p => p.name.toLowerCase().includes(searchLower))
    )
  })

  // Handle view PO
  const handleViewPO = (po: PurchaseOrder) => {
    setSelectedPO(po)
    setIsViewDialogOpen(true)
  }

  // Calculate quantity change indicator
  const getQuantityChange = (original: number, validated: number) => {
    if (validated === 0) return { type: "removed", icon: Trash2, color: "text-red-500" }
    if (validated < original) return { type: "reduced", icon: ArrowDown, color: "text-orange-500" }
    if (validated === original) return { type: "same", icon: null, color: "" }
    return { type: "increased", icon: ArrowUp, color: "text-green-500" }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bons de Commande</h1>
          <p className="text-muted-foreground">
            Consultez les bons de commande créés à partir de vos demandes d&apos;achat
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total BC</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchaseOrders.filter(po => ["DRAFT", "VALIDATED", "SENT"].includes(po.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchaseOrders.filter(po => po.status === "DELIVERED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annulés</CardTitle>
            <Trash2 className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchaseOrders.filter(po => po.status === "CANCELLED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Orders Table */}
      {filteredPOs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {purchaseOrders.length === 0
                ? "Aucun bon de commande pour le moment"
                : "Aucun résultat trouvé"}
            </p>
            <p className="text-sm text-muted-foreground">
              Les bons de commande apparaîtront ici une fois créés par l&apos;administration
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence BC</TableHead>
                  <TableHead>Demande d&apos;achat</TableHead>
                  <TableHead>Navire</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" />
                        <span className="font-mono font-medium">{po.reference}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{po.purchaseRequest.reference}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Ship className="w-4 h-4 text-muted-foreground" />
                        <span>{po.purchaseRequest.vessel?.name || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span>{po.products.length} article(s)</span>
                        {po.products.some(p => p.validatedQuantity < p.originalQuantity) && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                            Modifié
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", STATUS_CONFIG[po.status]?.color)}>
                        {STATUS_CONFIG[po.status]?.label || po.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(po.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPO(po)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* View PO Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Bon de Commande {selectedPO?.reference}
            </DialogTitle>
            <DialogDescription>
              Créé le {selectedPO && formatDate(selectedPO.createdAt)} par {selectedPO?.createdBy.name}
            </DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-6">
              {/* Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Demande d&apos;achat</span>
                  <p className="font-mono font-medium">{selectedPO.purchaseRequest.reference}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Catégorie</span>
                  <p className="font-medium">
                    {CATEGORY_LABELS[selectedPO.purchaseRequest.category] || selectedPO.purchaseRequest.category}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Navire</span>
                  <p className="font-medium">{selectedPO.purchaseRequest.vessel?.name || "-"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Statut</span>
                  <Badge className={cn("mt-1", STATUS_CONFIG[selectedPO.status]?.color)}>
                    {STATUS_CONFIG[selectedPO.status]?.label || selectedPO.status}
                  </Badge>
                </div>
              </div>

              {/* Products */}
              <div className="space-y-3">
                <h3 className="font-medium">Articles commandés</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article</TableHead>
                        <TableHead className="text-center">Qté demandée</TableHead>
                        <TableHead className="text-center">Qté validée</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Fournisseur</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.products.map((product) => {
                        const change = getQuantityChange(product.originalQuantity, product.validatedQuantity)
                        return (
                          <TableRow key={product.id} className={product.validatedQuantity === 0 ? "opacity-50" : ""}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{product.name}</span>
                                {product.validatedQuantity === 0 && (
                                  <Badge variant="destructive" className="text-xs">Supprimé</Badge>
                                )}
                              </div>
                              {product.remark && (
                                <p className="text-xs text-muted-foreground mt-1 italic">{product.remark}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {product.originalQuantity} {product.unit}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className={cn("font-medium", change.color)}>
                                  {product.validatedQuantity} {product.unit}
                                </span>
                                {change.icon && <change.icon className={cn("w-4 h-4", change.color)} />}
                              </div>
                            </TableCell>
                            <TableCell>
                              {product.quotedPrice ? `${product.quotedPrice}€` : "-"}
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
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {selectedPO.notes}
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Articles validés</span>
                  <span className="font-medium">
                    {selectedPO.products.filter(p => p.validatedQuantity > 0).length} / {selectedPO.products.length}
                  </span>
                </div>
                {selectedPO.products.some(p => p.quotedPrice) && (
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-muted-foreground">Total estimé</span>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
