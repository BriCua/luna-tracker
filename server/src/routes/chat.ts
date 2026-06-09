import { Router } from 'express'
import type { Request, Response } from 'express'
import db from '../db/index.js'
import type { CycleSettings } from '../db/index.js'
import { getCurrentPhase } from '../services/phaseEngine.js'
import { chat } from '../services/groqClient.js'
import type { ChatMessage } from '../services/groqClient.js'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  const { messages } = req.body as { messages: ChatMessage[] }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required.' })
    return
  }

  const row = db
    .prepare('SELECT * FROM cycle ORDER BY id DESC LIMIT 1')
    .get() as CycleSettings | undefined

  if (!row) {
    res.status(400).json({ error: 'Cycle not configured. Complete setup first.' })
    return
  }

  const phase = getCurrentPhase(row.last_period_date, row.cycle_length)

  const { reply, tokens } = await chat(messages, phase)

  console.log(`Chat completed. Tokens used: ${tokens}`)

  res.json({ reply })
})

export default router