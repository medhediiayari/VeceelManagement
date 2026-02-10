"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Plus,
  Upload,
  FileText,
  Folder,
  MoreVertical,
  Trash2,
  Edit,
  Share2,
  ArrowLeft,
  FileImage,
  FileSpreadsheet,
  File,
  Building2,
  Ship,
  User,
  Search,
  Grid3X3,
  List,
  Download,
  Eye,
  StickyNote,
  Calendar,
  AlertTriangle,
  Clock,
  X,
  Bell,
  Table as TableIcon,
  Loader2,
  LayoutGrid,
  Rows3,
  StretchHorizontal,
} from "lucide-react"
import { PageWrapper } from "@/components/shared"
import { FOLDER_COLORS } from "@/data/mock-data"
import type { DocumentFolder, DocumentFile, Assignment, AssignmentType, FileNote } from "@/types"
import * as XLSX from "xlsx"
import { cn } from "@/lib/utils"

// File type icon mapping
const getFileIcon = (type: DocumentFile["type"]) => {
  switch (type) {
    case "pdf":
      return FileText
    case "image":
      return FileImage
    case "excel":
      return FileSpreadsheet
    case "word":
      return FileText
    default:
      return File
  }
}

// Get file type from mime type
const getFileTypeFromMime = (mimeType: string): DocumentFile["type"] => {
  if (mimeType.includes("pdf")) return "pdf"
  if (mimeType.includes("image")) return "image"
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "excel"
  if (mimeType.includes("word") || mimeType.includes("document")) return "word"
  return "other"
}

// Format file size from bytes to human-readable format
const formatFileSize = (bytes: number | string): string => {
  if (typeof bytes === 'string') return bytes // Already formatted
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Check if a date is expiring soon (within 7 days) or already expired
const getExpirationStatus = (expirationDate?: string): "expired" | "expiring" | "ok" | null => {
  if (!expirationDate) return null
  const now = new Date()
  const expDate = new Date(expirationDate)
  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return "expired"
  if (diffDays <= 7) return "expiring"
  return "ok"
}

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/**
 * DocumentsContent - Document management component with folders and file sharing
 * 
 * Features:
 * - Create folders with custom names and colors
 * - Drag and drop file upload
 * - Assign folders/files to vessels, company, or specific users
 * - File preview and management
 * - Notes/tickets with expiration dates
 * - Expiration alerts
 */
export function DocumentsContent() {
  // State management
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [files, setFiles] = useState<DocumentFile[]>([])
  const [vessels, setVessels] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role?: string; vesselId?: string | null } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"tiles" | "list" | "compact">("tiles")
  const [isDragging, setIsDragging] = useState(false)

  // Vessel roles (read-only access)
  const VESSEL_ROLES = ["CAPITAINE", "CHIEF_MATE", "CHEF_MECANICIEN", "SECOND", "YOTNA"]
  const isReadOnly = currentUser?.role && VESSEL_ROLES.includes(currentUser.role)

  // Dialog states
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isViewNotesOpen, setIsViewNotesOpen] = useState(false)
  const [showAlerts, setShowAlerts] = useState(true)
  const [assignTarget, setAssignTarget] = useState<{ type: "folder" | "file"; item: DocumentFolder | DocumentFile } | null>(null)
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null)
  const [previewFile, setPreviewFile] = useState<DocumentFile | null>(null)
  const [noteTargetFile, setNoteTargetFile] = useState<DocumentFile | null>(null)
  const [editingNote, setEditingNote] = useState<FileNote | null>(null)

  // New folder form
  const [newFolder, setNewFolder] = useState({
    name: "",
    color: FOLDER_COLORS[0].value,
    vesselId: "",
  })

  // New note form
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    summary: "",
    expirationDate: "",
    priority: "medium" as FileNote["priority"],
  })

  // Assignment form
  const [assignmentForm, setAssignmentForm] = useState<{
    type: AssignmentType
    targetId: string
  }>({
    type: "vessel",
    targetId: "",
  })

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [foldersRes, documentsRes, vesselsRes, usersRes, sessionRes] = await Promise.all([
        fetch("/api/documents/folders"),
        fetch("/api/documents"),
        fetch("/api/vessels"),
        fetch("/api/users"),
        fetch("/api/auth/session"),
      ])

      const [foldersData, documentsData, vesselsData, usersData, sessionData] = await Promise.all([
        foldersRes.json(),
        documentsRes.json(),
        vesselsRes.json(),
        usersRes.json(),
        sessionRes.json(),
      ])

      if (foldersData.success) {
        setFolders(foldersData.data.map((f: DocumentFolder & { documentsCount?: number }) => ({
          ...f,
          filesCount: f.documentsCount || 0,
          assignments: f.assignments || [],
        })))
      }
      if (documentsData.success) {
        setFiles(documentsData.data.map((d: DocumentFile & { uploadedBy?: { id: string; name: string } | string }) => ({
          ...d,
          uploadedBy: typeof d.uploadedBy === 'object' && d.uploadedBy !== null ? d.uploadedBy.name : d.uploadedBy,
          notes: d.notes || [],
          assignments: d.assignments || [],
        })))
      }
      if (vesselsData.success) {
        setVessels(vesselsData.data.map((v: { id: string; name: string }) => ({ id: v.id, name: v.name })))
      }
      if (usersData.success) {
        setUsers(usersData.data.map((u: { id: string; name: string }) => ({ id: u.id, name: u.name })))
      }
      if (sessionData.authenticated && sessionData.user) {
        setCurrentUser({ 
          id: sessionData.user.id, 
          name: sessionData.user.name,
          role: sessionData.user.role,
          vesselId: sessionData.user.vesselId,
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Computed values
  const currentFolderFiles = useMemo(() => {
    if (!selectedFolder) return []
    return files.filter((f) => f.folderId === selectedFolder.id)
  }, [selectedFolder, files])

  const filteredFolders = useMemo(() => {
    if (!searchQuery) return folders
    return folders.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [folders, searchQuery])

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return currentFolderFiles
    return currentFolderFiles.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [currentFolderFiles, searchQuery])

  // Get files with expiration alerts
  const expiringFiles = useMemo(() => {
    return files.filter((f) => {
      const status = getExpirationStatus(f.expirationDate)
      return status === "expired" || status === "expiring"
    }).map((f) => ({
      file: f,
      status: getExpirationStatus(f.expirationDate)!,
      folder: folders.find((folder) => folder.id === f.folderId),
    }))
  }, [files, folders])

  // Handlers
  const handleCreateFolder = async () => {
    if (!newFolder.name || !currentUser) return

    try {
      const response = await fetch("/api/documents/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolder.name,
          color: newFolder.color,
          vesselId: newFolder.vesselId || null,
          createdById: currentUser.id,
        }),
      })

      const result = await response.json()
      if (result.success) {
        await fetchData() // Refresh data from server
      } else {
        console.error("Error creating folder:", result.error)
      }
    } catch (error) {
      console.error("Error creating folder:", error)
    }

    setNewFolder({ name: "", color: FOLDER_COLORS[0].value, vesselId: "" })
    setIsCreateFolderOpen(false)
  }

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolder.name) return

    try {
      const response = await fetch(`/api/documents/folders/${editingFolder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolder.name,
          color: newFolder.color,
          vesselId: newFolder.vesselId || null,
        }),
      })

      const result = await response.json()
      if (result.success) {
        await fetchData() // Refresh data from server
      } else {
        console.error("Error updating folder:", result.error)
      }
    } catch (error) {
      console.error("Error updating folder:", error)
    }

    setEditingFolder(null)
    setNewFolder({ name: "", color: FOLDER_COLORS[0].value, vesselId: "" })
    setIsEditFolderOpen(false)
  }

  const handleDeleteFolder = async (folder: DocumentFolder) => {
    try {
      const response = await fetch(`/api/documents/folders/${folder.id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        if (selectedFolder?.id === folder.id) {
          setSelectedFolder(null)
        }
        await fetchData() // Refresh data from server
      } else {
        console.error("Error deleting folder:", result.error)
      }
    } catch (error) {
      console.error("Error deleting folder:", error)
    }
  }

  const handleDeleteFile = async (file: DocumentFile) => {
    try {
      const response = await fetch(`/api/documents/${file.id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        await fetchData() // Refresh data from server
      } else {
        console.error("Error deleting file:", result.error)
      }
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  const openAssignDialog = (type: "folder" | "file", item: DocumentFolder | DocumentFile) => {
    setAssignTarget({ type, item })
    setAssignmentForm({ type: "vessel", targetId: "" })
    setIsAssignDialogOpen(true)
  }

  const openEditFolder = (folder: DocumentFolder) => {
    setEditingFolder(folder)
    setNewFolder({ name: folder.name, color: folder.color, vesselId: folder.vesselId || "" })
    setIsEditFolderOpen(true)
  }

  // Preview file - opens in a new browser tab
  const openPreview = (file: DocumentFile) => {
    // Store file data in sessionStorage for the preview page
    const previewData = {
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      mimeType: file.mimeType,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.uploadedAt,
      path: file.path || file.url,
    }
    sessionStorage.setItem("previewFileData", JSON.stringify(previewData))
    
    // Open preview in new tab (full window, not popup)
    window.open("/preview", "_blank")
  }

  // Notes handlers
  const openAddNote = (file: DocumentFile) => {
    setNoteTargetFile(file)
    setEditingNote(null)
    setNewNote({
      title: "",
      content: "",
      summary: "",
      expirationDate: "",
      priority: "medium",
    })
    setIsNoteDialogOpen(true)
  }

  const openEditNote = (file: DocumentFile, note: FileNote) => {
    setNoteTargetFile(file)
    setEditingNote(note)
    setNewNote({
      title: note.title,
      content: note.content,
      summary: note.summary || "",
      expirationDate: note.expirationDate || "",
      priority: note.priority,
    })
    setIsNoteDialogOpen(true)
  }

  const openViewNotes = (file: DocumentFile) => {
    setPreviewFile(file)
    setIsViewNotesOpen(true)
  }

  const handleSaveNote = () => {
    if (!noteTargetFile || !newNote.title) return

    const note: FileNote = {
      id: editingNote?.id || `note-${Date.now()}`,
      title: newNote.title,
      content: newNote.content,
      summary: newNote.summary || undefined,
      createdBy: editingNote?.createdBy || "Current User",
      createdAt: editingNote?.createdAt || new Date().toISOString().split("T")[0],
      expirationDate: newNote.expirationDate || undefined,
      priority: newNote.priority,
    }

    setFiles(files.map((f) => {
      if (f.id !== noteTargetFile.id) return f
      
      if (editingNote) {
        return {
          ...f,
          notes: f.notes.map((n) => n.id === editingNote.id ? note : n),
        }
      } else {
        return {
          ...f,
          notes: [...f.notes, note],
        }
      }
    }))

    setIsNoteDialogOpen(false)
    setNoteTargetFile(null)
    setEditingNote(null)
  }

  const handleDeleteNote = (file: DocumentFile, noteId: string) => {
    setFiles(files.map((f) =>
      f.id === file.id
        ? { ...f, notes: f.notes.filter((n) => n.id !== noteId) }
        : f
    ))
  }

  const handleAddAssignment = async () => {
    // For "company" type, targetId is not required (use "company" as default)
    const targetId = assignmentForm.type === "company" ? "company" : assignmentForm.targetId
    if (!assignTarget || (!targetId && assignmentForm.type !== "company")) return

    try {
      const endpoint = assignTarget.type === "folder"
        ? `/api/documents/folders/${assignTarget.item.id}/assignments`
        : `/api/documents/${assignTarget.item.id}/assignments`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: assignmentForm.type,
          targetId: targetId,
        }),
      })

      const result = await response.json()
      if (result.success) {
        // Refresh data from server
        await fetchData()
      } else {
        console.error("Error adding assignment:", result.error)
        alert(result.error)
      }
    } catch (error) {
      console.error("Error adding assignment:", error)
    }

    setIsAssignDialogOpen(false)
    setAssignTarget(null)
  }

  const handleRemoveAssignment = async (
    itemId: string, 
    itemType: "folder" | "file", 
    assignment: { type: string; targetId: string }
  ) => {
    try {
      const endpoint = itemType === "folder"
        ? `/api/documents/folders/${itemId}/assignments?type=${assignment.type}&targetId=${assignment.targetId}`
        : `/api/documents/${itemId}/assignments?type=${assignment.type}&targetId=${assignment.targetId}`

      const response = await fetch(endpoint, { method: "DELETE" })

      const result = await response.json()
      if (result.success) {
        // Refresh data from server
        await fetchData()
      } else {
        console.error("Error removing assignment:", result.error)
      }
    } catch (error) {
      console.error("Error removing assignment:", error)
    }
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // Parse Excel/CSV file and extract data
  const parseSpreadsheetFile = async (file: File): Promise<DocumentFile["spreadsheetData"] | undefined> => {
    const fileType = getFileTypeFromMime(file.type)
    if (fileType !== "excel" && !file.name.endsWith(".csv")) return undefined

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, { header: 1 })
          
          if (jsonData.length === 0) {
            resolve(undefined)
            return
          }

          const headers = (jsonData[0] as (string | number | null)[]).map(h => String(h || ""))
          const rows = jsonData.slice(1, 101) // Limit to 100 rows for preview

          resolve({
            headers,
            rows,
            sheetNames: workbook.SheetNames,
            activeSheet: sheetName,
          })
        } catch (error) {
          console.error("Error parsing spreadsheet:", error)
          resolve(undefined)
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (!selectedFolder || !currentUser) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    
    // Upload files to API using FormData
    try {
      await Promise.all(
        droppedFiles.map(async (file) => {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("folderId", selectedFolder.id)
          formData.append("uploadedById", currentUser.id)
          
          const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          })
          
          const result = await response.json()
          if (!result.success) {
            console.error("Error uploading file:", result.error)
          }
        })
      )
      
      await fetchData() // Refresh data from server
    } catch (error) {
      console.error("Error uploading files:", error)
    }
  }, [selectedFolder, currentUser, fetchData])

  // File input handler
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedFolder || !e.target.files || !currentUser) return

    const uploadedFiles = Array.from(e.target.files)
    
    // Upload files to API using FormData
    try {
      await Promise.all(
        uploadedFiles.map(async (file) => {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("folderId", selectedFolder.id)
          formData.append("uploadedById", currentUser.id)
          
          const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          })
          
          const result = await response.json()
          if (!result.success) {
            console.error("Error uploading file:", result.error)
          }
        })
      )
      
      await fetchData() // Refresh data from server
    } catch (error) {
      console.error("Error uploading files:", error)
    }
  }

  // Priority badge colors
  const getPriorityColor = (priority: FileNote["priority"]) => {
    switch (priority) {
      case "high": return "destructive"
      case "medium": return "default"
      case "low": return "secondary"
    }
  }

  // Assignment badge component
  const AssignmentBadge = ({ assignment, onRemove }: { assignment: Assignment; onRemove?: () => void }) => {
    const Icon = assignment.type === "vessel" ? Ship : assignment.type === "user" ? User : Building2
    return (
      <Badge
        variant="secondary"
        className="flex items-center gap-1 text-xs"
      >
        <Icon className="w-3 h-3" />
        {assignment.targetName}
        {onRemove && (
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="ml-1 hover:text-destructive">
            ×
          </button>
        )}
      </Badge>
    )
  }

  // Expiration badge component
  const ExpirationBadge = ({ expirationDate }: { expirationDate?: string }) => {
    const status = getExpirationStatus(expirationDate)
    if (!status || status === "ok") return null

    return (
      <Badge
        variant={status === "expired" ? "destructive" : "outline"}
        className={cn(
          "flex items-center gap-1 text-xs",
          status === "expiring" && "border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950"
        )}
      >
        <AlertTriangle className="w-3 h-3" />
        {status === "expired" ? "Expired" : "Expires soon"}
      </Badge>
    )
  }

  // Notes indicator component
  const NotesIndicator = ({ file }: { file: DocumentFile }) => {
    if (file.notes.length === 0) return null
    
    const hasHighPriority = file.notes.some((n) => n.priority === "high")
    
    return (
      <Badge
        variant={hasHighPriority ? "destructive" : "secondary"}
        className="flex items-center gap-1 text-xs cursor-pointer"
        onClick={(e) => { e.stopPropagation(); openViewNotes(file); }}
      >
        <StickyNote className="w-3 h-3" />
        {file.notes.length}
      </Badge>
    )
  }

  // Folder card component
  const FolderCard = ({ folder }: { folder: DocumentFolder }) => (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
        "border-l-4",
      )}
      style={{ borderLeftColor: folder.color }}
      onClick={() => setSelectedFolder(folder)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${folder.color}20` }}
          >
            <Folder className="w-6 h-6" style={{ color: folder.color }} />
          </div>
          {!isReadOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditFolder(folder); }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openAssignDialog("folder", folder); }}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Assign
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <h3 className="font-semibold truncate mb-1">{folder.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          {folder.filesCount} fichier{folder.filesCount !== 1 ? "s" : ""}
        </p>
        {folder.vessel && (
          <Badge variant="outline" className="mb-2">
            <Ship className="w-3 h-3 mr-1" />
            {folder.vessel.name}
          </Badge>
        )}
        {!folder.vessel && !folder.vesselId && (
          <Badge variant="secondary" className="mb-2">
            <Building2 className="w-3 h-3 mr-1" />
            Company
          </Badge>
        )}
        {folder.assignments.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {folder.assignments.map((assignment, index) => (
              <AssignmentBadge
                key={index}
                assignment={assignment}
                onRemove={isReadOnly ? undefined : () => handleRemoveAssignment(folder.id, "folder", { type: assignment.type, targetId: assignment.targetId })}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  // File card component
  const FileCard = ({ file }: { file: DocumentFile }) => {
    const Icon = getFileIcon(file.type)
    return (
      <Card className="transition-all hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-muted">
              <Icon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1">
              <ExpirationBadge expirationDate={file.expirationDate} />
              <NotesIndicator file={file} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openPreview(file)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Visualiser
                  </DropdownMenuItem>
                  {file.notes.length > 0 && (
                    <DropdownMenuItem onClick={() => openViewNotes(file)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Voir les notes ({file.notes.length})
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </DropdownMenuItem>
                  {!isReadOnly && (
                    <>
                      <DropdownMenuItem onClick={() => openAddNote(file)}>
                        <StickyNote className="w-4 h-4 mr-2" />
                        Ajouter une note
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openAssignDialog("file", file)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Assigner
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteFile(file)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <h3 className="font-medium text-sm truncate mb-1" title={file.name}>
            {file.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span>{file.uploadedAt}</span>
          </div>
          {/* Show summary from first note if available */}
          {file.notes.length > 0 && file.notes[0].summary && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2 italic">
              {file.notes[0].summary}
            </p>
          )}
          {file.assignments.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {file.assignments.map((assignment, index) => (
                <AssignmentBadge
                  key={index}
                  assignment={assignment}
                  onRemove={isReadOnly ? undefined : () => handleRemoveAssignment(file.id, "file", { type: assignment.type, targetId: assignment.targetId })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // File list item component
  const FileListItem = ({ file }: { file: DocumentFile }) => {
    const Icon = getFileIcon(file.type)
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{file.name}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{file.uploadedBy}</span>
              <span>•</span>
              <span>{file.uploadedAt}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExpirationBadge expirationDate={file.expirationDate} />
          <NotesIndicator file={file} />
          {file.assignments.map((assignment, index) => (
            <AssignmentBadge key={index} assignment={assignment} />
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openPreview(file)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAddNote(file)}>
                <StickyNote className="w-4 h-4 mr-2" />
                Add Note
              </DropdownMenuItem>
              {file.notes.length > 0 && (
                <DropdownMenuItem onClick={() => openViewNotes(file)}>
                  <FileText className="w-4 h-4 mr-2" />
                  View Notes ({file.notes.length})
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAssignDialog("file", file)}>
                <Share2 className="w-4 h-4 mr-2" />
                Assign
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteFile(file)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <PageWrapper
        title="Documents CSO"
        description={isReadOnly ? "Consultation des documents de votre navire" : "Gérez vos dossiers et fichiers"}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title={selectedFolder ? selectedFolder.name : "Documents CSO"}
      description={
        selectedFolder
          ? isReadOnly 
            ? `Documents dans ${selectedFolder.name}`
            : `Gérer les fichiers dans ${selectedFolder.name}`
          : isReadOnly 
            ? "Consultation des documents de votre navire (lecture seule)"
            : "Gérez vos dossiers et fichiers"
      }
    >
      {/* Expiration Alerts */}
      {showAlerts && expiringFiles.length > 0 && !selectedFolder && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Document Expiration Alerts</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowAlerts(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {expiringFiles.map(({ file, status, folder }) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-background/50 rounded-md cursor-pointer hover:bg-background/80"
                  onClick={() => {
                    if (folder) setSelectedFolder(folder)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-xs opacity-70">in {folder?.name}</span>
                  </div>
                  <Badge variant={status === "expired" ? "destructive" : "outline"}>
                    {status === "expired" ? "Expired" : `Expires ${formatDate(file.expirationDate!)}`}
                  </Badge>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={selectedFolder ? "Search files..." : "Search folders..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {!selectedFolder && (
            <>
              {/* SharePoint-style view toggle for folders */}
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "tiles" ? "default" : "ghost"}
                  size="icon"
                  className="rounded-none border-0"
                  onClick={() => setViewMode("tiles")}
                  title="Affichage en vignettes"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="rounded-none border-0 border-l"
                  onClick={() => setViewMode("list")}
                  title="Affichage en liste"
                >
                  <Rows3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "compact" ? "default" : "ghost"}
                  size="icon"
                  className="rounded-none border-0 border-l"
                  onClick={() => setViewMode("compact")}
                  title="Affichage compact"
                >
                  <StretchHorizontal className="w-4 h-4" />
                </Button>
              </div>
              {expiringFiles.length > 0 && !showAlerts && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAlerts(true)}
                  className="relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {expiringFiles.length}
                  </span>
                </Button>
              )}
              {!isReadOnly && (
                <Button onClick={() => setIsCreateFolderOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau dossier
                </Button>
              )}
            </>
          )}
          {selectedFolder && (
            <>
              {/* SharePoint-style view toggle */}
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "tiles" ? "default" : "ghost"}
                  size="icon"
                  className="rounded-none border-0"
                  onClick={() => setViewMode("tiles")}
                  title="Affichage en vignettes"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="rounded-none border-0 border-l"
                  onClick={() => setViewMode("list")}
                  title="Affichage en liste"
                >
                  <Rows3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "compact" ? "default" : "ghost"}
                  size="icon"
                  className="rounded-none border-0 border-l"
                  onClick={() => setViewMode("compact")}
                  title="Affichage compact"
                >
                  <StretchHorizontal className="w-4 h-4" />
                </Button>
              </div>
              {!isReadOnly && (
                <label>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Importer
                    </span>
                  </Button>
                </label>
              )}
            </>
          )}
        </div>
      </div>

      {/* Back button when in folder */}
      {selectedFolder && (
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setSelectedFolder(null)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Folders
        </Button>
      )}

      {/* Content */}
      {selectedFolder ? (
        // Files view with drag and drop
        <div
          className={cn(
            "min-h-[400px] rounded-lg border-2 border-dashed transition-colors p-4",
            isDragging && !isReadOnly ? "border-primary bg-primary/5" : "border-transparent"
          )}
          onDragOver={isReadOnly ? undefined : handleDragOver}
          onDragLeave={isReadOnly ? undefined : handleDragLeave}
          onDrop={isReadOnly ? undefined : handleDrop}
        >
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Upload className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium mb-2">
                {isReadOnly ? "Aucun fichier disponible" : "Déposez vos fichiers ici"}
              </p>
              <p className="text-sm">
                {isReadOnly 
                  ? "Ce dossier ne contient pas encore de documents" 
                  : "ou cliquez sur Upload Files pour ajouter des documents"
                }
              </p>
            </div>
          ) : viewMode === "tiles" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredFiles.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <FileListItem key={file.id} file={file} />
              ))}
            </div>
          ) : (
            /* Compact view - SharePoint style table */
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left text-sm">
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Nom</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Date de modification</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Taille</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredFiles.map((file) => {
                    const Icon = getFileIcon(file.type)
                    return (
                      <tr key={file.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2">
                          <Icon className={cn(
                            "w-5 h-5",
                            file.type === "pdf" && "text-red-500",
                            file.type === "image" && "text-blue-500",
                            file.type === "excel" && "text-green-500",
                            file.type === "word" && "text-blue-600"
                          )} />
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => openPreview(file)}
                            className="text-left hover:text-primary hover:underline font-medium"
                          >
                            {file.name}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">
                          {formatDate(file.uploadedAt)}
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground hidden sm:table-cell">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPreview(file)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="w-4 h-4" />
                            </Button>
                            {!isReadOnly && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openAssignDialog("file", file)}>
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Assigner
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteFile(file.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Folders view with SharePoint-style modes
        <>
          {filteredFolders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Folder className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium mb-2">
                {isReadOnly ? "Aucun dossier disponible" : "Aucun dossier"}
              </p>
              <p className="text-sm mb-4">
                {isReadOnly 
                  ? "Aucun dossier n'est assigné à votre navire pour le moment"
                  : "Créez votre premier dossier pour organiser vos documents"
                }
              </p>
              {!isReadOnly && (
                <Button onClick={() => setIsCreateFolderOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un dossier
                </Button>
              )}
            </div>
          ) : viewMode === "tiles" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredFolders.map((folder) => (
                <FolderCard key={folder.id} folder={folder} />
              ))}
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {filteredFolders.map((folder) => (
                <Card
                  key={folder.id}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setSelectedFolder(folder)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: folder.color + "20" }}
                    >
                      <Folder className="w-6 h-6" style={{ color: folder.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{folder.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {folder.filesCount} fichier{folder.filesCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground hidden md:block">
                      {formatDate(folder.createdAt)}
                    </div>
                    {folder.assignments && folder.assignments.length > 0 && (
                      <div className="flex gap-1">
                        {folder.assignments.slice(0, 2).map((assignment, i) => (
                          <AssignmentBadge key={i} assignment={assignment} />
                        ))}
                        {folder.assignments.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{folder.assignments.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                    {!isReadOnly && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditFolder(folder); }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openAssignDialog("folder", folder); }}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Assigner
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Compact view - SharePoint style table for folders */
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left text-sm">
                    <th className="px-4 py-3 font-medium">Nom</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Date de création</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Fichiers</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Assignations</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredFolders.map((folder) => (
                    <tr 
                      key={folder.id} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedFolder(folder)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded flex items-center justify-center"
                            style={{ backgroundColor: folder.color + "20" }}
                          >
                            <Folder className="w-4 h-4" style={{ color: folder.color }} />
                          </div>
                          <span className="font-medium hover:text-primary">{folder.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                        {formatDate(folder.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {folder.filesCount}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {folder.assignments?.slice(0, 2).map((assignment, i) => (
                            <AssignmentBadge key={i} assignment={assignment} />
                          ))}
                          {folder.assignments && folder.assignments.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{folder.assignments.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isReadOnly && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditFolder(folder); }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openAssignDialog("folder", folder); }}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Assigner
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau dossier</DialogTitle>
            <DialogDescription>
              Créez un dossier pour organiser vos documents. Assignez-le à un navire pour restreindre l'accès.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Nom du dossier</Label>
              <Input
                id="folderName"
                placeholder="ex: Documents de sécurité"
                value={newFolder.name}
                onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folderVessel">Navire assigné</Label>
              <Select
                value={newFolder.vesselId || "none"}
                onValueChange={(value) => setNewFolder({ ...newFolder, vesselId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un navire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Company (tous accès)</SelectItem>
                  {vessels.map((vessel) => (
                    <SelectItem key={vessel.id} value={vessel.id}>
                      {vessel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Les capitaines ne voient que les dossiers de leur navire
              </p>
            </div>
            <div className="space-y-2">
              <Label>Couleur du dossier</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      newFolder.color === color.value
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewFolder({ ...newFolder, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolder.name}>
              Créer le dossier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditFolderOpen} onOpenChange={setIsEditFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le dossier</DialogTitle>
            <DialogDescription>
              Modifiez le nom, la couleur et l'assignation du dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editFolderName">Nom du dossier</Label>
              <Input
                id="editFolderName"
                value={newFolder.name}
                onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFolderVessel">Navire assigné</Label>
              <Select
                value={newFolder.vesselId || "none"}
                onValueChange={(value) => setNewFolder({ ...newFolder, vesselId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un navire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Company (tous accès)</SelectItem>
                  {vessels.map((vessel) => (
                    <SelectItem key={vessel.id} value={vessel.id}>
                      {vessel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Couleur du dossier</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      newFolder.color === color.value
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewFolder({ ...newFolder, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFolderOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateFolder} disabled={!newFolder.name}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {assignTarget?.type === "folder" ? "Folder" : "File"}</DialogTitle>
            <DialogDescription>
              Choose who can access this {assignTarget?.type === "folder" ? "folder and its files" : "file"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Assignment Type</Label>
              <Select
                value={assignmentForm.type}
                onValueChange={(value: AssignmentType) =>
                  setAssignmentForm({ type: value, targetId: value === "company" ? "company" : "" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vessel">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4" />
                      Vessel
                    </div>
                  </SelectItem>
                  <SelectItem value="company">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Company (Internal)
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Specific User
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {assignmentForm.type === "vessel" && (
              <div className="space-y-2">
                <Label>Select Vessel</Label>
                <Select
                  value={assignmentForm.targetId}
                  onValueChange={(value) => setAssignmentForm({ ...assignmentForm, targetId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a vessel" />
                  </SelectTrigger>
                  <SelectContent>
                    {vessels.map((vessel) => (
                      <SelectItem key={vessel.id} value={vessel.id}>
                        {vessel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {assignmentForm.type === "user" && (
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select
                  value={assignmentForm.targetId}
                  onValueChange={(value) => setAssignmentForm({ ...assignmentForm, targetId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {assignmentForm.type === "company" && (
              <p className="text-sm text-muted-foreground">
                This {assignTarget?.type} will be accessible only to company staff (internal use between departments).
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAssignment}
              disabled={!assignmentForm.type || (!assignmentForm.targetId && assignmentForm.type !== "company")}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Note" : "Add Note"}</DialogTitle>
            <DialogDescription>
              {noteTargetFile && (
                <>Add a note to <strong>{noteTargetFile.name}</strong> with details visible from outside the file.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="noteTitle">Title</Label>
              <Input
                id="noteTitle"
                placeholder="e.g., Review Required"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="noteContent">Note Content</Label>
              <Textarea
                id="noteContent"
                placeholder="Add details about this file..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noteSummary">File Summary (visible on card)</Label>
              <Textarea
                id="noteSummary"
                placeholder="Brief summary of the file content..."
                value={newNote.summary}
                onChange={(e) => setNewNote({ ...newNote, summary: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="noteExpiration">Expiration Date</Label>
                <Input
                  id="noteExpiration"
                  type="date"
                  value={newNote.expirationDate}
                  onChange={(e) => setNewNote({ ...newNote, expirationDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newNote.priority}
                  onValueChange={(value: FileNote["priority"]) => setNewNote({ ...newNote, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} disabled={!newNote.title}>
              {editingNote ? "Save Changes" : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Notes Dialog */}
      <Dialog open={isViewNotesOpen} onOpenChange={setIsViewNotesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5" />
              Notes for {previewFile?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {previewFile && previewFile.notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <StickyNote className="w-12 h-12 mb-4" />
                <p>No notes for this file</p>
              </div>
            ) : (
              <div className="space-y-3">
                {previewFile?.notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(note.priority)}>
                            {note.priority}
                          </Badge>
                          <h4 className="font-semibold">{note.title}</h4>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setIsViewNotesOpen(false); openEditNote(previewFile!, note); }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteNote(previewFile!, note.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{note.content}</p>
                      {note.summary && (
                        <div className="bg-muted/50 rounded p-2 mb-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Summary:</p>
                          <p className="text-sm italic">{note.summary}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {note.createdBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(note.createdAt)}
                        </span>
                        {note.expirationDate && (
                          <span className={cn(
                            "flex items-center gap-1",
                            getExpirationStatus(note.expirationDate) === "expired" && "text-destructive",
                            getExpirationStatus(note.expirationDate) === "expiring" && "text-orange-600"
                          )}>
                            <Clock className="w-3 h-3" />
                            Expires: {formatDate(note.expirationDate)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewNotesOpen(false)}>
              Close
            </Button>
            {previewFile && (
              <Button onClick={() => { setIsViewNotesOpen(false); openAddNote(previewFile); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
