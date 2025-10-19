const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const AUTH_SECRET = process.env.AUTH_SECRET || 'passop_auth_dev'
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || ''
const AUTH_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH || ''

function sign(payload) {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: '12h' })
}

function verifyToken(req, res, next) {
  const header = req.headers['authorization'] || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).send({ error: 'Unauthorized' })
  try {
    const decoded = jwt.verify(token, AUTH_SECRET)
    req.user = decoded
    next()
  } catch (e) {
    return res.status(401).send({ error: 'Unauthorized' })
  }
}

async function validatePassword(input) {
  if (AUTH_PASSWORD_HASH) {
    return bcrypt.compare(input || '', AUTH_PASSWORD_HASH)
  }
  if (AUTH_PASSWORD) {
    return (input || '') === AUTH_PASSWORD
  }
  // If no password configured, deny login to avoid accidental exposure
  return false
}

module.exports = { sign, verifyToken, validatePassword }
