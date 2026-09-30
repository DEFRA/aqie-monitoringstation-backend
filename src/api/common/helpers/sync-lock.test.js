import { lock, unlock } from './sync-lock.js'

describe('lock', () => {
  it('claims the lock and returns true when insert succeeds', async () => {
    const mockCollection = { insertOne: jest.fn().mockResolvedValue({}) }
    const mockDb = { collection: jest.fn().mockReturnValue(mockCollection) }

    const result = await lock(mockDb, 'stationsSync')

    expect(mockDb.collection).toHaveBeenCalledWith('sync-locks')
    expect(mockCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'stationsSync' })
    )
    expect(result).toBe(true)
  })

  it('returns false when the lock is already held', async () => {
    const mockCollection = {
      insertOne: jest.fn().mockRejectedValue(new Error('duplicate key'))
    }
    const mockDb = { collection: jest.fn().mockReturnValue(mockCollection) }

    const result = await lock(mockDb, 'stationsSync')

    expect(result).toBe(false)
  })
})

describe('unlock', () => {
  it('deletes the lock document', async () => {
    const mockCollection = { deleteOne: jest.fn().mockResolvedValue({}) }
    const mockDb = { collection: jest.fn().mockReturnValue(mockCollection) }

    await unlock(mockDb, 'stationsSync')

    expect(mockDb.collection).toHaveBeenCalledWith('sync-locks')
    expect(mockCollection.deleteOne).toHaveBeenCalledWith({
      _id: 'stationsSync'
    })
  })
})
