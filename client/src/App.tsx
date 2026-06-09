import React, { useEffect } from 'react'
import { useCycleStore } from './store/cycleStore'
import { SetupScreen } from './components/SetupScreen'
import { PhaseCard } from './components/PhaseCard'
import { Countdown } from './components/Countdown'
import { NotificationSetup } from './components/NotificationSetup'
import { ChatBot } from './components/ChatBot'
import { Heart, Loader2 } from 'lucide-react'

const App: React.FC = () => {
  const { configured, loading, phase, next, fetchStatus } = useCycleStore()

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-primary">
        <div className="relative">
          <Heart className="w-12 h-12 animate-pulse" />
          <Loader2 className="w-12 h-12 animate-spin absolute top-0 left-0 opacity-20" />
        </div>
        <p className="mt-4 font-bold text-sm uppercase tracking-widest animate-pulse">Loading Luna...</p>
      </div>
    )
  }

  if (!configured) {
    return <SetupScreen />
  }

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Top Bar */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-30">
        <div className="flex items-center space-x-2">
          <div className="bg-primary p-2 rounded-xl soft-shadow">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Luna</h1>
        </div>
        <div className="bg-white/50 px-3 py-1 rounded-full border border-on-surface/5">
          <p className="text-[10px] font-bold uppercase text-on-surface/40 tracking-wider">Mobile Tracker</p>
        </div>
      </header>

      <main className="px-6 space-y-6 max-w-lg mx-auto animate-in fade-in duration-700">
        {phase && <PhaseCard phase={phase} />}
        {next && <Countdown next={next} isLate={phase?.isLate} />}
        <NotificationSetup />
        
        <div className="pt-4 text-center">
          <p className="text-[10px] text-on-surface/30 leading-relaxed max-w-[200px] mx-auto italic">
            "Your presence and empathy are her greatest comfort."
          </p>
        </div>
      </main>

      <ChatBot />
    </div>
  )
}

export default App
