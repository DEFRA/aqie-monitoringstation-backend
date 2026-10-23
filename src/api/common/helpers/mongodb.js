import { MongoClient } from 'mongodb'
import { LockManager } from 'mongo-locks'

import { config } from '~/src/config/index.js'
import { mongoStatusCodes } from '~/src/api/common/constants/status-codes.js'

/**
 * @satisfies { import('@hapi/hapi').ServerRegisterPluginObject<*> }
 */
export const mongoDb = {
  plugin: {
    name: 'mongodb',
    version: '1.0.0',
    /**
     *
     * @param { import('@hapi/hapi').Server } server
     * @param {{mongoUrl: string, databaseName: string, retryWrites: boolean, readPreference: string}} options
     * @returns {Promise<void>}
     */
    register: async function (server, options) {
      server.logger.info('Setting up MongoDb')

      const client = await MongoClient.connect(options.mongoUrl, {
        retryWrites: options.retryWrites,
        readPreference: options.readPreference,
        ...(server.secureContext && { secureContext: server.secureContext })
      })

      const databaseName = options.databaseName
      const db = client.db(databaseName)
      const locker = new LockManager(db.collection('mongo-locks'))

      await createIndexes(db)

      server.logger.info(`MongoDb connected to ${databaseName}`)

      server.decorate('server', 'mongoClient', client)
      server.decorate('server', 'db', db)
      server.decorate('server', 'locker', locker)
      server.decorate('request', 'db', () => db, { apply: true })
      server.decorate('request', 'locker', () => locker, { apply: true })

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      server.events.on('stop', async () => {
        server.logger.info('Closing Mongo client')
        await client.close(true)
      })
    }
  },
  options: {
    mongoUrl: config.get('mongoUri'),
    databaseName: config.get('mongoDatabase'),
    retryWrites: false,
    readPreference: 'secondary'
  }
}

/**
 * @param {import('mongodb').Db} db
 * @returns {Promise<void>}
 */
async function createIndexes(db) {
  await db.collection('mongo-locks').createIndex({ id: 1 })
  await db.collection('stations').createIndex({ name: 1 })
  // TTL backstop so the collection can't grow unbounded if the sync job's
  // own prune step ever stops running - syncedAt is refreshed on every sync,
  // so actively-synced stations never hit the TTL.
  await ensureTtlIndex(
    db.collection('stations'),
    'syncedAt',
    config.get('stationsCacheTtlSeconds')
  )
}

/**
 * createIndex rejects an existing index whose options differ, so a syncedAt
 * index created before the TTL was added (or with another TTL) is rebuilt.
 * @param {import('mongodb').Collection} collection
 * @param {string} field
 * @param {number} expireAfterSeconds
 * @returns {Promise<void>}
 */
export async function ensureTtlIndex(collection, field, expireAfterSeconds) {
  // A collection that doesn't exist yet has no indexes
  const indexes = await collection.indexes().catch((error) => {
    if (error.code !== mongoStatusCodes.namespaceNotFound) {
      throw error
    }
    return []
  })
  const existing = indexes.find((index) => {
    const keys = Object.keys(index.key)
    return keys.length === 1 && keys[0] === field
  })

  if (existing && existing.expireAfterSeconds !== expireAfterSeconds) {
    await collection.dropIndex(existing.name).catch((error) => {
      // Another instance starting at the same time may have dropped it first
      if (error.code !== mongoStatusCodes.indexNotFound) {
        throw error
      }
    })
  }

  await collection.createIndex({ [field]: 1 }, { expireAfterSeconds })
}

/**
 * To be mixed in with Request|Server to provide the db decorator
 * @typedef {{db: import('mongodb').Db, locker: import('mongo-locks').LockManager }} MongoDBPlugin
 */
