"use client"

import { useEffect, useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Download,
  X,
  Calendar,
  User,
  HardDrive,
  Table as TableIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SpreadsheetData } from "@/types"
import * as XLSX from "xlsx"

// Format file size from bytes to human-readable format
const formatFileSize = (bytes: number | string): string => {
  if (typeof bytes === 'string') return bytes // Already formatted
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function PreviewContent() {
  const [fileData, setFileData] = useState<{
    id?: string
    name: string
    size: number | string
    type: string
    mimeType: string
    uploadedBy: string
    uploadedAt: string
    path?: string // Server path like /uploads/xxx.pdf
    spreadsheetData?: SpreadsheetData
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData | null>(null)

  useEffect(() => {
    // Get file data from sessionStorage (set before opening this window)
    const storedData = sessionStorage.getItem("previewFileData")
    if (storedData) {
      try {
        const data = JSON.parse(storedData)
        setFileData(data)
        
        // If it's an Excel/CSV file, fetch and parse it
        if ((data.type === 'excel' || data.name?.endsWith('.csv')) && data.path) {
          fetch(data.path)
            .then(res => res.arrayBuffer())
            .then(buffer => {
              const workbook = XLSX.read(buffer, { type: "array" })
              const sheetName = workbook.SheetNames[0]
              const worksheet = workbook.Sheets[sheetName]
              const jsonData = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, { header: 1 })
              
              if (jsonData.length > 0) {
                const headers = (jsonData[0] as (string | number | null)[]).map(h => String(h || ""))
                const rows = jsonData.slice(1, 101) // Limit to 100 rows
                setSpreadsheetData({
                  headers,
                  rows,
                  sheetNames: workbook.SheetNames,
                  activeSheet: sheetName,
                })
              }
            })
            .catch(err => console.error("Failed to parse spreadsheet:", err))
        }
      } catch (e) {
        console.error("Failed to parse file data", e)
      }
    }
    setLoading(false)
  }, [])

  const getFileIcon = (type: string) => {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid Date"
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const handleDownload = () => {
    if (fileData?.path) {
      const link = document.createElement('a')
      link.href = fileData.path
      link.download = fileData.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de l'aperçu...</p>
        </div>
      </div>
    )
  }

  if (!fileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <File className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun fichier</h2>
            <p className="text-muted-foreground mb-4">
              Impossible de charger l'aperçu du fichier. Veuillez réessayer depuis la page Documents.
            </p>
            <Button onClick={() => window.close()}>
              Fermer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const Icon = getFileIcon(fileData.type)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-2 rounded-lg",
                fileData.type === "pdf" && "bg-red-100 dark:bg-red-950",
                fileData.type === "image" && "bg-blue-100 dark:bg-blue-950",
                fileData.type === "excel" && "bg-green-100 dark:bg-green-950",
                fileData.type === "word" && "bg-blue-100 dark:bg-blue-950",
                fileData.type === "other" && "bg-gray-100 dark:bg-gray-900"
              )}>
                <Icon className={cn(
                  "w-6 h-6",
                  fileData.type === "pdf" && "text-red-600",
                  fileData.type === "image" && "text-blue-600",
                  fileData.type === "excel" && "text-green-600",
                  fileData.type === "word" && "text-blue-600",
                  fileData.type === "other" && "text-gray-600"
                )} />
              </div>
              <div>
                <h1 className="font-semibold text-lg">{fileData.name}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {formatFileSize(fileData.size)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {fileData.uploadedBy}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(fileData.uploadedAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
              <Button variant="ghost" onClick={() => window.close()}>
                <X className="w-4 h-4 mr-2" />
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {spreadsheetData ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TableIcon className="w-5 h-5" />
                  Données du tableur
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {spreadsheetData.rows.length} lignes × {spreadsheetData.headers.length} colonnes
                  </Badge>
                  {spreadsheetData.sheetNames && spreadsheetData.sheetNames.length > 1 && (
                    <Badge variant="outline">
                      Feuille: {spreadsheetData.activeSheet || spreadsheetData.sheetNames[0]}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                    <TableRow>
                      <TableHead className="w-14 text-center font-bold">#</TableHead>
                      {spreadsheetData.headers.map((header, idx) => (
                        <TableHead key={idx} className="font-semibold min-w-[120px]">
                          {header || `Colonne ${idx + 1}`}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spreadsheetData.rows.map((row, rowIdx) => (
                      <TableRow key={rowIdx} className="hover:bg-muted/50">
                        <TableCell className="text-center text-muted-foreground text-xs font-mono">
                          {rowIdx + 1}
                        </TableCell>
                        {row.map((cell, cellIdx) => (
                          <TableCell key={cellIdx} className="max-w-[300px]">
                            <span className="block truncate" title={cell !== null && cell !== undefined ? String(cell) : ""}>
                              {cell !== null && cell !== undefined ? String(cell) : ""}
                            </span>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        ) : fileData.type === "pdf" && fileData.path ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <iframe 
                src={fileData.path}
                className="w-full h-[calc(100vh-180px)] border-0"
                title={fileData.name}
              />
            </CardContent>
          </Card>
        ) : fileData.type === "image" && fileData.path ? (
          <Card>
            <CardContent className="p-6 flex items-center justify-center">
              <img 
                src={fileData.path}
                alt={fileData.name}
                className="max-w-full max-h-[calc(100vh-220px)] object-contain rounded-lg shadow-lg"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Icon className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-2">{fileData.name}</h2>
              <p className="text-muted-foreground mb-6">
                Aperçu non disponible pour ce type de fichier.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Taille</p>
                  <p className="font-medium">{formatFileSize(fileData.size)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Type</p>
                  <p className="font-medium">{fileData.mimeType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Uploadé par</p>
                  <p className="font-medium">{fileData.uploadedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Date</p>
                  <p className="font-medium">{formatDate(fileData.uploadedAt)}</p>
                </div>
              </div>
              <Button className="mt-6" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Télécharger le fichier
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <PreviewContent />
    </Suspense>
  )
}
