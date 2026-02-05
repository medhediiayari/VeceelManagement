"use client"

import { useSearchParams } from "next/navigation"
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
  ArrowLeft,
  Calendar,
  User,
  HardDrive,
  Table as TableIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SpreadsheetData } from "@/types"
import * as XLSX from "xlsx"

function PreviewContent() {
  const searchParams = useSearchParams()
  const [fileData, setFileData] = useState<{
    name: string
    size: string
    type: string
    mimeType: string
    uploadedBy: string
    uploadedAt: string
    spreadsheetData?: SpreadsheetData
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get file data from sessionStorage (set before opening this window)
    const storedData = sessionStorage.getItem("previewFileData")
    if (storedData) {
      try {
        setFileData(JSON.parse(storedData))
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
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading preview...</p>
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
            <h2 className="text-xl font-semibold mb-2">No File Data</h2>
            <p className="text-muted-foreground mb-4">
              Unable to load file preview. Please try again from the Documents page.
            </p>
            <Button onClick={() => window.close()}>
              Close Window
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
              <Button variant="ghost" size="icon" onClick={() => window.close()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
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
                      {fileData.size}
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
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" onClick={() => window.close()}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {fileData.spreadsheetData ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TableIcon className="w-5 h-5" />
                  Spreadsheet Data
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {fileData.spreadsheetData.rows.length} rows × {fileData.spreadsheetData.headers.length} columns
                  </Badge>
                  {fileData.spreadsheetData.sheetNames && fileData.spreadsheetData.sheetNames.length > 1 && (
                    <Badge variant="outline">
                      Sheet: {fileData.spreadsheetData.activeSheet || fileData.spreadsheetData.sheetNames[0]}
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
                      {fileData.spreadsheetData.headers.map((header, idx) => (
                        <TableHead key={idx} className="font-semibold min-w-[120px]">
                          {header || `Column ${idx + 1}`}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fileData.spreadsheetData.rows.map((row, rowIdx) => (
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
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Icon className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-2">{fileData.name}</h2>
              <p className="text-muted-foreground mb-6">
                Preview not available for this file type.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Size</p>
                  <p className="font-medium">{fileData.size}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Type</p>
                  <p className="font-medium">{fileData.mimeType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Uploaded By</p>
                  <p className="font-medium">{fileData.uploadedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Date</p>
                  <p className="font-medium">{formatDate(fileData.uploadedAt)}</p>
                </div>
              </div>
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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PreviewContent />
    </Suspense>
  )
}
