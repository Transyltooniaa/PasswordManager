const { MongoClient } = require('mongodb')

const MONGO_URL = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME || 'passop'

let client
let db

async function connect() {
  if (db) return db
  client = new MongoClient(MONGO_URL)
  await client.connect()
  db = client.db(DB_NAME)
  return db
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call connect() first.')
  }
  return db
}

async function close() {
  if (client) await client.close()
  client = undefined
  db = undefined
}

module.exports = { connect, getDb, close }
