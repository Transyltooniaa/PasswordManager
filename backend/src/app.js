const express = require('express')
const bodyparser = require('body-parser')
const cors = require('cors')
const { connect } = require('./config/db')
const passwordRoutes = require('./routes/passwordRoutes')
const authRouter = require('express').Router()
const { sign, validatePassword, verifyToken } = require('./middleware/auth')
const passwordService = require('./services/passwordService')
const { encrypt, decrypt } = require('./utils/crypto')

async function createApp() {
  await connect()
  const app = express()
  app.use(cors())
  app.use(bodyparser.json())

  // Health
  app.get('/health', (req, res) => res.send({ ok: true }))

  // Auth: simple password lock to get a JWT
  authRouter.post('/login', async (req, res) => {
    const { password } = req.body || {}
    const ok = await validatePassword(password)
    if (!ok) return res.status(401).send({ error: 'Invalid credentials' })
    const token = sign({ role: 'user' })
    res.send({ token })
  })
  app.use('/api/auth', authRouter)

  // New API
  app.use('/api/passwords', verifyToken, passwordRoutes)

  // Backward compatibility with existing frontend
  app.get('/', async (req, res) => {
    const items = await passwordService.list()
    const out = items.map(item => ({ ...item, password: item.password && item.password.ct ? decrypt(item.password) : (item.password || '') }))
    res.json(out)
  })
  app.post('/', async (req, res) => {
    const body = req.body || {}
    const result = await passwordService.create({ ...body, password: encrypt(body.password || '') })
    res.send(result)
  })
  app.delete('/', async (req, res) => {
    const { id } = req.body || {}
    const result = await passwordService.removeById(id)
    res.send(result)
  })

  return app
}

module.exports = { createApp }
