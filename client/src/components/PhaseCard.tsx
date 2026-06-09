import React, { useState } from 'react'
import type { CurrentPhase } from '../store/cycleStore'
import { Sparkles, Utensils, Zap, Heart, MessageCircle } from 'lucide-react'

interface PhaseCardProps {
  phase: CurrentPhase
}

type Tab = 'diet' | 'activity' | 'treat' | 'talk'

export const PhaseCard: React.FC<PhaseCardProps> = ({ phase }) => {
  const [activeTab, setActiveTab] = useState<Tab>('diet')

  const tabs = [
    { id: 'diet' as Tab, label: 'Diet', icon: Utensils },
    { id: 'activity' as Tab, label: 'Activity', icon: Zap },
    { id: 'treat' as Tab, label: 'How to Treat', icon: Heart },
    { id: 'talk' as Tab, label: 'How to Talk', icon: MessageCircle },
  ]

  const getTipContent = () => {
    switch (activeTab) {
      case 'diet': return phase.tips.diet
      case 'activity': return phase.tips.activity
      case 'treat': return phase.tips.howToTreat
      case 'talk': return phase.tips.howToTalk
    }
  }

  return (
    <div className="w-full glass-card rounded-3xl soft-shadow overflow-hidden border-2" style={{ borderColor: `${phase.color}20` }}>
      {/* Header */}
      <div className="p-6 text-white relative overflow-hidden" style={{ backgroundColor: phase.color }}>
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
          <Sparkles size={120} />
        </div>
        
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Current Phase</p>
          <h2 className="text-4xl font-bold mb-4">{phase.name}</h2>
          
          <div className="flex items-center space-x-2 bg-black/10 w-fit px-3 py-1 rounded-full text-sm font-medium">
            <span>Day {phase.dayOfCycle} of {phase.cycleLength}</span>
          </div>
        </div>
      </div>

      {/* Late Banner */}
      {phase.isLate && (
        <div className="bg-amber-50 border-y border-amber-100 p-4 flex items-center space-x-3">
          <div className="bg-amber-100 p-2 rounded-xl">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">Period is {phase.daysLate} {phase.daysLate === 1 ? 'day' : 'days'} late</p>
            <p className="text-xs text-amber-700">Cycles vary, this is completely normal.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="p-4 bg-white/30 border-b border-on-surface/5 flex justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all w-[22%] ${
                isActive ? 'bg-white soft-shadow scale-105' : 'opacity-40 hover:opacity-60'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? '' : 'text-on-surface'}`} style={{ color: isActive ? phase.color : undefined }} />
              <span className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'text-on-surface' : 'text-on-surface'}`}>
                {tab.id === 'treat' ? 'Treat' : tab.id === 'talk' ? 'Talk' : tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tip Content */}
      <div className="p-8 min-h-[160px] flex items-center justify-center text-center">
        <p className="text-lg leading-relaxed text-on-surface/80 font-medium animate-in fade-in zoom-in-95 duration-300">
          "{getTipContent()}"
        </p>
      </div>
    </div>
  )
}

import { Calendar } from 'lucide-react'
