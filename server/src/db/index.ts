import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'luna.db')

const DATA_DIR = path.dirname(DB_PATH)
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS cycle (
    id               INTEGER PRIMARY KEY,
    last_period_date TEXT    NOT NULL,
    cycle_length     INTEGER NOT NULL DEFAULT 28,
    period_duration  INTEGER NOT NULL DEFAULT 5,
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint   TEXT    NOT NULL UNIQUE,
    p256dh     TEXT    NOT NULL,
    auth       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notification_log (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    type    TEXT    NOT NULL,
    sent_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`)

export type CycleSettings = {
  id: number
  last_period_date: string
  cycle_length: number
  period_duration: number
  updated_at: string
}

export type PushSubscription = {
  id: number
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export default db