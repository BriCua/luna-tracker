import React, { useState } from 'react'
import axios from 'axios'
import { Bell, BellOff, CheckCircle2, Loader2 } from 'lucide-react'
import { useCycleStore } from '../store/cycleStore'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export const NotificationSetup: React.FC = () => {
  const { notificationsEnabled, setNotificationsEnabled } = useCycleStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subscribe = async () => {
    setLoading(true)
    setError(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Permission not granted')
      }

      const registration = await navigator.serviceWorker.ready
      const { data: publicKey } = await axios.get('/api/push/vapid-public-key')
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      })

      await axios.post('/api/push/subscribe', subscription)
      setNotificationsEnabled(true)
    } catch (err: any) {
      console.error('Subscription failed:', err)
      setError(err.message || 'Failed to enable notifications')
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        await axios.delete('/api/push/unsubscribe', { data: { endpoint: subscription.endpoint } })
      }
      setNotificationsEnabled(false)
    } catch (err) {
      console.error('Unsubscription failed:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }

  return (
    <div className="glass-card rounded-3xl p-6 soft-shadow border border-white/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${notificationsEnabled ? 'bg-emerald-100' : 'bg-primary/10'}`}>
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-emerald-600" />
            ) : (
              <BellOff className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">Daily Support</h3>
            <p className="text-xs text-on-surface/60">Get notified at 08:00 daily</p>
          </div>
        </div>

        {notificationsEnabled ? (
          <button
            onClick={unsubscribe}
            disabled={loading}
            className="flex items-center space-x-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Enabled</span>
          </button>
        ) : (
          <button
            onClick={subscribe}
            disabled={loading}
            className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary/20 flex items-center space-x-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
            <span>Enable</span>
          </button>
        )}
      </div>
      {error && <p className="text-[10px] text-rose-500 mt-2 text-center">{error}</p>}
    </div>
  )
}
