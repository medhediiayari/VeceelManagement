import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react"

interface QuickStat {
  label: string
  value: string
  variant?: "default" | "success" | "warning" | "info" | "destructive"
}

interface QuickStatsCardProps {
  title?: string
  stats: QuickStat[]
}

/**
 * QuickStatsCard - Compact list of status indicators
 * 
 * Displays key-value pairs with status badges
 * Ideal for status overview panels
 */
export function QuickStatsCard({ title = "Quick Stats", stats }: QuickStatsCardProps) {
  const getConfig = (variant: QuickStat["variant"]) => {
    switch (variant) {
      case "success":
        return { 
          icon: CheckCircle2,
          badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
          dot: "bg-emerald-500"
        }
      case "warning":
        return { 
          icon: AlertTriangle,
          badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
          dot: "bg-amber-500"
        }
      case "info":
        return { 
          icon: Info,
          badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          dot: "bg-blue-500"
        }
      case "destructive":
        return { 
          icon: XCircle,
          badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
          dot: "bg-rose-500"
        }
      default:
        return { 
          icon: Info,
          badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
          dot: "bg-slate-500"
        }
    }
  }

  return (
    <Card className="p-6 h-full">
      <h3 className="text-lg font-semibold mb-5">{title}</h3>
      <div className="space-y-4">
        {stats.map((stat, index) => {
          const { badge, dot } = getConfig(stat.variant)
          return (
            <div 
              key={index} 
              className={cn(
                "flex items-center justify-between py-3 animate-slide-in-up",
                index > 0 && "border-t border-border/50"
              )}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", dot)} />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <Badge 
                variant="secondary"
                className={cn("font-medium text-xs border-0", badge)}
              >
                {stat.value}
              </Badge>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
