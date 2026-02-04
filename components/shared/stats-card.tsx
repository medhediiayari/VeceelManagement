import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { StatCard } from "@/types"

interface StatsCardProps extends StatCard {}

/**
 * StatsCard - Individual stat card component
 * 
 * Displays a single metric with:
 * - Icon with colored background
 * - Title, value, description
 * - Trend badge with indicator
 */
export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color, 
  trend 
}: StatsCardProps) {
  // Determine trend direction for icon
  const getTrendIcon = () => {
    if (trend.includes("+")) return <TrendingUp className="w-3 h-3" />
    if (trend.includes("-")) return <TrendingDown className="w-3 h-3" />
    return <Minus className="w-3 h-3" />
  }

  const getTrendColor = () => {
    if (trend.includes("+")) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400"
    if (trend.includes("-") || trend.includes("overdue")) return "text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400"
    return "text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400"
  }

  return (
    <Card className="group relative p-5 flex flex-col gap-4 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 border-transparent hover:border-primary/20">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-start justify-between">
        <div className={cn(
          "p-3 rounded-xl transition-transform duration-300 group-hover:scale-110",
          color
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <Badge 
          variant="secondary" 
          className={cn(
            "text-[10px] font-medium px-2 py-0.5 flex items-center gap-1 border-0",
            getTrendColor()
          )}
        >
          {getTrendIcon()}
          {trend}
        </Badge>
      </div>
      
      <div className="relative space-y-1">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          {value}
        </p>
        <p className="text-xs text-muted-foreground/80">{description}</p>
      </div>
    </Card>
  )
}

interface StatsGridProps {
  stats: StatCard[]
  columns?: 2 | 3 | 4
}

/**
 * StatsGrid - Grid layout for multiple stat cards
 * 
 * Responsive grid that shows stats in a consistent layout
 */
export function StatsGrid({ stats, columns = 4 }: StatsGridProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div className={cn("grid grid-cols-1 gap-4", gridCols[columns])}>
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="animate-slide-in-up"
          style={{ animationDelay: `${index * 75}ms` }}
        >
          <StatsCard {...stat} />
        </div>
      ))}
    </div>
  )
}
