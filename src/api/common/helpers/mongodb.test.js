import { Db, MongoClient } from 'mongodb'
import { LockManager } from 'mongo-locks'

import { createServer } from '~/src/api/index.js'

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
})

/**
 * @import { Server } from '@hapi/hapi'
 */
