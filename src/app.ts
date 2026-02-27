import express from 'express'

const app = express()


const PORT = process.env.PORT || 3000;


// middleware to parse json request bodies
app.use(express.json())

// health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'OK' })
})



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

export default app