"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"
import { PageWrapper, DataTable, FormDialog, type Column } from "@/components/shared"
import { mockRoles } from "@/data/mock-data"
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
  const [roles, setRoles] = useState<Role[]>(mockRoles)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })

  // Form validation
  const isFormValid = Boolean(newRole.name && newRole.description)

  // Handlers
  const handleAddRole = () => {
    if (!isFormValid) return

    const role: Role = {
      id: String(roles.length + 1),
      name: newRole.name,
      description: newRole.description,
      permissions: newRole.permissions,
      usersCount: 0,
    }

    setRoles([...roles, role])
    resetForm()
    setIsAddDialogOpen(false)
  }

  const handleDeleteRole = (role: Role) => {
    setRoles(roles.filter((r) => r.id !== role.id))
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
      Add Role
    </Button>
  )

  return (
    <PageWrapper
      title="Roles Management"
      description="Configure roles with specific permissions for crew members."
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
