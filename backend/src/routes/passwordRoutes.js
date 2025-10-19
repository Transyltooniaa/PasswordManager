const express = require('express')
const ctrl = require('../controllers/passwordController')

const router = express.Router()

// New RESTful endpoints
router.get('/', ctrl.list)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)
router.delete('/:id', ctrl.remove)

module.exports = router
