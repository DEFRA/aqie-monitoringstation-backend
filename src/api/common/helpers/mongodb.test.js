import { Db, MongoClient } from 'mongodb'
import { LockManager } from 'mongo-locks'

import { createServer } from '~/src/api/index.js'
import { ensureTtlIndex } from '~/src/api/common/helpers/mongodb.js'
import { mongoStatusCodes } from '~/src/api/common/constants/status-codes.js'
import { config } from '~/src/config/index.js'

describe('#mongoDb', () => {
  /** @type {Server} */
  let server

  describe('Set up', () => {
    beforeAll(async () => {
      server = await createServer()
      await server.initialize()
    })

    afterAll(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Server should have expected MongoDb decorators', () => {
      expect(server.db).toBeInstanceOf(Db)
      expect(server.mongoClient).toBeInstanceOf(MongoClient)
      expect(server.locker).toBeInstanceOf(LockManager)
    })

    test('MongoDb should have expected database name', () => {
      expect(server.db.databaseName).toBe('aqie-monitoringstation-backend')
    })

    test('MongoDb should have expected namespace', () => {
      expect(server.db.namespace).toBe('aqie-monitoringstation-backend')
    })

    test('stations collection should have name and syncedAt indexes', async () => {
      const indexes = await server.db.collection('stations').indexes()
      const indexKeys = indexes.map((index) => index.key)

      expect(indexKeys).toContainEqual({ name: 1 })
      expect(indexKeys).toContainEqual({ syncedAt: 1 })
    })

    test('syncedAt index should have a TTL to cap stations collection growth', async () => {
      const indexes = await server.db.collection('stations').indexes()
      const syncedAtIndex = indexes.find(
        (index) => index.key.syncedAt !== undefined
      )

      expect(syncedAtIndex.expireAfterSeconds).toBe(604800)
    })
  })

  describe('Shut down', () => {
    beforeAll(async () => {
      server = await createServer()
      await server.initialize()
    })

    test('Should close Mongo client on server stop', async () => {
      const closeSpy = jest.spyOn(server.mongoClient, 'close')
      await server.stop({ timeout: 0 })

      expect(closeSpy).toHaveBeenCalledWith(true)
    })
  })

  describe('With a syncedAt index created before the TTL existed', () => {
    let client

    beforeAll(async () => {
      client = await MongoClient.connect(config.get('mongoUri'))
      const stations = client
        .db(config.get('mongoDatabase'))
        .collection('stations')
      await stations.dropIndex('syncedAt_1')
      await stations.createIndex({ syncedAt: 1 })

      server = await createServer()
      await server.initialize()
    })

    afterAll(async () => {
      await server.stop({ timeout: 0 })
      await client.close()
    })

    test('Server should start and apply the TTL to the existing index', async () => {
      const indexes = await server.db.collection('stations').indexes()
      const syncedAtIndexes = indexes.filter(
        (index) => index.key.syncedAt !== undefined
      )

      expect(syncedAtIndexes).toHaveLength(1)
      expect(syncedAtIndexes[0].expireAfterSeconds).toBe(604800)
    })
  })
})

describe('#ensureTtlIndex', () => {
  const unauthorisedError = Object.assign(new Error('not authorised'), {
    code: mongoStatusCodes.unauthorized
  })
  let client
  let db
  let collection

  const ttlIndexes = async () =>
    (await collection.indexes()).filter(
      (index) => index.key.expiresAt !== undefined
    )

  beforeAll(async () => {
    client = await MongoClient.connect(config.get('mongoUri'))
    db = client.db(config.get('mongoDatabase'))
    collection = await db.createCollection('ttl-test')
  })

  afterEach(async () => {
    await collection.dropIndexes()
    jest.restoreAllMocks()
  })

  afterAll(async () => {
    await collection.drop()
    await client.close()
  })

  test('Should create a TTL index when none exists', async () => {
    await ensureTtlIndex(collection, 'expiresAt', 60)

    const indexes = await ttlIndexes()
    expect(indexes).toHaveLength(1)
    expect(indexes[0].expireAfterSeconds).toBe(60)
  })

  test('Should create a TTL index on a collection that does not exist yet', async () => {
    const newCollection = db.collection('ttl-test-new')

    await ensureTtlIndex(newCollection, 'expiresAt', 60)

    const indexes = await newCollection.indexes()
    const ttlIndex = indexes.find((index) => index.key.expiresAt !== undefined)
    expect(ttlIndex.expireAfterSeconds).toBe(60)
    await newCollection.drop()
  })

  test('Should add the TTL to an existing index that has none', async () => {
    await collection.createIndex({ expiresAt: 1 })

    await ensureTtlIndex(collection, 'expiresAt', 60)

    const indexes = await ttlIndexes()
    expect(indexes).toHaveLength(1)
    expect(indexes[0].expireAfterSeconds).toBe(60)
  })

  test('Should update the TTL of an existing TTL index', async () => {
    await ensureTtlIndex(collection, 'expiresAt', 60)

    await ensureTtlIndex(collection, 'expiresAt', 120)

    const indexes = await ttlIndexes()
    expect(indexes).toHaveLength(1)
    expect(indexes[0].expireAfterSeconds).toBe(120)
  })

  test('Should leave an index that already has the TTL untouched', async () => {
    await ensureTtlIndex(collection, 'expiresAt', 60)
    const dropSpy = jest.spyOn(collection, 'dropIndex')

    await ensureTtlIndex(collection, 'expiresAt', 60)

    expect(dropSpy).not.toHaveBeenCalled()
    expect(await ttlIndexes()).toHaveLength(1)
  })

  test('Should carry on when another instance already dropped the index', async () => {
    await collection.createIndex({ expiresAt: 1 })
    const dropIndex = collection.dropIndex.bind(collection)
    jest.spyOn(collection, 'dropIndex').mockImplementationOnce(async (name) => {
      await dropIndex(name)
      throw Object.assign(new Error('index not found'), {
        code: mongoStatusCodes.indexNotFound
      })
    })

    await ensureTtlIndex(collection, 'expiresAt', 60)

    const indexes = await ttlIndexes()
    expect(indexes).toHaveLength(1)
    expect(indexes[0].expireAfterSeconds).toBe(60)
  })

  test('Should rethrow any other error dropping the index', async () => {
    await collection.createIndex({ expiresAt: 1 })
    jest.spyOn(collection, 'dropIndex').mockRejectedValueOnce(unauthorisedError)

    await expect(ensureTtlIndex(collection, 'expiresAt', 60)).rejects.toThrow(
      'not authorised'
    )
  })

  test('Should rethrow any other error listing the indexes', async () => {
    jest.spyOn(collection, 'indexes').mockRejectedValueOnce(unauthorisedError)

    await expect(ensureTtlIndex(collection, 'expiresAt', 60)).rejects.toThrow(
      'not authorised'
    )
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
