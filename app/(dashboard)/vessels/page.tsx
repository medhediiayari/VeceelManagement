import { VesselsContent } from "@/components/vessels/vessels-content"

/**
 * Vessels Page
 * 
 * Uses: VesselsContent component
 * Layout: (dashboard)/layout.tsx provides sidebar and navigation
 * 
 * To troubleshoot:
 * 1. Check components/vessels/vessels-content.tsx for content issues
 * 2. Check data/mock-data.ts for data issues
 * 3. Check components/shared/data-table.tsx for table issues
 */
export default function VesselsPage() {
  return <VesselsContent />
}
