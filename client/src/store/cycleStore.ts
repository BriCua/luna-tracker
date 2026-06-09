import { create } from 'zustand'
import axios from 'axios'

export type PhaseKey = 'menstruation' | 'follicular' | 'ovulation' | 'luteal'

export interface PhaseTips {
  diet: string
  activity: string
  howToTreat: string
  howToTalk: string
}

export interface Phase {
  key: PhaseKey
  name: string
  color: string
  dayRange: [number, number]
  tips: PhaseTips
}

export interface CurrentPhase extends Phase {
  dayOfCycle: number
  cycleLength: number
  isLate: boolean
  daysLate: number
}

export interface NextPeriod {
  date: string
  daysUntil: number
}

interface CycleState {
  configured: boolean
  loading: boolean
  phase: CurrentPhase | null
  next: NextPeriod | null
  notificationsEnabled: boolean
  
  fetchStatus: () => Promise<void>
  setup: (data: { last_period_date: string; cycle_length: number }) => Promise<void>
  setNotificationsEnabled: (enabled: boolean) => void
}

export const useCycleStore = create<CycleState>((set) => ({
  configured: false,
  loading: true,
  phase: null,
  next: null,
  notificationsEnabled: Notification.permission === 'granted',

  fetchStatus: async () => {
    set({ loading: true })
    try {
      const { data } = await axios.get('/api/cycle/status')
      set({
        configured: data.configured,
        phase: data.phase || null,
        next: data.next || null,
        loading: false
      })
    } catch (error) {
      console.error('Failed to fetch status:', error)
      set({ loading: false })
    }
  },

  setup: async (payload) => {
    set({ loading: true })
    try {
      const { data } = await axios.post('/api/cycle/setup', payload)
      set({
        configured: true,
        phase: data.phase,
        next: data.next,
        loading: false
      })
    } catch (error) {
      console.error('Failed to setup cycle:', error)
      set({ loading: false })
    }
  },

  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled })
}))
