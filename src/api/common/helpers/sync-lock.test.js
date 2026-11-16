import { lock, unlock } from './sync-lock.js'

describe('lock', () => {
  it('claims the lock and returns the held lock when available', async () => {
    const heldLock = { free: jest.fn() }
    const mockLocker = { lock: jest.fn().mockResolvedValue(heldLock) }

    const result = await lock(mockLocker, 'stationsSync')

    expect(mockLocker.lock).toHaveBeenCalledWith('stationsSync')
    expect(result).toBe(heldLock)
  })

  it('returns null when the lock is already held', async () => {
    const mockLocker = { lock: jest.fn().mockResolvedValue(null) }

    const result = await lock(mockLocker, 'stationsSync')

    expect(result).toBeNull()
  })
})

describe('unlock', () => {
  it('frees the held lock', async () => {
    const heldLock = { free: jest.fn().mockResolvedValue(true) }

    await unlock(heldLock)

    expect(heldLock.free).toHaveBeenCalled()
  })

  it('does nothing when there is no held lock to free', async () => {
    await expect(unlock(null)).resolves.toBeUndefined()
  })
})
