import React, { useState } from 'react'
import { useCycleStore } from '../store/cycleStore'
import { Heart, Calendar, Clock, ArrowRight } from 'lucide-react'

export const SetupScreen: React.FC = () => {
  const setup = useCycleStore((state) => state.setup)
  const [date, setDate] = useState('')
  const [length, setLength] = useState(28)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return

    setIsSubmitting(true)
    await setup({ last_period_date: date, cycle_length: length })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <div className="max-w-md w-full glass-card p-8 rounded-3xl soft-shadow animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-2xl">
            <Heart className="w-10 h-10 text-primary animate-pulse" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 text-on-surface">Welcome to Luna</h1>
        <p className="text-center text-on-surface/60 mb-8 leading-relaxed">
          Help us understand her cycle so you can be there for her with the right support at the right time.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-on-surface/80 ml-1">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              Last period started on
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-4 bg-white/50 border border-on-surface/10 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-on-surface/80 ml-1">
              <Clock className="w-4 h-4 mr-2 text-primary" />
              Average cycle length (days)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="21"
                max="35"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
                className="flex-grow h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-xl font-bold text-primary w-8 text-center">{length}</span>
            </div>
            <p className="text-xs text-on-surface/40 text-center italic mt-1">
              Typical is 28 days.
            </p>
          </div>

          <button
            type="submit"
            disabled={!date || isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span>{isSubmitting ? 'Setting up...' : 'Start Supporting'}</span>
            {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </div>
    </div>
  )
}
