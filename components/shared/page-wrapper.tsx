import { Header } from "@/components/dashboard/header"
import type { ReactNode } from "react"

interface PageWrapperProps {
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}

/**
 * PageWrapper - Standardized wrapper for all dashboard pages
 * 
 * Provides consistent:
 * - Header with title and description
 * - Optional action buttons
 * - Proper spacing and layout
 * 
 * Usage:
 * ```tsx
 * <PageWrapper
 *   title="Page Title"
 *   description="Page description"
 *   actions={<Button>Action</Button>}
 * >
 *   {content}
 * </PageWrapper>
 * ```
 */
export function PageWrapper({ 
  title, 
  description, 
  actions,
  children 
}: PageWrapperProps) {
  return (
    <>
      <Header title={title} description={description} actions={actions} />
      <div className="mt-6">
        {children}
      </div>
    </>
  )
}
