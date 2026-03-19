import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { authRouter } from './routes/auth.js'
import { progressRouter } from './routes/progress.js'
import { userRouter } from './routes/user.js'

const PORT = process.env.PORT || 3001

const app = express()
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(cookieParser())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/progress', progressRouter)
app.use('/api/user', userRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
