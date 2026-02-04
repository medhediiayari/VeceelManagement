import { Card } from "@/components/ui/card"
import { Plus, Upload, Settings, Edit, Trash, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Activity } from "@/types"

interface ActivityListProps {
  activities: Activity[]
  title?: string
  maxItems?: number
}

/**
 * ActivityList - Displays a list of recent activities
 * 
 * Shows activities with:
 * - Type-specific icons with colors
 * - Action title and details
 * - Timestamp with relative formatting
 */
export function ActivityList({ 
  activities, 
  title = "Recent Activity",
  maxItems 
}: ActivityListProps) {
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities

  const getIconConfig = (type: Activity["type"]) => {
    switch (type) {
      case "create":
        return { icon: Plus, bg: "bg-emerald-100 dark:bg-emerald-900/30", color: "text-emerald-600 dark:text-emerald-400" }
      case "upload":
        return { icon: Upload, bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-600 dark:text-blue-400" }
      case "config":
        return { icon: Settings, bg: "bg-purple-100 dark:bg-purple-900/30", color: "text-purple-600 dark:text-purple-400" }
      case "update":
        return { icon: Edit, bg: "bg-amber-100 dark:bg-amber-900/30", color: "text-amber-600 dark:text-amber-400" }
      case "delete":
        return { icon: Trash, bg: "bg-rose-100 dark:bg-rose-900/30", color: "text-rose-600 dark:text-rose-400" }
      default:
        return { icon: AlertCircle, bg: "bg-slate-100 dark:bg-slate-800", color: "text-slate-600 dark:text-slate-400" }
    }
  }

  return (
    <Card className="p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full">
          {displayActivities.length} items
        </span>
      </div>
      <div className="space-y-1">
        {displayActivities.map((activity, index) => {
          const { icon: Icon, bg, color } = getIconConfig(activity.type)
          return (
            <div
              key={index}
              className={cn(
                "group flex items-start gap-4 p-3 -mx-3 rounded-xl transition-colors hover:bg-secondary/50",
                "animate-slide-in-up"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn("p-2 rounded-lg flex-shrink-0", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {activity.details}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <Clock className="w-3 h-3" />
                {activity.timestamp}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
