require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

// Files Configuration
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/assets', express.static(__dirname + '/views/assets'));
const cookieParser = require('cookie-parser')


// Routes
const indexRouter = require('./router/index')
const registerRouter = require('./router/register')
const DashboardRouter = require('./router/Dashboard')

app.use('/', indexRouter)
app.use('/',registerRouter)
app.use('/',DashboardRouter)
app.use(cookieParser())

app.get('/getcookie', async function (req, res) {
    console.log(await req.cookies)
    res.send(await req.cookies);
})

// Database connection
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Database Connected")
    })
    .catch((err) => {
        console.error("Database Connection Error:", err)
    })

// Starting server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})
