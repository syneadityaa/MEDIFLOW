const express = require('express')
const { registerUser } = require('../controllers/controllers.registeration');

const router = express.Router()

router.post("/register",registerUser)

module.exports = router