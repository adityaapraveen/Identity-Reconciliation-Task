import express from 'express'
import dotenv from 'dotenv'
import { getDb } from './config/database'

const PORT = process.env.PORT || 3000

dotenv.config()

const app = express()
app.use(express.json())

app.get('/health', async (require, res) => {
    try {
        const db = await getDb()
        await db.get('SELECT 1')
        res.status(200).json({ message: 'OK' })
    } catch (error) {
        console.error('Database connection failed:', error)
        res.status(500).json({ message: 'Database connection failed' })
    }
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

export default app