"use client"

import { useState } from "react"
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
import { Plus, Ship } from "lucide-react"
import { PageWrapper, DataTable, FormDialog, StatusBadge, type Column } from "@/components/shared"
import { mockVessels } from "@/data/mock-data"
import type { Vessel } from "@/types"

/**
 * VesselsContent - Vessel management component
 * 
 * Isolated component for vessel CRUD operations
 * Easy to test and debug independently
 */
export function VesselsContent() {
  // State management - all vessel-related state in one place
  const [vessels, setVessels] = useState<Vessel[]>(mockVessels)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newVessel, setNewVessel] = useState({
    name: "",
    captain: "",
    imo: "",
    status: "active" as const,
  })

  // Form validation
  const isFormValid = Boolean(newVessel.name && newVessel.captain && newVessel.imo)

  // Handlers - separated for clarity
  const handleAddVessel = () => {
    if (!isFormValid) return

    const vessel: Vessel = {
      id: String(vessels.length + 1),
      name: newVessel.name,
      captain: newVessel.captain,
      imo: newVessel.imo,
      status: newVessel.status,
      usersCount: 0,
    }

    setVessels([...vessels, vessel])
    resetForm()
    setIsAddDialogOpen(false)
  }

  const handleDeleteVessel = (vessel: Vessel) => {
    setVessels(vessels.filter((v) => v.id !== vessel.id))
  }

  const resetForm = () => {
    setNewVessel({ name: "", captain: "", imo: "", status: "active" })
  }

  // Table column configuration
  const columns: Column<Vessel>[] = [
    { 
      key: "name", 
      header: "Vessel Name",
      render: (vessel) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Ship className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-medium">{vessel.name}</span>
        </div>
      )
    },
    { key: "captain", header: "Captain" },
    { key: "imo", header: "IMO Number" },
    {
      key: "usersCount",
      header: "Crew",
      render: (vessel) => (
        <Badge variant="secondary" className="font-medium">
          {vessel.usersCount} members
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (vessel) => <StatusBadge status={vessel.status} />,
    },
  ]

  // Action button component
  const AddVesselButton = (
    <Button
      className="w-full sm:w-auto h-9 px-4 text-sm font-medium"
      onClick={() => setIsAddDialogOpen(true)}
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Vessel
    </Button>
  )

  return (
    <PageWrapper
      title="Vessels Management"
      description="Manage all vessels in your fleet with assigned captains and team members."
      actions={AddVesselButton}
    >
      <DataTable
        data={vessels}
        columns={columns}
        actions={{
          onEdit: (vessel) => console.log("Edit:", vessel),
          onDelete: handleDeleteVessel,
        }}
        emptyMessage="No vessels found. Add your first vessel to get started."
      />

      {/* Add Vessel Dialog */}
      <FormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Add New Vessel"
        description="Register a new vessel in the fleet with captain assignment and IMO number."
        onSubmit={handleAddVessel}
        submitLabel="Add Vessel"
        isValid={isFormValid}
      >
        <div className="space-y-2">
          <Label htmlFor="vessel-name">Vessel Name</Label>
          <Input
            id="vessel-name"
            placeholder="e.g., MV Iskander"
            value={newVessel.name}
            onChange={(e) => setNewVessel({ ...newVessel, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="captain">Assigned Captain</Label>
          <Input
            id="captain"
            placeholder="e.g., Captain John Smith"
            value={newVessel.captain}
            onChange={(e) => setNewVessel({ ...newVessel, captain: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imo">IMO Number</Label>
          <Input
            id="imo"
            placeholder="e.g., 9876543"
            value={newVessel.imo}
            onChange={(e) => setNewVessel({ ...newVessel, imo: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={newVessel.status}
            onValueChange={(value) =>
              setNewVessel({ ...newVessel, status: value as "active" | "inactive" })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormDialog>
    </PageWrapper>
  )
}
