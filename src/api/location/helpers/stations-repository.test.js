import {
  saveStations,
  pruneStaleStations,
  findAllStations
} from './stations-repository.js'

describe('saveStations', () => {
  let mockCollection
  let mockDb

  beforeEach(() => {
    mockCollection = { bulkWrite: jest.fn().mockResolvedValue(undefined) }
    mockDb = { collection: jest.fn().mockReturnValue(mockCollection) }
  })

  it('does nothing when stations is empty', async () => {
    await saveStations(mockDb, [])

    expect(mockDb.collection).not.toHaveBeenCalled()
  })

  it('does nothing when stations is undefined', async () => {
    await saveStations(mockDb, undefined)

    expect(mockDb.collection).not.toHaveBeenCalled()
  })

  it('bulk-upserts each station by name, stamped with syncedAt', async () => {
    const stations = [{ name: 'Station A' }, { name: 'Station B' }]
    const syncedAt = new Date('2026-01-01T00:00:00.000Z')

    await saveStations(mockDb, stations, syncedAt)

    expect(mockDb.collection).toHaveBeenCalledWith('stations')
    expect(mockCollection.bulkWrite).toHaveBeenCalledWith([
      {
        replaceOne: {
          filter: { name: 'Station A' },
          replacement: { ...stations[0], syncedAt },
          upsert: true
        }
      },
      {
        replaceOne: {
          filter: { name: 'Station B' },
          replacement: { ...stations[1], syncedAt },
          upsert: true
        }
      }
    ])
  })

  it('defaults syncedAt to the current time when not provided', async () => {
    await saveStations(mockDb, [{ name: 'Station A' }])

    const [{ replaceOne }] = mockCollection.bulkWrite.mock.calls[0][0]
    expect(replaceOne.replacement.syncedAt).toBeInstanceOf(Date)
  })
})

describe('pruneStaleStations', () => {
  it('removes stations not touched by the given sync and returns the count', async () => {
    const mockCollection = {
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 3 })
    }
    const mockDb = { collection: jest.fn().mockReturnValue(mockCollection) }
    const syncedAt = new Date('2026-01-01T00:00:00.000Z')

    const result = await pruneStaleStations(mockDb, syncedAt)

    expect(mockDb.collection).toHaveBeenCalledWith('stations')
    expect(mockCollection.deleteMany).toHaveBeenCalledWith({
      syncedAt: { $lt: syncedAt }
    })
    expect(result).toBe(3)
  })
})

describe('findAllStations', () => {
  it('returns all documents from the stations collection', async () => {
    const stations = [{ name: 'Station A' }]
    const mockToArray = jest.fn().mockResolvedValue(stations)
    const mockCollection = {
      find: jest.fn().mockReturnValue({ toArray: mockToArray })
    }
    const mockDb = { collection: jest.fn().mockReturnValue(mockCollection) }

    const result = await findAllStations(mockDb)

    expect(mockDb.collection).toHaveBeenCalledWith('stations')
    expect(mockCollection.find).toHaveBeenCalledWith({})
    expect(result).toBe(stations)
  })
})
