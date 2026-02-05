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
// FOLDER & FILE TYPES (New Document Management System)
// ========================================

// Assignment target type
export type AssignmentType = "vessel" | "company" | "user"

export interface Assignment {
  type: AssignmentType
  targetId: string // vessel ID, "company", or user ID
  targetName: string // Display name
}

// Folder with color and assignment
export interface DocumentFolder {
  id: string
  name: string
  color: string // Hex color code
  createdBy: string
  createdAt: string
  assignments: Assignment[]
  filesCount: number
}

// File inside a folder
export interface DocumentFile {
  id: string
  folderId: string
  name: string
  type: "pdf" | "image" | "excel" | "word" | "other"
  mimeType: string
  size: string
  uploadedBy: string
  uploadedAt: string
  assignments: Assignment[] // Can override folder assignment
  url?: string // For preview
  expirationDate?: string // Date when the document expires
  notes: FileNote[] // Notes/tickets attached to the file
  spreadsheetData?: SpreadsheetData // Parsed data for Excel/CSV files
}

// Spreadsheet data for Excel/CSV preview
export interface SpreadsheetData {
  headers: string[]
  rows: (string | number | null)[][]
  sheetNames?: string[]
  activeSheet?: string
}

// Note/Ticket attached to a file
export interface FileNote {
  id: string
  title: string
  content: string
  summary?: string // Summary of file content
  createdBy: string
  createdAt: string
  expirationDate?: string // Expiration reminder
  priority: "low" | "medium" | "high"
}

export type DocumentFolderFormData = Omit<DocumentFolder, "id" | "createdAt" | "filesCount">
export type DocumentFileFormData = Omit<DocumentFile, "id" | "uploadedAt" | "notes">

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
