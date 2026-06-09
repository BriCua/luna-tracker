import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import cycleRoutes from './routes/cycle.js'
import pushRoutes from './routes/push.js'
import chatRoutes from './routes/chat.js'
import './cron.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost'
}))
app.use(express.json())

// Routes
app.use('/api/cycle', cycleRoutes)
app.use('/api/push', pushRoutes)
app.use('/api/chat', chatRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
