import type { Vessel, User, Role, Document, Activity } from "@/types"

// ========================================
// VESSELS DATA
// ========================================
export const mockVessels: Vessel[] = [
  {
    id: "1",
    name: "MV Iskander",
    captain: "Captain John Smith",
    usersCount: 8,
    status: "active",
    imo: "9876543",
  },
  {
    id: "2",
    name: "Galite",
    captain: "Captain Maria Rodriguez",
    usersCount: 6,
    status: "active",
    imo: "9876544",
  },
]

export const vesselNames = mockVessels.map((v) => v.name)

// ========================================
// USERS DATA
// ========================================
export const mockUsers: User[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    role: "Captain",
    vessels: ["MV Iskander"],
    status: "active",
  },
  {
    id: "2",
    name: "Maria Rodriguez",
    email: "maria.rodriguez@example.com",
    role: "Captain",
    vessels: ["Galite"],
    status: "active",
  },
  {
    id: "3",
    name: "Ahmed Hassan",
    email: "ahmed.hassan@example.com",
    role: "CSO",
    vessels: ["MV Iskander", "Galite"],
    status: "active",
  },
  {
    id: "4",
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    role: "DPA",
    vessels: ["MV Iskander", "Galite"],
    status: "active",
  },
  {
    id: "5",
    name: "James Brown",
    email: "james.brown@example.com",
    role: "CSO",
    vessels: ["MV Iskander"],
    status: "inactive",
  },
]

// ========================================
// ROLES DATA
// ========================================
export const mockRoles: Role[] = [
  {
    id: "1",
    name: "Captain",
    description: "Ship captain with full vessel control",
    permissions: ["vessel.view", "vessel.edit", "crew.manage", "documents.all"],
    usersCount: 2,
  },
  {
    id: "2",
    name: "CSO",
    description: "Company Security Officer",
    permissions: ["security.manage", "documents.view", "reports.create"],
    usersCount: 2,
  },
  {
    id: "3",
    name: "DPA",
    description: "Designated Person Ashore",
    permissions: ["compliance.manage", "documents.approve", "reports.all"],
    usersCount: 1,
  },
]

export const roleNames = mockRoles.map((r) => r.name)

// ========================================
// DOCUMENTS DATA
// ========================================
export const mockDocuments: Document[] = [
  {
    id: "1",
    name: "ISPS Code Compliance.pdf",
    type: "Compliance",
    vessel: "MV Iskander",
    uploadedBy: "Ahmed Hassan",
    uploadedAt: "2024-01-15",
    status: "approved",
    size: "2.4 MB",
  },
  {
    id: "2",
    name: "Safety Management Manual.pdf",
    type: "Safety",
    vessel: "Galite",
    uploadedBy: "Sarah Wilson",
    uploadedAt: "2024-01-14",
    status: "pending",
    size: "5.1 MB",
  },
  {
    id: "3",
    name: "Crew Certification List.xlsx",
    type: "Certification",
    vessel: "MV Iskander",
    uploadedBy: "John Smith",
    uploadedAt: "2024-01-13",
    status: "pending",
    size: "1.2 MB",
  },
]

// ========================================
// ACTIVITY DATA
// ========================================
export const mockActivities: Activity[] = [
  {
    action: "User Created",
    details: "Ahmed Hassan added as CSO",
    timestamp: "2 hours ago",
    type: "create",
  },
  {
    action: "Document Uploaded",
    details: "ISPS Code Compliance.pdf uploaded",
    timestamp: "4 hours ago",
    type: "upload",
  },
  {
    action: "Role Created",
    details: "DPA role configured with permissions",
    timestamp: "1 day ago",
    type: "config",
  },
  {
    action: "Vessel Added",
    details: "MV Iskander registered in fleet",
    timestamp: "2 days ago",
    type: "create",
  },
]

// ========================================
// CONSTANTS
// ========================================
export const DOCUMENT_TYPES = ["Compliance", "Safety", "Certification", "Training", "Report"]
export const USER_STATUSES = ["active", "inactive"] as const
export const VESSEL_STATUSES = ["active", "inactive"] as const
