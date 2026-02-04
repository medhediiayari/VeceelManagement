"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Eye, MoreHorizontal, FileX } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Column configuration type
export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
  className?: string
}

// Actions configuration
export interface TableActions<T> {
  onView?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  custom?: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    onClick: (item: T) => void
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  }[]
}

interface DataTableProps<T extends { id: string }> {
  data: T[]
  columns: Column<T>[]
  actions?: TableActions<T>
  emptyMessage?: string
  title?: string
}

/**
 * DataTable - Reusable table component with actions
 * 
 * Features:
 * - Generic typing for any data shape
 * - Custom column renderers
 * - Built-in view/edit/delete actions
 * - Custom action support
 * - Empty state handling
 */
export function DataTable<T extends { id: string }>({
  data,
  columns,
  actions,
  emptyMessage = "No data available",
  title,
}: DataTableProps<T>) {
  const hasActions = actions && (actions.onView || actions.onEdit || actions.onDelete || actions.custom?.length)

  return (
    <Card className="overflow-hidden border-border/50">
      {title && (
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30 hover:bg-secondary/30 border-b border-border/50">
              {columns.map((column) => (
                <TableHead 
                  key={String(column.key)} 
                  className={cn(
                    "text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3",
                    column.className
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
              {hasActions && (
                <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 w-[100px]">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="h-40"
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="p-3 rounded-full bg-secondary mb-3">
                      <FileX className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {emptyMessage}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow 
                  key={item.id}
                  className={cn(
                    "transition-colors hover:bg-secondary/50 border-b border-border/30 last:border-0",
                    "animate-slide-in-up"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {columns.map((column) => (
                    <TableCell 
                      key={`${item.id}-${String(column.key)}`} 
                      className={cn("py-4", column.className)}
                    >
                      {column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] ?? "")}
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell className="text-right py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-secondary"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {actions.onView && (
                            <DropdownMenuItem onClick={() => actions.onView?.(item)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                          )}
                          {actions.onEdit && (
                            <DropdownMenuItem onClick={() => actions.onEdit?.(item)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {actions.custom?.map((action, idx) => {
                            const Icon = action.icon
                            return (
                              <DropdownMenuItem 
                                key={idx} 
                                onClick={() => action.onClick(item)}
                              >
                                <Icon className="h-4 w-4 mr-2" />
                                {action.label}
                              </DropdownMenuItem>
                            )
                          })}
                          {actions.onDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => actions.onDelete?.(item)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

/**
 * StatusBadge - Standardized status badge component
 */
export function StatusBadge({ status }: { status: "active" | "inactive" | "pending" | "approved" | "rejected" }) {
  const variants = {
    active: { 
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", 
      label: "Active",
      dot: "bg-emerald-500"
    },
    inactive: { 
      className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700", 
      label: "Inactive",
      dot: "bg-slate-400"
    },
    pending: { 
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800", 
      label: "Pending",
      dot: "bg-amber-500"
    },
    approved: { 
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", 
      label: "Approved",
      dot: "bg-emerald-500"
    },
    rejected: { 
      className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800", 
      label: "Rejected",
      dot: "bg-rose-500"
    },
  }

  const { className, label, dot } = variants[status]

  return (
    <Badge variant="outline" className={cn("font-medium gap-1.5 border", className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  )
}
