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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
} from "lucide-react"
import { PageWrapper } from "@/components/shared"
import {
  mockDocumentFolders,
  mockDocumentFiles,
  mockVessels,
  mockUsers,
  FOLDER_COLORS,
} from "@/data/mock-data"
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
  const [folders, setFolders] = useState<DocumentFolder[]>(mockDocumentFolders)
  const [files, setFiles] = useState<DocumentFile[]>(mockDocumentFiles)
  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isDragging, setIsDragging] = useState(false)

  // Dialog states
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
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
  const handleCreateFolder = () => {
    if (!newFolder.name) return

    const folder: DocumentFolder = {
      id: `folder-${Date.now()}`,
      name: newFolder.name,
      color: newFolder.color,
      createdBy: "Current User",
      createdAt: new Date().toISOString().split("T")[0],
      assignments: [],
      filesCount: 0,
    }

    setFolders([...folders, folder])
    setNewFolder({ name: "", color: FOLDER_COLORS[0].value })
    setIsCreateFolderOpen(false)
  }

  const handleUpdateFolder = () => {
    if (!editingFolder || !newFolder.name) return

    setFolders(folders.map((f) =>
      f.id === editingFolder.id
        ? { ...f, name: newFolder.name, color: newFolder.color }
        : f
    ))
    setEditingFolder(null)
    setNewFolder({ name: "", color: FOLDER_COLORS[0].value })
    setIsEditFolderOpen(false)
  }

  const handleDeleteFolder = (folder: DocumentFolder) => {
    setFolders(folders.filter((f) => f.id !== folder.id))
    setFiles(files.filter((f) => f.folderId !== folder.id))
    if (selectedFolder?.id === folder.id) {
      setSelectedFolder(null)
    }
  }

  const handleDeleteFile = (file: DocumentFile) => {
    setFiles(files.filter((f) => f.id !== file.id))
    // Update folder file count
    setFolders(folders.map((folder) =>
      folder.id === file.folderId
        ? { ...folder, filesCount: folder.filesCount - 1 }
        : folder
    ))
  }

  const openAssignDialog = (type: "folder" | "file", item: DocumentFolder | DocumentFile) => {
    setAssignTarget({ type, item })
    setAssignmentForm({ type: "vessel", targetId: "" })
    setIsAssignDialogOpen(true)
  }

  const openEditFolder = (folder: DocumentFolder) => {
    setEditingFolder(folder)
    setNewFolder({ name: folder.name, color: folder.color })
    setIsEditFolderOpen(true)
  }

  // Preview file - opens in a new browser window
  const openPreview = (file: DocumentFile) => {
    // Store file data in sessionStorage for the preview page
    const previewData = {
      name: file.name,
      size: file.size,
      type: file.type,
      mimeType: file.mimeType,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.uploadedAt,
      spreadsheetData: file.spreadsheetData,
    }
    sessionStorage.setItem("previewFileData", JSON.stringify(previewData))
    
    // Open preview in new window
    window.open("/documents/preview", "_blank", "width=1200,height=800")
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

  const handleAddAssignment = () => {
    if (!assignTarget || !assignmentForm.targetId) return

    const targetName = assignmentForm.type === "vessel"
      ? mockVessels.find((v) => v.id === assignmentForm.targetId)?.name || ""
      : assignmentForm.type === "user"
      ? mockUsers.find((u) => u.id === assignmentForm.targetId)?.name || ""
      : "Company Internal"

    const newAssignment: Assignment = {
      type: assignmentForm.type,
      targetId: assignmentForm.targetId,
      targetName,
    }

    if (assignTarget.type === "folder") {
      setFolders(folders.map((f) =>
        f.id === assignTarget.item.id
          ? { ...f, assignments: [...f.assignments, newAssignment] }
          : f
      ))
    } else {
      setFiles(files.map((f) =>
        f.id === assignTarget.item.id
          ? { ...f, assignments: [...f.assignments, newAssignment] }
          : f
      ))
    }

    setIsAssignDialogOpen(false)
    setAssignTarget(null)
  }

  const handleRemoveAssignment = (itemId: string, itemType: "folder" | "file", assignmentIndex: number) => {
    if (itemType === "folder") {
      setFolders(folders.map((f) =>
        f.id === itemId
          ? { ...f, assignments: f.assignments.filter((_, i) => i !== assignmentIndex) }
          : f
      ))
    } else {
      setFiles(files.map((f) =>
        f.id === itemId
          ? { ...f, assignments: f.assignments.filter((_, i) => i !== assignmentIndex) }
          : f
      ))
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

    if (!selectedFolder) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    
    // Process files and parse spreadsheets
    const processedFiles = await Promise.all(
      droppedFiles.map(async (file, index) => {
        const spreadsheetData = await parseSpreadsheetFile(file)
        
        return {
          id: `file-${Date.now()}-${index}`,
          folderId: selectedFolder.id,
          name: file.name,
          type: getFileTypeFromMime(file.type),
          mimeType: file.type,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploadedBy: "Current User",
          uploadedAt: new Date().toISOString().split("T")[0],
          assignments: [],
          notes: [],
          spreadsheetData,
        } as DocumentFile
      })
    )

    setFiles((prev) => [...prev, ...processedFiles])
    // Update folder file count
    setFolders((prev) => prev.map((folder) =>
      folder.id === selectedFolder.id
        ? { ...folder, filesCount: folder.filesCount + processedFiles.length }
        : folder
    ))
  }, [selectedFolder])

  // File input handler
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedFolder || !e.target.files) return

    const uploadedFiles = Array.from(e.target.files)
    
    // Process files and parse spreadsheets
    const processedFiles = await Promise.all(
      uploadedFiles.map(async (file, index) => {
        const spreadsheetData = await parseSpreadsheetFile(file)
        
        return {
          id: `file-${Date.now()}-${index}`,
          folderId: selectedFolder.id,
          name: file.name,
          type: getFileTypeFromMime(file.type),
          mimeType: file.type,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploadedBy: "Current User",
          uploadedAt: new Date().toISOString().split("T")[0],
          assignments: [],
          notes: [],
          spreadsheetData,
        } as DocumentFile
      })
    )

    setFiles([...files, ...processedFiles])
    setFolders(folders.map((folder) =>
      folder.id === selectedFolder.id
        ? { ...folder, filesCount: folder.filesCount + processedFiles.length }
        : folder
    ))
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
        </div>
        <h3 className="font-semibold truncate mb-1">{folder.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">
          {folder.filesCount} file{folder.filesCount !== 1 ? "s" : ""}
        </p>
        {folder.assignments.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {folder.assignments.map((assignment, index) => (
              <AssignmentBadge
                key={index}
                assignment={assignment}
                onRemove={() => handleRemoveAssignment(folder.id, "folder", index)}
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
          <h3 className="font-medium text-sm truncate mb-1" title={file.name}>
            {file.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>{file.size}</span>
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
                  onRemove={() => handleRemoveAssignment(file.id, "file", index)}
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
              <span>{file.size}</span>
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

  return (
    <PageWrapper
      title={selectedFolder ? selectedFolder.name : "Documents"}
      description={
        selectedFolder
          ? `Manage files in ${selectedFolder.name}`
          : "Manage your document folders and files"
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
          {!selectedFolder && expiringFiles.length > 0 && !showAlerts && (
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
          {selectedFolder && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              >
                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
              </Button>
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
                    Upload Files
                  </span>
                </Button>
              </label>
            </>
          )}
          {!selectedFolder && (
            <Button onClick={() => setIsCreateFolderOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
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
            isDragging ? "border-primary bg-primary/5" : "border-transparent"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Upload className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium mb-2">Drop files here</p>
              <p className="text-sm">or click Upload Files to add documents</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <FileListItem key={file.id} file={file} />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Folders view
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
          {filteredFolders.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Folder className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium mb-2">No folders yet</p>
              <p className="text-sm mb-4">Create your first folder to start organizing documents</p>
              <Button onClick={() => setIsCreateFolderOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Folder
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a folder to organize your documents. You can assign it to vessels or users later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                placeholder="e.g., Security Documents"
                value={newFolder.name}
                onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Folder Color</Label>
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
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolder.name}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditFolderOpen} onOpenChange={setIsEditFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update folder name and color.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editFolderName">Folder Name</Label>
              <Input
                id="editFolderName"
                value={newFolder.name}
                onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Folder Color</Label>
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
              Cancel
            </Button>
            <Button onClick={handleUpdateFolder} disabled={!newFolder.name}>
              Save Changes
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
                    {mockVessels.map((vessel) => (
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
                    {mockUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
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
              disabled={!assignmentForm.targetId && assignmentForm.type !== "company"}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewFile && (
                <>
                  {(() => {
                    const Icon = getFileIcon(previewFile.type)
                    return <Icon className="w-5 h-5" />
                  })()}
                  {previewFile.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {previewFile && (
                <span className="flex items-center gap-4">
                  <span>{previewFile.size}</span>
                  <span>•</span>
                  <span>Uploaded by {previewFile.uploadedBy}</span>
                  <span>•</span>
                  <span>{formatDate(previewFile.uploadedAt)}</span>
                  {previewFile.expirationDate && (
                    <>
                      <span>•</span>
                      <span className={cn(
                        getExpirationStatus(previewFile.expirationDate) === "expired" && "text-destructive",
                        getExpirationStatus(previewFile.expirationDate) === "expiring" && "text-orange-600"
                      )}>
                        Expires: {formatDate(previewFile.expirationDate)}
                      </span>
                    </>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {previewFile && (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="notes">Notes ({previewFile.notes.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-lg min-h-[400px] bg-muted/30 overflow-hidden">
                  {/* Excel/CSV Preview with spreadsheet data */}
                  {previewFile.spreadsheetData ? (
                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TableIcon className="w-4 h-4" />
                        <span>
                          {previewFile.spreadsheetData.rows.length} rows × {previewFile.spreadsheetData.headers.length} columns
                        </span>
                        {previewFile.spreadsheetData.sheetNames && previewFile.spreadsheetData.sheetNames.length > 1 && (
                          <Badge variant="secondary">
                            Sheet: {previewFile.spreadsheetData.activeSheet || previewFile.spreadsheetData.sheetNames[0]}
                          </Badge>
                        )}
                      </div>
                      <ScrollArea className="h-[450px] rounded-md border">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                              <TableHead className="w-12 text-center bg-muted">#</TableHead>
                              {previewFile.spreadsheetData.headers.map((header, idx) => (
                                <TableHead key={idx} className="font-semibold bg-muted">
                                  {header || `Column ${idx + 1}`}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewFile.spreadsheetData.rows.slice(0, 100).map((row, rowIdx) => (
                              <TableRow key={rowIdx} className="hover:bg-muted/50">
                                <TableCell className="text-center text-muted-foreground text-xs">
                                  {rowIdx + 1}
                                </TableCell>
                                {row.map((cell, cellIdx) => (
                                  <TableCell key={cellIdx} className="max-w-[200px] truncate">
                                    {cell !== null && cell !== undefined ? String(cell) : ""}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                      {previewFile.spreadsheetData.rows.length > 100 && (
                        <p className="text-xs text-muted-foreground text-center">
                          Showing first 100 rows of {previewFile.spreadsheetData.rows.length}
                        </p>
                      )}
                    </div>
                  ) : previewFile.url ? (
                    // If file has a URL, show actual preview
                    previewFile.type === "image" ? (
                      <img
                        src={previewFile.url}
                        alt={previewFile.name}
                        className="w-full h-auto max-h-[500px] object-contain"
                      />
                    ) : previewFile.type === "pdf" ? (
                      <iframe
                        src={previewFile.url}
                        className="w-full h-[500px] border-0"
                        title={previewFile.name}
                      />
                    ) : (
                      <div className="p-8 flex flex-col items-center justify-center h-[400px]">
                        <File className="w-24 h-24 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Download to view this file
                        </p>
                      </div>
                    )
                  ) : (
                    // No URL - show file info card instead
                    <div className="p-6 space-y-6">
                      {/* File icon and type */}
                      <div className="flex items-center gap-4 pb-4 border-b">
                        <div className={cn(
                          "p-4 rounded-xl",
                          previewFile.type === "pdf" && "bg-red-100 dark:bg-red-950",
                          previewFile.type === "image" && "bg-blue-100 dark:bg-blue-950",
                          previewFile.type === "excel" && "bg-green-100 dark:bg-green-950",
                          previewFile.type === "word" && "bg-blue-100 dark:bg-blue-950",
                          previewFile.type === "other" && "bg-gray-100 dark:bg-gray-900"
                        )}>
                          {(() => {
                            const Icon = getFileIcon(previewFile.type)
                            return <Icon className={cn(
                              "w-12 h-12",
                              previewFile.type === "pdf" && "text-red-600",
                              previewFile.type === "image" && "text-blue-600",
                              previewFile.type === "excel" && "text-green-600",
                              previewFile.type === "word" && "text-blue-600",
                              previewFile.type === "other" && "text-gray-600"
                            )} />
                          })()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{previewFile.name}</h3>
                          <p className="text-sm text-muted-foreground uppercase">{previewFile.type} file</p>
                        </div>
                      </div>

                      {/* File details grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Size</p>
                          <p className="font-medium">{previewFile.size}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Type</p>
                          <p className="font-medium">{previewFile.mimeType}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Uploaded By</p>
                          <p className="font-medium">{previewFile.uploadedBy}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Upload Date</p>
                          <p className="font-medium">{formatDate(previewFile.uploadedAt)}</p>
                        </div>
                        {previewFile.expirationDate && (
                          <div className="space-y-1 col-span-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Expiration</p>
                            <p className={cn(
                              "font-medium flex items-center gap-2",
                              getExpirationStatus(previewFile.expirationDate) === "expired" && "text-destructive",
                              getExpirationStatus(previewFile.expirationDate) === "expiring" && "text-orange-600"
                            )}>
                              <Calendar className="w-4 h-4" />
                              {formatDate(previewFile.expirationDate)}
                              {getExpirationStatus(previewFile.expirationDate) === "expired" && (
                                <Badge variant="destructive">Expired</Badge>
                              )}
                              {getExpirationStatus(previewFile.expirationDate) === "expiring" && (
                                <Badge variant="outline" className="border-orange-500 text-orange-600">Expires Soon</Badge>
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Assignments */}
                      {previewFile.assignments.length > 0 && (
                        <div className="space-y-2 pt-4 border-t">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Shared With</p>
                          <div className="flex flex-wrap gap-2">
                            {previewFile.assignments.map((assignment, index) => (
                              <AssignmentBadge key={index} assignment={assignment} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Summary from notes */}
                      {previewFile.notes.length > 0 && previewFile.notes[0].summary && (
                        <div className="space-y-2 pt-4 border-t">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">File Summary</p>
                          <p className="text-sm italic bg-muted/50 p-3 rounded-lg">
                            {previewFile.notes[0].summary}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {previewFile.notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <StickyNote className="w-12 h-12 mb-4" />
                      <p className="text-lg font-medium mb-2">No notes yet</p>
                      <Button onClick={() => { setIsPreviewOpen(false); openAddNote(previewFile); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {previewFile.notes.map((note) => (
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
                                  <DropdownMenuItem onClick={() => { setIsPreviewOpen(false); openEditNote(previewFile, note); }}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteNote(previewFile, note.id)}
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
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => { setIsPreviewOpen(false); openAddNote(previewFile); }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Download
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
