import React from 'react'
import type { NextPeriod } from '../store/cycleStore'
import { Calendar, Clock } from 'lucide-react'

interface CountdownProps {
  next: NextPeriod
  isLate?: boolean
}

export const Countdown: React.FC<CountdownProps> = ({ next, isLate }) => {
  const getColorClass = () => {
    if (isLate) return 'bg-slate-100 text-slate-600'
    if (next.daysUntil <= 2) return 'bg-rose-100 text-rose-600'
    if (next.daysUntil <= 7) return 'bg-amber-100 text-amber-600'
    return 'bg-emerald-100 text-emerald-600'
  }

  const getLabel = () => {
    if (isLate) return 'Expected'
    if (next.daysUntil === 0) return 'Today'
    if (next.daysUntil === 1) return 'Tomorrow'
    return `In ${next.daysUntil} days`
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-3xl soft-shadow glass-card border border-white/50`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-xl ${getColorClass()}`}>
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-on-surface/40 uppercase tracking-widest">Next Period</p>
          <p className="text-sm font-bold text-on-surface">{new Date(next.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      <div className={`px-4 py-2 rounded-2xl font-bold flex items-center space-x-2 ${getColorClass()}`}>
        <Clock className="w-4 h-4" />
        <span>{getLabel()}</span>
      </div>
    </div>
  )
}
