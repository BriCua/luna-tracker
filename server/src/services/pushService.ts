import webpush from 'web-push'
import db from '../db/index.js'
import type { PushSubscription } from '../db/index.js'

// ─── VAPID Setup ──────────────────────────────────────────────────────────────
// This runs once when the module is first imported.
// Configures web-push with your credentials so every sendNotification()
// call is already authenticated — you don't pass keys on each call.
webpush.setVapidDetails(
  'mailto:admin@lunatracker.local',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotificationPayload = {
  title: string
  body: string
  data?: Record<string, unknown>
}

// ─── sendToAll ────────────────────────────────────────────────────────────────
// Fetches every stored subscription and attempts to send the notification.
// Dead subscriptions (410 Gone) are automatically removed from the database.
// Other errors are logged but don't crash the process.
export async function sendToAll(payload: NotificationPayload): Promise<void> {
  const subscriptions = db
    .prepare('SELECT * FROM push_subscriptions')
    .all() as PushSubscription[]

  if (subscriptions.length === 0) return

  const results = await Promise.allSettled(
    subscriptions.map(sub => sendOne(sub, payload))
  )

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`Push failed for subscription ${subscriptions[i].id}:`, result.reason)
    }
  })
}

// ─── sendOne ──────────────────────────────────────────────────────────────────
// Sends a notification to a single subscription.
// If the subscription is dead (410), deletes it from the database.
async function sendOne(sub: PushSubscription, payload: NotificationPayload): Promise<void> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      },
      JSON.stringify(payload)
    )
  } catch (err: unknown) {
    const isExpired = (err as { statusCode?: number }).statusCode === 410

    if (isExpired) {
      db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(sub.endpoint)
      console.log(`Removed expired subscription: ${sub.endpoint.slice(0, 50)}...`)
      return
    }

    // re-throw anything else so Promise.allSettled catches it
    throw err
  }
}