import express from 'express'
import dotenv from 'dotenv'
import { getDb } from './config/database'
import { Request, Response, NextFunction } from 'express'
import contactRoutes from './routes/contact.routes'

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

app.use('/', contactRoutes)

app.use((err:Error, req:Request, res:Response, next:NextFunction)=> {
    console.error('unhandled error:', err.message)
    console.error(err.stack)
    res.status(500).json({message: 'Internal server error'})
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

export default app