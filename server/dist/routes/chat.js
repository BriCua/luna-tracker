import { Router } from 'express';
import db from '../db/index.js';
import { getCurrentPhase } from '../services/phaseEngine.js';
import { chat } from '../services/groqClient.js';
const router = Router();
router.post('/', async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'messages array is required.' });
        return;
    }
    const row = db
        .prepare('SELECT * FROM cycle ORDER BY id DESC LIMIT 1')
        .get();
    if (!row) {
        res.status(400).json({ error: 'Cycle not configured. Complete setup first.' });
        return;
    }
    const phase = getCurrentPhase(row.last_period_date, row.cycle_length);
    const { reply, tokens } = await chat(messages, phase);
    console.log(`Chat completed. Tokens used: ${tokens}`);
    res.json({ reply });
});
export default router;
