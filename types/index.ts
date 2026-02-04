// ========================================
// VESSEL TYPES
// ========================================
export interface Vessel {
  id: string
  name: string
  captain: string
  usersCount: number
  status: "active" | "inactive"
  imo: string
}

export type VesselFormData = Omit<Vessel, "id" | "usersCount">

// ========================================
// USER TYPES
// ========================================
export interface User {
  id: string
  name: string
  email: string
  role: string
  vessels: string[]
  status: "active" | "inactive"
}

export type UserFormData = Omit<User, "id">

// ========================================
// ROLE TYPES
// ========================================
export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  usersCount: number
}

export type RoleFormData = Omit<Role, "id" | "usersCount">

// ========================================
// DOCUMENT TYPES
// ========================================
export interface Document {
  id: string
  name: string
  type: string
  vessel: string
  uploadedBy: string
  uploadedAt: string
  status: "approved" | "pending" | "rejected"
  size: string
}

export type DocumentFormData = Omit<Document, "id" | "uploadedAt" | "status">

// ========================================
// ACTIVITY TYPES
// ========================================
export interface Activity {
  action: string
  details: string
  timestamp: string
  type: "create" | "upload" | "config" | "update" | "delete"
}

// ========================================
// STATS TYPES
// ========================================
export interface StatCard {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  trend: string
}

// ========================================
// COMMON TYPES
// ========================================
export type Status = "active" | "inactive"
export type DialogMode = "create" | "edit" | "view" | null
