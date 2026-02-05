import type { Vessel, User, Role, Document, Activity, DocumentFolder, DocumentFile, FileNote } from "@/types"

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

// Folder colors available for selection
export const FOLDER_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Red", value: "#ef4444" },
  { name: "Yellow", value: "#eab308" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Gray", value: "#6b7280" },
]

// ========================================
// DOCUMENT FOLDERS DATA
// ========================================
export const mockDocumentFolders: DocumentFolder[] = [
  {
    id: "folder-1",
    name: "SecuritéGaliteFiles",
    color: "#3b82f6",
    createdBy: "Ahmed Hassan",
    createdAt: "2024-01-10",
    assignments: [
      { type: "vessel", targetId: "2", targetName: "Galite" }
    ],
    filesCount: 3,
  },
  {
    id: "folder-2",
    name: "ISPS Compliance",
    color: "#22c55e",
    createdBy: "Ahmed Hassan",
    createdAt: "2024-01-08",
    assignments: [
      { type: "vessel", targetId: "1", targetName: "MV Iskander" },
      { type: "vessel", targetId: "2", targetName: "Galite" }
    ],
    filesCount: 2,
  },
  {
    id: "folder-3",
    name: "Internal HR Documents",
    color: "#a855f7",
    createdBy: "Sarah Wilson",
    createdAt: "2024-01-05",
    assignments: [
      { type: "company", targetId: "company", targetName: "Company Internal" }
    ],
    filesCount: 4,
  },
  {
    id: "folder-4",
    name: "Captain Reports",
    color: "#f97316",
    createdBy: "Ahmed Hassan",
    createdAt: "2024-01-12",
    assignments: [
      { type: "user", targetId: "1", targetName: "John Smith (Captain)" }
    ],
    filesCount: 1,
  },
]

// ========================================
// DOCUMENT FILES DATA
// ========================================
export const mockDocumentFiles: DocumentFile[] = [
  // Files in SecuritéGaliteFiles folder
  {
    id: "file-1",
    folderId: "folder-1",
    name: "Security Plan 2024.pdf",
    type: "pdf",
    mimeType: "application/pdf",
    size: "2.4 MB",
    uploadedBy: "Ahmed Hassan",
    uploadedAt: "2024-01-15",
    assignments: [],
    expirationDate: "2026-02-10",
    notes: [
      {
        id: "note-1",
        title: "Annual Review Required",
        content: "This security plan needs to be reviewed and updated before expiration.",
        summary: "Security protocols for vessel Galite - includes emergency procedures, access control, and incident response.",
        createdBy: "Ahmed Hassan",
        createdAt: "2024-01-15",
        expirationDate: "2026-02-10",
        priority: "high",
      },
    ],
  },
  {
    id: "file-2",
    folderId: "folder-1",
    name: "Emergency Procedures.pdf",
    type: "pdf",
    mimeType: "application/pdf",
    size: "1.8 MB",
    uploadedBy: "Ahmed Hassan",
    uploadedAt: "2024-01-14",
    assignments: [],
    expirationDate: "2026-03-15",
    notes: [
      {
        id: "note-2",
        title: "Crew Training Update",
        content: "Ensure all crew members have reviewed this document before March.",
        summary: "Emergency evacuation procedures, fire response, man overboard protocols.",
        createdBy: "Ahmed Hassan",
        createdAt: "2024-01-14",
        priority: "medium",
      },
    ],
  },
  {
    id: "file-3",
    folderId: "folder-1",
    name: "Vessel Photo.jpg",
    type: "image",
    mimeType: "image/jpeg",
    size: "3.2 MB",
    uploadedBy: "Maria Rodriguez",
    uploadedAt: "2024-01-13",
    assignments: [],
    notes: [],
  },
  // Files in ISPS Compliance folder
  {
    id: "file-4",
    folderId: "folder-2",
    name: "ISPS Code Compliance.pdf",
    type: "pdf",
    mimeType: "application/pdf",
    size: "5.1 MB",
    uploadedBy: "Ahmed Hassan",
    uploadedAt: "2024-01-12",
    assignments: [],
    expirationDate: "2026-02-08",
    notes: [
      {
        id: "note-3",
        title: "URGENT: Renewal Required",
        content: "ISPS certificate expires soon. Contact classification society for renewal audit.",
        summary: "International Ship and Port Facility Security Code compliance documentation.",
        createdBy: "Sarah Wilson",
        createdAt: "2024-01-12",
        expirationDate: "2026-02-08",
        priority: "high",
      },
    ],
  },
  {
    id: "file-5",
    folderId: "folder-2",
    name: "Compliance Checklist.xlsx",
    type: "excel",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: "0.8 MB",
    uploadedBy: "Sarah Wilson",
    uploadedAt: "2024-01-11",
    assignments: [],
    notes: [
      {
        id: "note-4",
        title: "Monthly Verification",
        content: "Use this checklist for monthly compliance verification.",
        summary: "Checklist with 45 compliance items covering safety, security, and environmental requirements.",
        createdBy: "Sarah Wilson",
        createdAt: "2024-01-11",
        priority: "low",
      },
    ],
  },
  // Files in Internal HR Documents folder
  {
    id: "file-6",
    folderId: "folder-3",
    name: "Employee Handbook.pdf",
    type: "pdf",
    mimeType: "application/pdf",
    size: "4.2 MB",
    uploadedBy: "Sarah Wilson",
    uploadedAt: "2024-01-10",
    assignments: [],
    notes: [],
  },
  {
    id: "file-7",
    folderId: "folder-3",
    name: "Salary Structure.xlsx",
    type: "excel",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: "1.1 MB",
    uploadedBy: "Sarah Wilson",
    uploadedAt: "2024-01-09",
    assignments: [],
    notes: [],
  },
  {
    id: "file-8",
    folderId: "folder-3",
    name: "Training Schedule.docx",
    type: "word",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: "0.5 MB",
    uploadedBy: "Sarah Wilson",
    uploadedAt: "2024-01-08",
    assignments: [],
    notes: [],
  },
  {
    id: "file-9",
    folderId: "folder-3",
    name: "Company Logo.png",
    type: "image",
    mimeType: "image/png",
    size: "0.3 MB",
    uploadedBy: "Sarah Wilson",
    uploadedAt: "2024-01-07",
    assignments: [],
    notes: [],
  },
  // Files in Captain Reports folder
  {
    id: "file-10",
    folderId: "folder-4",
    name: "Monthly Report Jan 2024.pdf",
    type: "pdf",
    mimeType: "application/pdf",
    size: "1.5 MB",
    uploadedBy: "John Smith",
    uploadedAt: "2024-01-31",
    assignments: [],
    expirationDate: "2026-04-30",
    notes: [
      {
        id: "note-5",
        title: "Review Completed",
        content: "Report reviewed and approved by DPA.",
        summary: "Monthly operational report including fuel consumption, maintenance activities, and incident log.",
        createdBy: "John Smith",
        createdAt: "2024-02-01",
        priority: "low",
      },
    ],
  },
]
