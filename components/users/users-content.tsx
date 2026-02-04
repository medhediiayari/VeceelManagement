"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { PageWrapper, DataTable, FormDialog, StatusBadge, type Column } from "@/components/shared"
import { mockUsers, vesselNames, roleNames } from "@/data/mock-data"
import type { User } from "@/types"

/**
 * UsersContent - User management component
 * 
 * Isolated component for user CRUD operations
 * Easy to test and debug independently
 */
export function UsersContent() {
  // State management
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    vessels: [] as string[],
    status: "active" as const,
  })

  // Form validation
  const isFormValid = Boolean(
    newUser.name && newUser.email && newUser.role && newUser.vessels.length > 0
  )

  // Handlers
  const handleAddUser = () => {
    if (!isFormValid) return

    const user: User = {
      id: String(users.length + 1),
      ...newUser,
    }

    setUsers([...users, user])
    resetForm()
    setIsAddDialogOpen(false)
  }

  const handleDeleteUser = (user: User) => {
    setUsers(users.filter((u) => u.id !== user.id))
  }

  const handleVesselToggle = (vessel: string, checked: boolean) => {
    if (checked) {
      setNewUser({ ...newUser, vessels: [...newUser.vessels, vessel] })
    } else {
      setNewUser({ ...newUser, vessels: newUser.vessels.filter((v) => v !== vessel) })
    }
  }

  const resetForm = () => {
    setNewUser({ name: "", email: "", role: "", vessels: [], status: "active" })
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Table configuration
  const columns: Column<User>[] = [
    { 
      key: "name", 
      header: "User",
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
      header: "Role",
      render: (user) => (
        <Badge variant="secondary" className="font-medium">
          {user.role}
        </Badge>
      ),
    },
    {
      key: "vessels",
      header: "Assigned Vessels",
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.vessels.map((vessel) => (
            <Badge key={vessel} variant="outline" className="text-xs bg-secondary/50">
              {vessel}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => <StatusBadge status={user.status} />,
    },
  ]

  // Action button
  const AddUserButton = (
    <Button
      className="w-full sm:w-auto h-9 px-4 text-sm font-medium"
      onClick={() => setIsAddDialogOpen(true)}
    >
      <Plus className="w-4 h-4 mr-2" />
      Add User
    </Button>
  )

  return (
    <PageWrapper
      title="Users Management"
      description="Manage crew members with role assignments and vessel access control."
      actions={AddUserButton}
    >
      <DataTable
        data={users}
        columns={columns}
        actions={{
          onEdit: (user) => console.log("Edit:", user),
          onDelete: handleDeleteUser,
        }}
        emptyMessage="No users found. Add your first user to get started."
      />

      {/* Add User Dialog */}
      <FormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Add New User"
        description="Create a new crew member with role and vessel assignments."
        onSubmit={handleAddUser}
        submitLabel="Add User"
        isValid={isFormValid}
      >
        <div className="space-y-2">
          <Label htmlFor="user-name">Full Name</Label>
          <Input
            id="user-name"
            placeholder="e.g., John Smith"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-email">Email Address</Label>
          <Input
            id="user-email"
            type="email"
            placeholder="e.g., john@example.com"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-role">Role</Label>
          <Select
            value={newUser.role}
            onValueChange={(value) => setNewUser({ ...newUser, role: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roleNames.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Assigned Vessels</Label>
          <div className="border rounded-md p-3 space-y-2">
            {vesselNames.map((vessel) => (
              <div key={vessel} className="flex items-center space-x-2">
                <Checkbox
                  id={`vessel-${vessel}`}
                  checked={newUser.vessels.includes(vessel)}
                  onCheckedChange={(checked) => handleVesselToggle(vessel, checked as boolean)}
                />
                <Label htmlFor={`vessel-${vessel}`} className="text-sm font-normal">
                  {vessel}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-status">Status</Label>
          <Select
            value={newUser.status}
            onValueChange={(value) =>
              setNewUser({ ...newUser, status: value as "active" | "inactive" })
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
