const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.render('index')
})

router.get('/Dashboard', (req, res) => {
    res.render('Dashboard')
})

module.exports = router;