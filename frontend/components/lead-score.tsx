'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Target,
  TrendingUp,
  TrendingDown,
  Mail,
  Phone,
  Globe,
  Calendar,
  DollarSign,
  Activity,
  Star,
  Info,
} from 'lucide-react'

interface LeadScoreProps {
  score: number
  maxScore?: number
  factors?: ScoreFactor[]
  showBreakdown?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface ScoreFactor {
  name: string
  points: number
  maxPoints: number
  description?: string
}

const SCORE_THRESHOLDS = {
  hot: 80,
  warm: 50,
  cold: 0,
}

const getScoreColor = (score: number) => {
  if (score >= SCORE_THRESHOLDS.hot) return 'text-green-600 dark:text-green-400'
  if (score >= SCORE_THRESHOLDS.warm) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

const getScoreLabel = (score: number) => {
  if (score >= SCORE_THRESHOLDS.hot) return { label: 'Hot', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
  if (score >= SCORE_THRESHOLDS.warm) return { label: 'Warm', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }
  return { label: 'Cold', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
}

const getProgressColor = (score: number) => {
  if (score >= SCORE_THRESHOLDS.hot) return 'bg-green-500'
  if (score >= SCORE_THRESHOLDS.warm) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function LeadScoreDisplay({
  score,
  maxScore = 100,
  factors,
  showBreakdown = false,
  size = 'md',
  className = '',
}: LeadScoreProps) {
  const percentage = Math.min((score / maxScore) * 100, 100)
  const { label, color } = getScoreLabel(score)

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <div className={`font-bold ${sizeClasses[size]} ${getScoreColor(score)}`}>
          {score}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={color}>{label}</Badge>
            {factors && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Lead score based on engagement and profile completeness</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressColor(score)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {showBreakdown && factors && factors.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Score Breakdown</p>
          {factors.map((factor, index) => (
            <ScoreFactorRow key={index} factor={factor} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ScoreFactorRowProps {
  factor: ScoreFactor
}

function ScoreFactorRow({ factor }: ScoreFactorRowProps) {
  const percentage = (factor.points / factor.maxPoints) * 100

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-32 text-muted-foreground truncate">{factor.name}</div>
      <div className="flex-1">
        <Progress value={percentage} className="h-1.5" />
      </div>
      <div className="w-16 text-right font-medium">
        +{factor.points}/{factor.maxPoints}
      </div>
    </div>
  )
}

// Lead Score Card for detail views
interface LeadScoreCardProps {
  score: number
  previousScore?: number
  factors?: ScoreFactor[]
  lastUpdated?: string
}

export function LeadScoreCard({
  score,
  previousScore,
  factors = [],
  lastUpdated,
}: LeadScoreCardProps) {
  const scoreChange = previousScore !== undefined ? score - previousScore : 0
  const { label, color } = getScoreLabel(score)

  // Default factors if none provided
  const defaultFactors: ScoreFactor[] = factors.length > 0 ? factors : [
    { name: 'Email Engagement', points: Math.min(score * 0.3, 30), maxPoints: 30 },
    { name: 'Website Activity', points: Math.min(score * 0.2, 20), maxPoints: 20 },
    { name: 'Profile Completeness', points: Math.min(score * 0.15, 15), maxPoints: 15 },
    { name: 'Social Signals', points: Math.min(score * 0.15, 15), maxPoints: 15 },
    { name: 'Deal History', points: Math.min(score * 0.2, 20), maxPoints: 20 },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          Lead Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-muted-foreground">/100</span>
          </div>
          <div className="text-right">
            <Badge className={color}>{label}</Badge>
            {scoreChange !== 0 && (
              <div className={`flex items-center gap-1 mt-1 text-sm ${
                scoreChange > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {scoreChange > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {scoreChange > 0 ? '+' : ''}{scoreChange}
              </div>
            )}
          </div>
        </div>

        <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-500 ${getProgressColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Score Factors</p>
          {defaultFactors.map((factor, index) => (
            <div key={index} className="flex items-center gap-2">
              <FactorIcon name={factor.name} />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>{factor.name}</span>
                  <span className="text-muted-foreground">
                    {Math.round(factor.points)}/{factor.maxPoints}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(factor.points / factor.maxPoints) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-4">
            Last updated: {lastUpdated}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function FactorIcon({ name }: { name: string }) {
  const iconClass = 'h-4 w-4 text-muted-foreground'
  
  if (name.toLowerCase().includes('email')) return <Mail className={iconClass} />
  if (name.toLowerCase().includes('website') || name.toLowerCase().includes('activity')) return <Globe className={iconClass} />
  if (name.toLowerCase().includes('phone') || name.toLowerCase().includes('call')) return <Phone className={iconClass} />
  if (name.toLowerCase().includes('deal') || name.toLowerCase().includes('value')) return <DollarSign className={iconClass} />
  if (name.toLowerCase().includes('profile')) return <Star className={iconClass} />
  if (name.toLowerCase().includes('social')) return <Activity className={iconClass} />
  if (name.toLowerCase().includes('time') || name.toLowerCase().includes('recency')) return <Calendar className={iconClass} />
  
  return <Activity className={iconClass} />
}

// Compact badge version for tables
interface LeadScoreBadgeProps {
  score: number
  showLabel?: boolean
}

export function LeadScoreBadge({ score, showLabel = true }: LeadScoreBadgeProps) {
  const { label, color } = getScoreLabel(score)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={`${color} font-mono`}>
            {score}
            {showLabel && <span className="ml-1 text-xs opacity-75">• {label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Lead Score: {score}/100</p>
          <p className="text-xs text-muted-foreground">{label} lead based on engagement</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { SCORE_THRESHOLDS, getScoreColor, getScoreLabel }
