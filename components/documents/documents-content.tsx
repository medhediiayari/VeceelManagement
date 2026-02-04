"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Upload, FileText } from "lucide-react"
import { PageWrapper, DataTable, FormDialog, StatusBadge, type Column } from "@/components/shared"
import { mockDocuments, vesselNames, DOCUMENT_TYPES } from "@/data/mock-data"
import type { Document } from "@/types"

// Available folders
const folders = ["Security Documents", "Compliance", "Crew Training", "Maintenance", "Incident Reports"]

/**
 * DocumentsContent - Document management component
 * 
 * Isolated component for document CRUD operations
 */
export function DocumentsContent() {
  // State management
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newDocument, setNewDocument] = useState({
    name: "",
    type: "",
    vessel: "",
    size: "0 KB",
  })

  // Form validation
  const isFormValid = Boolean(newDocument.name && newDocument.type && newDocument.vessel)

  // Handlers
  const handleAddDocument = () => {
    if (!isFormValid) return

    const today = new Date().toISOString().split("T")[0]
    const doc: Document = {
      id: String(documents.length + 1),
      name: newDocument.name,
      type: newDocument.type,
      vessel: newDocument.vessel,
      uploadedBy: "Current User",
      uploadedAt: today,
      status: "pending",
      size: newDocument.size,
    }

    setDocuments([...documents, doc])
    resetForm()
    setIsAddDialogOpen(false)
  }

  const handleDeleteDocument = (doc: Document) => {
    setDocuments(documents.filter((d) => d.id !== doc.id))
  }

  const resetForm = () => {
    setNewDocument({ name: "", type: "", vessel: "", size: "0 KB" })
  }

  // Table configuration
  const columns: Column<Document>[] = [
    {
      key: "name",
      header: "Document Name",
      render: (doc) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span>{doc.name}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (doc) => <Badge variant="outline">{doc.type}</Badge>,
    },
    { key: "vessel", header: "Vessel" },
    { key: "uploadedBy", header: "Uploaded By" },
    { key: "uploadedAt", header: "Date" },
    {
      key: "status",
      header: "Status",
      render: (doc) => <StatusBadge status={doc.status} />,
    },
  ]

  // Action button
  const AddDocumentButton = (
    <Button
      className="w-full sm:w-auto h-9 px-4 text-sm font-medium"
      onClick={() => setIsAddDialogOpen(true)}
    >
      <Upload className="w-4 h-4 mr-2" />
      Upload Document
    </Button>
  )

  return (
    <PageWrapper
      title="Documents Management"
      description="Upload, organize, and manage all vessel documents and compliance files."
      actions={AddDocumentButton}
    >
      <DataTable
        data={documents}
        columns={columns}
        actions={{
          onView: (doc) => console.log("View:", doc),
          onDelete: handleDeleteDocument,
        }}
        emptyMessage="No documents found. Upload your first document to get started."
      />

      {/* Upload Document Dialog */}
      <FormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Upload Document"
        description="Add a new document to the vessel management system."
        onSubmit={handleAddDocument}
        submitLabel="Upload"
        isValid={isFormValid}
      >
        <div className="space-y-2">
          <Label htmlFor="doc-name">Document Name</Label>
          <Input
            id="doc-name"
            placeholder="e.g., Safety Manual.pdf"
            value={newDocument.name}
            onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="doc-type">Document Type</Label>
          <Select
            value={newDocument.type}
            onValueChange={(value) => setNewDocument({ ...newDocument, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="doc-vessel">Vessel</Label>
          <Select
            value={newDocument.vessel}
            onValueChange={(value) => setNewDocument({ ...newDocument, vessel: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vessel" />
            </SelectTrigger>
            <SelectContent>
              {vesselNames.map((vessel) => (
                <SelectItem key={vessel} value={vessel}>
                  {vessel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Drag and drop your file here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOC, XLSX up to 10MB
          </p>
        </div>
      </FormDialog>
    </PageWrapper>
  )
}
