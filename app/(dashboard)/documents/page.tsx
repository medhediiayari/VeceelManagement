import { DocumentsContent } from "@/components/documents/documents-content"

/**
 * Documents Page
 * 
 * Uses: DocumentsContent component
 * Layout: (dashboard)/layout.tsx provides sidebar and navigation
 * 
 * To troubleshoot:
 * 1. Check components/documents/documents-content.tsx for content issues
 * 2. Check data/mock-data.ts for data issues
 */
export default function DocumentsPage() {
  return <DocumentsContent />
}
