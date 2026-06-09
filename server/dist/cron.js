import cron from 'node-cron';
import db from './db/index.js';
import { getNextPeriodDate } from './services/phaseEngine.js';
import { sendToAll } from './services/pushService.js';
// ─── Notification schedule ────────────────────────────────────────────────────
// Fires every day at 08:00 server local time.
// Checks how many days until the next period and sends a notification
// if it matches one of the reminder thresholds.
cron.schedule('0 8 * * *', async () => {
    console.log('[cron] Running daily notification check...');
    const row = db
        .prepare('SELECT * FROM cycle ORDER BY id DESC LIMIT 1')
        .get();
    if (!row) {
        console.log('[cron] No cycle configured. Skipping.');
        return;
    }
    const { daysUntil } = getNextPeriodDate(row.last_period_date, row.cycle_length);
    const NOTIFY_AT = [7, 3, 2, 1];
    if (!NOTIFY_AT.includes(daysUntil)) {
        console.log(`[cron] ${daysUntil} days until period. No notification needed.`);
        return;
    }
    const payload = buildPayload(daysUntil);
    console.log(`[cron] Sending notification: ${daysUntil} day(s) until period.`);
    await sendToAll(payload);
    db.prepare(`
    INSERT INTO notification_log (type) VALUES (?)
  `).run(`${daysUntil}_days`);
    console.log('[cron] Notification sent and logged.');
});
// ─── buildPayload ─────────────────────────────────────────────────────────────
// Returns the notification title and body based on urgency.
function buildPayload(daysUntil) {
    if (daysUntil === 1) {
        return {
            title: '🌸 Period Tomorrow',
            body: 'Her period starts tomorrow. Be extra gentle today 💜',
        };
    }
    if (daysUntil <= 3) {
        return {
            title: '🌸 Period Soon',
            body: `Her period is ${daysUntil} days away. Check Luna for tips.`,
        };
    }
    return {
        title: '🌸 Period in a Week',
        body: 'Her period is 7 days away. A good time to stock up on comfort snacks.',
    };
}
