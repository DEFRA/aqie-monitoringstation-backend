import {
  ricardoStationsScheduler,
  syncStations
} from './ricardo-stations-scheduler.js'
import { fetchRicardoData } from '~/src/api/location/helpers/fetch-data.js'
import { frameSiteInfoData } from '~/src/api/location/helpers/frame-siteinfo-data.js'
import {
  saveStations,
  pruneStaleStations
} from '~/src/api/location/helpers/stations-repository.js'
import { lock, unlock } from '~/src/api/common/helpers/sync-lock.js'
import { schedule } from 'node-cron'
import { config } from '~/src/config/index.js'

jest.mock('~/src/api/common/helpers/logging/logger-options.js', () => ({
  logConfig: {
    enabled: true,
    redact: ['authorization']
  }
}))

jest.mock('~/src/api/location/helpers/fetch-data.js')
jest.mock('~/src/api/location/helpers/frame-siteinfo-data.js')
jest.mock('~/src/api/location/helpers/stations-repository.js')
jest.mock('~/src/api/common/helpers/sync-lock.js')
jest.mock('node-cron', () => ({ schedule: jest.fn() }))
jest.mock('~/src/config/index.js')

describe('syncStations', () => {
  let mockServer

  beforeEach(() => {
    jest.clearAllMocks()
    mockServer = { db: {} }
  })

  it('skips the sync when the lock is not acquired', async () => {
    lock.mockResolvedValue(false)

    await syncStations(mockServer)

    expect(fetchRicardoData).not.toHaveBeenCalled()
    expect(unlock).not.toHaveBeenCalled()
  })

  it('fetches, frames, saves and prunes stale stations when the lock is acquired', async () => {
    lock.mockResolvedValue(true)
    const ricardoData = { measurements: { member: [{ siteName: 'A' }] } }
    fetchRicardoData.mockResolvedValue(ricardoData)
    const framedStations = [{ name: 'A' }]
    frameSiteInfoData.mockReturnValue(framedStations)
    saveStations.mockResolvedValue(undefined)
    pruneStaleStations.mockResolvedValue(2)
    unlock.mockResolvedValue(undefined)

    await syncStations(mockServer)

    expect(fetchRicardoData).toHaveBeenCalled()
    expect(frameSiteInfoData).toHaveBeenCalledWith(ricardoData.measurements)
    expect(saveStations).toHaveBeenCalledWith(
      mockServer.db,
      framedStations,
      expect.any(Date)
    )
    expect(pruneStaleStations).toHaveBeenCalledWith(
      mockServer.db,
      expect.any(Date)
    )
    expect(unlock).toHaveBeenCalledWith(mockServer.db, 'stationsSync')
  })

  it('does not prune when the batch is empty, to avoid wiping the cache on a failed fetch', async () => {
    lock.mockResolvedValue(true)
    fetchRicardoData.mockResolvedValue({ measurements: undefined })
    frameSiteInfoData.mockReturnValue([])
    saveStations.mockResolvedValue(undefined)
    unlock.mockResolvedValue(undefined)

    await syncStations(mockServer)

    expect(pruneStaleStations).not.toHaveBeenCalled()
  })

  it('releases the lock even when the fetch fails', async () => {
    lock.mockResolvedValue(true)
    fetchRicardoData.mockRejectedValue(new Error('Ricardo unreachable'))
    unlock.mockResolvedValue(undefined)

    await syncStations(mockServer)

    expect(saveStations).not.toHaveBeenCalled()
    expect(unlock).toHaveBeenCalledWith(mockServer.db, 'stationsSync')
  })
})

describe('ricardoStationsScheduler', () => {
  let mockServer
  let mockTask

  beforeEach(() => {
    jest.clearAllMocks()
    mockTask = { stop: jest.fn() }
    mockServer = { db: {}, events: { on: jest.fn() } }
    lock.mockResolvedValue(false)
    config.get = jest.fn().mockReturnValue('0 */6 * * *')
    schedule.mockReturnValue(mockTask)
  })

  it('has the expected plugin name', () => {
    expect(ricardoStationsScheduler.plugin.name).toBe(
      'Ricardo Stations Scheduler'
    )
  })

  it('registers a cron schedule using the configured cadence', () => {
    ricardoStationsScheduler.plugin.register(mockServer)

    expect(config.get).toHaveBeenCalledWith('stationsSyncSchedule')
    expect(schedule).toHaveBeenCalledWith('0 */6 * * *', expect.any(Function))
  })

  it('runs syncStations when the scheduled callback fires', async () => {
    ricardoStationsScheduler.plugin.register(mockServer)
    lock.mockResolvedValue(true)
    fetchRicardoData.mockResolvedValue({ measurements: { member: [] } })
    frameSiteInfoData.mockReturnValue([])

    const scheduledCallback = schedule.mock.calls[0][1]
    await scheduledCallback()

    expect(saveStations).toHaveBeenCalledWith(
      mockServer.db,
      [],
      expect.any(Date)
    )
  })

  it('kicks off an initial sync without blocking registration', () => {
    ricardoStationsScheduler.plugin.register(mockServer)

    expect(lock).toHaveBeenCalledWith(mockServer.db, 'stationsSync')
  })

  it('stops the cron task when the server emits stop, to avoid leaking the timer', () => {
    ricardoStationsScheduler.plugin.register(mockServer)

    const stopHandler = mockServer.events.on.mock.calls.find(
      ([event]) => event === 'stop'
    )[1]
    stopHandler()

    expect(mockTask.stop).toHaveBeenCalled()
  })

  it('does not throw when the initial sync itself rejects', async () => {
    lock.mockRejectedValueOnce(new Error('lock unavailable'))

    expect(() =>
      ricardoStationsScheduler.plugin.register(mockServer)
    ).not.toThrow()

    await new Promise((resolve) => setImmediate(resolve))
  })
})
