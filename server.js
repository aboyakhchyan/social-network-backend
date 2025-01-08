const express = require('express')
const Config = require('./helpers/config')
const userRoute = require('./routes/userRoute')
const postRoute = require('./routes/postRoute')
const searchRoute = require('./routes/searchRoute')
const app = express()

const PORT = Config.port
const HOST = Config.host

app.use(express.json())
// app.use(middleware.loggingMiddleware)
app.use(userRoute)
app.use(postRoute)
app.use(searchRoute)


app.listen(PORT, () => {
    console.log(`The server is runing in ${HOST}:${PORT}`)
})