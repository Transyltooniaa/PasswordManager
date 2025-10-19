const passwordService = require('../services/passwordService')
const { encrypt, decrypt } = require('../utils/crypto')

function normalizeSite(site) {
  if (!site) return site
  try {
    return new URL(site).toString()
  } catch {
    try { return new URL(`https://${site}`).toString() } catch { return site }
  }
}

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') return tags.split(',').map(t=>t.trim()).filter(Boolean)
  return []
}

async function list(req, res) {
  const { q, filterBy } = req.query
  const items = await passwordService.list({ q, filterBy })
  // Decrypt password field before sending to client
  const out = items.map(item => ({
    ...item,
    password: item.password && item.password.ct ? decrypt(item.password) : (item.password || '')
  }))
  res.json(out)
}

async function create(req, res) {
  const body = req.body || {}
  const doc = {
    id: body.id,
    site: normalizeSite(body.site),
    username: body.username,
    password: encrypt(body.password || ''),
    tags: parseTags(body.tags),
    icon: body.icon || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const result = await passwordService.create(doc)
  res.send(result)
}

async function remove(req, res) {
  const { id } = req.params
  const result = await passwordService.removeById(id)
  res.send(result)
}

async function update(req, res) {
  const { id } = req.params
  const body = req.body || {}
  const update = {
    site: body.site ? normalizeSite(body.site) : undefined,
    username: body.username,
    password: body.password !== undefined ? encrypt(body.password || '') : undefined,
    tags: body.tags ? parseTags(body.tags) : undefined,
    icon: body.icon,
    updatedAt: new Date(),
  }
  Object.keys(update).forEach(k => update[k] === undefined && delete update[k])
  const result = await passwordService.updateById(id, update)
  res.send(result)
}

module.exports = { list, create, remove, update }
