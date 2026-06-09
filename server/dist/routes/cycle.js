import { Router } from "express";
import db, {} from "../db/index.js";
import { getCurrentPhase, getNextPeriodDate } from "../services/phaseEngine.js";
const router = Router();
router.get("/status", (_req, res) => {
    const row = db
        .prepare("SELECT * FROM cycle ORDER BY id DESC LIMIT 1")
        .get();
    if (!row) {
        res.json({ configured: false });
        return;
    }
    const phase = getCurrentPhase(row.last_period_date, row.cycle_length);
    const next = getNextPeriodDate(row.last_period_date, row.cycle_length);
    res.json({
        configured: true,
        phase,
        next,
        settings: row,
    });
});
router.post("/setup", (req, res) => {
    const { last_period_date, cycle_length = 28, period_duration = 5, } = req.body;
    if (!last_period_date) {
        res.status(400).json({ error: "last_period_date is required" });
        return;
    }
    db.prepare(`
    INSERT INTO cycle (last_period_date, cycle_length, period_duration)
    VALUES (?, ?, ?)
  `).run(last_period_date, cycle_length, period_duration);
    const phase = getCurrentPhase(last_period_date, cycle_length);
    const next = getNextPeriodDate(last_period_date, cycle_length);
    res.status(201).json({
        configured: true,
        phase,
        next,
    });
});
router.put("/update", (req, res) => {
    const { last_period_date, cycle_length = 28, period_duration = 5, } = req.body;
    if (!last_period_date) {
        res.status(400).json({ error: "last_period_date is required" });
        return;
    }
    const existing = db
        .prepare("SELECT id FROM cycle ORDER BY id DESC LIMIT 1")
        .get();
    if (!existing) {
        res.status(404).json({ error: "No cycle found. Setup first." });
        return;
    }
    db.prepare(`
    UPDATE cycle
    SET last_period_date = ?,
        cycle_length     = ?,
        period_duration  = ?,
        updated_at       = datetime('now')
    WHERE id = ?
  `).run(last_period_date, cycle_length, period_duration, existing.id);
    const phase = getCurrentPhase(last_period_date, cycle_length);
    const next = getNextPeriodDate(last_period_date, cycle_length);
    res.json({
        configured: true,
        phase,
        next,
    });
});
export default router;
