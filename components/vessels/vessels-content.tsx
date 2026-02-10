"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Ship, Loader2 } from "lucide-react"
import { PageWrapper, DataTable, FormDialog, StatusBadge, type Column } from "@/components/shared"

interface Vessel {
  id: string
  name: string
  imo: string
  flag: string | null
  type: string | null
  grossTonnage: number | null
  status: string
  captain: string
  usersCount: number
  purchaseRequestsCount: number
  documentsCount: number
  createdAt: string
  updatedAt: string
}

export function VesselsContent() {
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)
  const [newVessel, setNewVessel] = useState({
    name: "",
    imo: "",
    flag: "",
    type: "",
    grossTonnage: "",
    status: "ACTIVE",
  })
  const [editVessel, setEditVessel] = useState({
    name: "",
    imo: "",
    flag: "",
    type: "",
    grossTonnage: "",
    status: "ACTIVE",
  })

  // Fetch vessels from API
  const fetchVessels = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/vessels")
      const data = await response.json()
      if (data.success) {
        setVessels(data.data)
      }
    } catch (error) {
      console.error("Error fetching vessels:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVessels()
  }, [fetchVessels])

  // Form validation
  const isFormValid = Boolean(newVessel.name && newVessel.imo)

  // Handlers
  const handleAddVessel = async () => {
    if (!isFormValid) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/vessels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVessel),
      })

      const data = await response.json()
      if (data.success) {
        await fetchVessels()
        resetForm()
        setIsAddDialogOpen(false)
      } else {
        console.error("Error:", data.error)
      }
    } catch (error) {
      console.error("Error creating vessel:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteVessel = async (vessel: Vessel) => {
    if (!confirm(`Supprimer le navire "${vessel.name}" ?`)) return

    try {
      const response = await fetch(`/api/vessels/${vessel.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setVessels(vessels.filter((v) => v.id !== vessel.id))
      }
    } catch (error) {
      console.error("Error deleting vessel:", error)
    }
  }

  const openEditDialog = (vessel: Vessel) => {
    setSelectedVessel(vessel)
    setEditVessel({
      name: vessel.name,
      imo: vessel.imo,
      flag: vessel.flag || "",
      type: vessel.type || "",
      grossTonnage: vessel.grossTonnage?.toString() || "",
      status: vessel.status,
    })
    setIsEditDialogOpen(true)
  }

  const handleEditVessel = async () => {
    if (!selectedVessel || !editVessel.name || !editVessel.imo) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/vessels/${selectedVessel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editVessel.name,
          imo: editVessel.imo,
          flag: editVessel.flag || null,
          type: editVessel.type || null,
          grossTonnage: editVessel.grossTonnage ? parseFloat(editVessel.grossTonnage) : null,
          status: editVessel.status,
        }),
      })

      const data = await response.json()
      if (data.success) {
        await fetchVessels()
        setIsEditDialogOpen(false)
        setSelectedVessel(null)
      } else {
        console.error("Error:", data.error)
      }
    } catch (error) {
      console.error("Error updating vessel:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setNewVessel({ name: "", imo: "", flag: "", type: "", grossTonnage: "", status: "ACTIVE" })
  }

  // Map status to display format
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, "active" | "inactive" | "pending"> = {
      ACTIVE: "active",
      INACTIVE: "inactive",
      MAINTENANCE: "pending",
      DECOMMISSIONED: "inactive",
    }
    return statusMap[status] || "inactive"
  }

  // Table column configuration
  const columns: Column<Vessel>[] = [
    { 
      key: "name", 
      header: "Nom du navire",
      render: (vessel) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Ship className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <span className="font-medium">{vessel.name}</span>
            {vessel.type && (
              <p className="text-xs text-muted-foreground">{vessel.type}</p>
            )}
          </div>
        </div>
      )
    },
    { key: "captain", header: "Capitaine" },
    { key: "imo", header: "Numéro IMO" },
    {
      key: "flag",
      header: "Pavillon",
      render: (vessel) => vessel.flag || "-",
    },
    {
      key: "usersCount",
      header: "Équipage",
      render: (vessel) => (
        <Badge variant="secondary" className="font-medium">
          {vessel.usersCount} membres
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (vessel) => <StatusBadge status={getStatusDisplay(vessel.status)} />,
    },
  ]

  const AddVesselButton = (
    <Button
      className="w-full sm:w-auto h-9 px-4 text-sm font-medium"
      onClick={() => setIsAddDialogOpen(true)}
    >
      <Plus className="w-4 h-4 mr-2" />
      Ajouter un navire
    </Button>
  )

  if (isLoading) {
    return (
      <PageWrapper
        title="Gestion des navires"
        description="Gérez tous les navires de votre flotte."
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Gestion des navires"
      description="Gérez tous les navires de votre flotte avec les capitaines assignés et les membres d'équipage."
      actions={AddVesselButton}
    >
      <DataTable
        data={vessels}
        columns={columns}
        actions={{
          onEdit: openEditDialog,
          onDelete: handleDeleteVessel,
        }}
        emptyMessage="Aucun navire trouvé. Ajoutez votre premier navire pour commencer."
      />

      <FormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Ajouter un nouveau navire"
        description="Enregistrez un nouveau navire dans la flotte."
        onSubmit={handleAddVessel}
        submitLabel={isSubmitting ? "Ajout en cours..." : "Ajouter le navire"}
        isValid={isFormValid && !isSubmitting}
      >
        <div className="space-y-2">
          <Label htmlFor="vessel-name">Nom du navire *</Label>
          <Input
            id="vessel-name"
            placeholder="ex: MV Ocean Star"
            value={newVessel.name}
            onChange={(e) => setNewVessel({ ...newVessel, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imo">Numéro IMO *</Label>
          <Input
            id="imo"
            placeholder="ex: IMO9876543"
            value={newVessel.imo}
            onChange={(e) => setNewVessel({ ...newVessel, imo: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="flag">Pavillon</Label>
            <Input
              id="flag"
              placeholder="ex: France"
              value={newVessel.flag}
              onChange={(e) => setNewVessel({ ...newVessel, flag: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              placeholder="ex: Cargo, Tanker"
              value={newVessel.type}
              onChange={(e) => setNewVessel({ ...newVessel, type: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="grossTonnage">Jauge brute</Label>
            <Input
              id="grossTonnage"
              type="number"
              placeholder="ex: 45000"
              value={newVessel.grossTonnage}
              onChange={(e) => setNewVessel({ ...newVessel, grossTonnage: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={newVessel.status}
              onValueChange={(value) => setNewVessel({ ...newVessel, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="INACTIVE">Inactif</SelectItem>
                <SelectItem value="MAINTENANCE">En maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormDialog>

      {/* Edit Vessel Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Modifier le navire"
        description="Modifiez les informations du navire."
        onSubmit={handleEditVessel}
        submitLabel={isSubmitting ? "Modification en cours..." : "Enregistrer les modifications"}
        isValid={Boolean(editVessel.name && editVessel.imo) && !isSubmitting}
      >
        <div className="space-y-2">
          <Label htmlFor="edit-vessel-name">Nom du navire *</Label>
          <Input
            id="edit-vessel-name"
            placeholder="ex: MV Ocean Star"
            value={editVessel.name}
            onChange={(e) => setEditVessel({ ...editVessel, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-imo">Numéro IMO *</Label>
          <Input
            id="edit-imo"
            placeholder="ex: IMO9876543"
            value={editVessel.imo}
            onChange={(e) => setEditVessel({ ...editVessel, imo: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-flag">Pavillon</Label>
            <Input
              id="edit-flag"
              placeholder="ex: France"
              value={editVessel.flag}
              onChange={(e) => setEditVessel({ ...editVessel, flag: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-type">Type</Label>
            <Input
              id="edit-type"
              placeholder="ex: Cargo, Tanker"
              value={editVessel.type}
              onChange={(e) => setEditVessel({ ...editVessel, type: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-grossTonnage">Jauge brute</Label>
            <Input
              id="edit-grossTonnage"
              type="number"
              placeholder="ex: 45000"
              value={editVessel.grossTonnage}
              onChange={(e) => setEditVessel({ ...editVessel, grossTonnage: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Statut</Label>
            <Select
              value={editVessel.status}
              onValueChange={(value) => setEditVessel({ ...editVessel, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="INACTIVE">Inactif</SelectItem>
                <SelectItem value="MAINTENANCE">En maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormDialog>
    </PageWrapper>
  )
}
