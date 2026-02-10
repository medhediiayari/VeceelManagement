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
import { Plus, Loader2 } from "lucide-react"
import { PageWrapper, DataTable, FormDialog, StatusBadge, type Column } from "@/components/shared"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  avatar: string | null
  phone: string | null
  vesselId: string | null
  vesselName: string | null
  vessels: string[]
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

interface Vessel {
  id: string
  name: string
}

const ROLES = [
  // Company roles (Shore)
  { value: "ADMIN", label: "Administrateur", type: "company" as const },
  { value: "CSO", label: "CSO", type: "company" as const },
  { value: "DPA", label: "DPA", type: "company" as const },
  { value: "OPS", label: "OPS", type: "company" as const },
  { value: "FINANCE", label: "Finance", type: "company" as const },
  { value: "COMPTABILITE", label: "Comptabilité", type: "company" as const },
  { value: "DIRECTION_TECHNIQUE", label: "Direction Technique", type: "company" as const },
  { value: "DIRECTION_GENERALE", label: "Direction Générale", type: "company" as const },
  { value: "COMMERCIAL", label: "Commercial", type: "company" as const },
  // Vessel roles (On-board)
  { value: "CAPITAINE", label: "Capitaine (Master)", type: "vessel" as const },
  { value: "CHIEF_MATE", label: "Chief Mate", type: "vessel" as const },
  { value: "CHEF_MECANICIEN", label: "Chef Mécanicien", type: "vessel" as const },
  { value: "SECOND", label: "Second", type: "vessel" as const },
  { value: "YOTNA", label: "Yotna", type: "vessel" as const },
]

const isVesselRole = (role: string) => {
  const roleConfig = ROLES.find(r => r.value === role)
  return roleConfig?.type === "vessel"
}

const COMPANY_ROLES = ROLES.filter(r => r.type === "company")
const VESSEL_ROLES = ROLES.filter(r => r.type === "vessel")

export function UsersContent() {
  const [users, setUsers] = useState<User[]>([])
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState({
    name: "",
    email: "",
    role: "",
    vesselId: "",
    phone: "",
    status: "ACTIVE",
  })
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    vesselId: "",
    phone: "",
    status: "ACTIVE",
  })

  // Fetch users and vessels
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [usersRes, vesselsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/vessels"),
      ])
      
      const usersData = await usersRes.json()
      const vesselsData = await vesselsRes.json()
      
      if (usersData.success) setUsers(usersData.data)
      if (vesselsData.success) setVessels(vesselsData.data)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Form validation
  const isFormValid = Boolean(newUser.name && newUser.email && newUser.password && newUser.role)

  // Handlers
  const handleAddUser = async () => {
    if (!isFormValid) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })

      const data = await response.json()
      if (data.success) {
        await fetchData()
        resetForm()
        setIsAddDialogOpen(false)
      } else {
        console.error("Error:", data.error)
        alert(data.error)
      }
    } catch (error) {
      console.error("Error creating user:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Supprimer l'utilisateur "${user.name}" ?`)) return

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== user.id))
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const resetForm = () => {
    setNewUser({ name: "", email: "", password: "", role: "", vesselId: "", phone: "", status: "ACTIVE" })
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditUser({
      name: user.name,
      email: user.email,
      role: user.role,
      vesselId: user.vesselId || "",
      phone: user.phone || "",
      status: user.status,
    })
    setIsEditDialogOpen(true)
  }

  const handleEditUser = async () => {
    if (!selectedUser || !editUser.name || !editUser.email || !editUser.role) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editUser),
      })

      const data = await response.json()
      if (data.success) {
        await fetchData()
        setIsEditDialogOpen(false)
        setSelectedUser(null)
      } else {
        console.error("Error:", data.error)
        alert(data.error)
      }
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, "active" | "inactive" | "pending"> = {
      ACTIVE: "active",
      INACTIVE: "inactive",
      SUSPENDED: "pending",
    }
    return statusMap[status] || "inactive"
  }

  const getRoleLabel = (role: string) => {
    return ROLES.find(r => r.value === role)?.label || role
  }

  // Table configuration
  const columns: Column<User>[] = [
    { 
      key: "name", 
      header: "Utilisateur",
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xs font-semibold">
            {getInitials(user.name)}
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      )
    },
    {
      key: "role",
      header: "Rôle",
      render: (user) => (
        <Badge variant="secondary" className="font-medium">
          {getRoleLabel(user.role)}
        </Badge>
      ),
    },
    {
      key: "vesselName",
      header: "Navire assigné",
      render: (user) => user.vesselName ? (
        <Badge variant="outline" className="text-xs bg-secondary/50">
          {user.vesselName}
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: "phone",
      header: "Téléphone",
      render: (user) => user.phone || "-",
    },
    {
      key: "status",
      header: "Statut",
      render: (user) => <StatusBadge status={getStatusDisplay(user.status)} />,
    },
  ]

  const AddUserButton = (
    <Button
      className="w-full sm:w-auto h-9 px-4 text-sm font-medium"
      onClick={() => setIsAddDialogOpen(true)}
    >
      <Plus className="w-4 h-4 mr-2" />
      Ajouter un utilisateur
    </Button>
  )

  if (isLoading) {
    return (
      <PageWrapper
        title="Gestion des utilisateurs"
        description="Gérez les utilisateurs Company et Vessel."
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Gestion des utilisateurs"
      description="Gérez les utilisateurs Company (shore) et Vessel (bord) avec leurs rôles et accès."
      actions={AddUserButton}
    >
      <DataTable
        data={users}
        columns={columns}
        actions={{
          onEdit: openEditDialog,
          onDelete: handleDeleteUser,
        }}
        emptyMessage="Aucun utilisateur trouvé. Ajoutez votre premier utilisateur pour commencer."
      />

      <FormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Ajouter un utilisateur"
        description="Créez un nouveau compte utilisateur. Sélectionnez un rôle Company (shore) ou Vessel (bord)."
        onSubmit={handleAddUser}
        submitLabel={isSubmitting ? "Ajout en cours..." : "Ajouter l'utilisateur"}
        isValid={isFormValid && !isSubmitting}
      >
        <div className="space-y-2">
          <Label htmlFor="user-name">Nom complet *</Label>
          <Input
            id="user-name"
            placeholder="ex: Jean Dupont"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-email">Adresse email *</Label>
          <Input
            id="user-email"
            type="email"
            placeholder="ex: jean@exemple.com"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-password">Mot de passe *</Label>
          <Input
            id="user-password"
            type="password"
            placeholder="Minimum 8 caractères"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="user-role">Rôle *</Label>
            <Select
              value={newUser.role}
              onValueChange={(value) => {
                const isVessel = isVesselRole(value)
                setNewUser({ 
                  ...newUser, 
                  role: value,
                  vesselId: isVessel ? newUser.vesselId : "" 
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Company (Shore)</div>
                {COMPANY_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Vessel (Bord)</div>
                {VESSEL_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isVesselRole(newUser.role) && (
            <div className="space-y-2">
              <Label htmlFor="user-vessel">Navire assigné *</Label>
              <Select
                value={newUser.vesselId || "none"}
                onValueChange={(value) => setNewUser({ ...newUser, vesselId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un navire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {vessels.map((vessel) => (
                    <SelectItem key={vessel.id} value={vessel.id}>
                      {vessel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="user-phone">Téléphone</Label>
            <Input
              id="user-phone"
              placeholder="ex: +33 6 12 34 56 78"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-status">Statut</Label>
            <Select
              value={newUser.status}
              onValueChange={(value) => setNewUser({ ...newUser, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="INACTIVE">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormDialog>

      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Modifier l'utilisateur"
        description="Modifiez les informations du membre d'équipage."
        onSubmit={handleEditUser}
        submitLabel={isSubmitting ? "Modification en cours..." : "Enregistrer les modifications"}
        isValid={!!editUser.name && !!editUser.email && !!editUser.role && !isSubmitting}
      >
        <div className="space-y-2">
          <Label htmlFor="edit-user-name">Nom complet *</Label>
          <Input
            id="edit-user-name"
            placeholder="ex: Jean Dupont"
            value={editUser.name}
            onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-user-email">Adresse email *</Label>
          <Input
            id="edit-user-email"
            type="email"
            placeholder="ex: jean@exemple.com"
            value={editUser.email}
            onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-user-role">Rôle *</Label>
            <Select
              value={editUser.role}
              onValueChange={(value) => {
                const isVessel = isVesselRole(value)
                setEditUser({ 
                  ...editUser, 
                  role: value,
                  vesselId: isVessel ? editUser.vesselId : "" 
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Company (Shore)</div>
                {COMPANY_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Vessel (Bord)</div>
                {VESSEL_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isVesselRole(editUser.role) && (
            <div className="space-y-2">
              <Label htmlFor="edit-user-vessel">Navire assigné *</Label>
              <Select
                value={editUser.vesselId || "none"}
                onValueChange={(value) => setEditUser({ ...editUser, vesselId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un navire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {vessels.map((vessel) => (
                    <SelectItem key={vessel.id} value={vessel.id}>
                      {vessel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-user-phone">Téléphone</Label>
            <Input
              id="edit-user-phone"
              placeholder="ex: +33 6 12 34 56 78"
              value={editUser.phone}
              onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-user-status">Statut</Label>
            <Select
              value={editUser.status}
              onValueChange={(value) => setEditUser({ ...editUser, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="INACTIVE">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormDialog>
    </PageWrapper>
  )
}
