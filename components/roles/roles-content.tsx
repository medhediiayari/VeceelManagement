"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Loader2 } from "lucide-react"
import { PageWrapper, DataTable, FormDialog, type Column } from "@/components/shared"
import type { Role } from "@/types"

// Available permissions
const allPermissions = [
  "view_vessel",
  "manage_crew",
  "file_reports",
  "manage_security",
  "upload_documents",
  "create_folders",
  "add_notes",
  "view_all",
  "manage_documents",
  "approve_documents",
]

/**
 * RolesContent - Role management component
 * 
 * Isolated component for role CRUD operations
 */
export function RolesContent() {
  // State management
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })

  // Fetch roles from API
  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/roles")
      const data = await response.json()
      if (data.success) {
        setRoles(data.data.map((r: Role & { _count?: { users: number } }) => ({
          ...r,
          usersCount: r._count?.users || 0,
        })))
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  // Form validation
  const isFormValid = Boolean(newRole.name && newRole.description)

  // Handlers
  const handleAddRole = async () => {
    if (!isFormValid) return

    try {
      setIsSaving(true)
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRole.name,
          description: newRole.description,
          permissions: newRole.permissions,
        }),
      })

      if (response.ok) {
        await fetchRoles()
        resetForm()
        setIsAddDialogOpen(false)
      }
    } catch (error) {
      console.error("Error adding role:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRole = async (role: Role) => {
    try {
      const response = await fetch(`/api/roles/${role.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setRoles(roles.filter((r) => r.id !== role.id))
      }
    } catch (error) {
      console.error("Error deleting role:", error)
    }
  }

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    if (checked) {
      setNewRole({ ...newRole, permissions: [...newRole.permissions, permission] })
    } else {
      setNewRole({
        ...newRole,
        permissions: newRole.permissions.filter((p) => p !== permission),
      })
    }
  }

  const resetForm = () => {
    setNewRole({ name: "", description: "", permissions: [] })
  }

  // Table configuration
  const columns: Column<Role>[] = [
    { key: "name", header: "Role Name" },
    { key: "description", header: "Description", className: "max-w-xs" },
    {
      key: "permissions",
      header: "Permissions",
      render: (role) => (
        <div className="flex flex-wrap gap-1">
          {role.permissions.slice(0, 3).map((perm) => (
            <Badge key={perm} variant="secondary" className="text-xs">
              {perm}
            </Badge>
          ))}
          {role.permissions.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{role.permissions.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "usersCount",
      header: "Users",
      render: (role) => <Badge variant="outline">{role.usersCount}</Badge>,
    },
  ]

  // Action button
  const AddRoleButton = (
    <Button
      className="w-full sm:w-auto h-9 px-4 text-sm font-medium"
      onClick={() => setIsAddDialogOpen(true)}
    >
      <Plus className="w-4 h-4 mr-2" />
      Ajouter un rôle
    </Button>
  )

  if (isLoading) {
    return (
      <PageWrapper
        title="Gestion des rôles"
        description="Configurez les rôles avec des permissions spécifiques."
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Gestion des rôles"
      description="Configurez les rôles avec des permissions spécifiques."
      actions={AddRoleButton}
    >
      <DataTable
        data={roles}
        columns={columns}
        actions={{
          onEdit: (role) => console.log("Edit:", role),
          onDelete: handleDeleteRole,
        }}
        emptyMessage="No roles configured. Add your first role to get started."
      />

      {/* Add Role Dialog */}
      <FormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Add New Role"
        description="Create a new role with specific permissions."
        onSubmit={handleAddRole}
        submitLabel="Add Role"
        isValid={isFormValid}
      >
        <div className="space-y-2">
          <Label htmlFor="role-name">Role Name</Label>
          <Input
            id="role-name"
            placeholder="e.g., Chief Engineer"
            value={newRole.name}
            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role-description">Description</Label>
          <Textarea
            id="role-description"
            placeholder="Describe the role responsibilities..."
            value={newRole.description}
            onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Permissions</Label>
          <div className="border rounded-md p-3 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {allPermissions.map((permission) => (
              <div key={permission} className="flex items-center space-x-2">
                <Checkbox
                  id={`perm-${permission}`}
                  checked={newRole.permissions.includes(permission)}
                  onCheckedChange={(checked) =>
                    handlePermissionToggle(permission, checked as boolean)
                  }
                />
                <Label htmlFor={`perm-${permission}`} className="text-sm font-normal">
                  {permission.replace(/_/g, " ")}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </FormDialog>
    </PageWrapper>
  )
}
