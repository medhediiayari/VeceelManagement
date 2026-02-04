import { UsersContent } from "@/components/users/users-content"

/**
 * Users Page
 * 
 * Uses: UsersContent component
 * Layout: (dashboard)/layout.tsx provides sidebar and navigation
 * 
 * To troubleshoot:
 * 1. Check components/users/users-content.tsx for content issues
 * 2. Check data/mock-data.ts for data issues
 * 3. Check components/shared/data-table.tsx for table issues
 */
export default function UsersPage() {
  return <UsersContent />
}
