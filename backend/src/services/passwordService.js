const { getDb } = require('../config/db')

const COLLECTION = 'passwords'

async function list({ q, filterBy } = {}) {
  const db = getDb()
  const col = db.collection(COLLECTION)
  if (q && q.trim()) {
    const query = q.trim()
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const $or = []
    if (!filterBy || filterBy === 'all' || filterBy === 'site') $or.push({ site: regex })
    if (!filterBy || filterBy === 'all' || filterBy === 'username') $or.push({ username: regex })
    if (!filterBy || filterBy === 'all' || filterBy === 'tag') $or.push({ tags: regex })
    return col.find({ $or }).toArray()
  }
  return col.find({}).toArray()
}

async function create(doc) {
  const db = getDb()
  const col = db.collection(COLLECTION)
  const res = await col.insertOne(doc)
  return { success: true, result: res }
}

async function removeById(id) {
  const db = getDb()
  const col = db.collection(COLLECTION)
  const res = await col.deleteOne({ id })
  return { success: true, result: res }
}

async function updateById(id, update) {
  const db = getDb()
  const col = db.collection(COLLECTION)
  const { _id, id: _, ...rest } = update || {}
  const res = await col.updateOne({ id }, { $set: rest }, { upsert: false })
  return { success: true, result: res }
}

module.exports = { list, create, removeById, updateById }
