//This is a file containing the necessary routes for the necessary authentication purposes
//i.e; login, register, logout, refresh and the like
//Remember that there would not be any logic here, channel all logics into the controllers

const express = require('express');
const router =express.Router();
const { login, register, me } = require('./../controllers/authController');
const auth = require("./../middleware/auth.js");



router.post('/login', login)
router.post('/register', register)
router.get('/me', auth, me)




module.exports = router;