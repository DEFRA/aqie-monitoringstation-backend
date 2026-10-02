import { schedule } from 'node-cron'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'
import { config } from '~/src/config/index.js'
import { fetchRicardoData } from '~/src/api/location/helpers/fetch-data.js'
import { frameSiteInfoData } from '~/src/api/location/helpers/frame-siteinfo-data.js'
import {
  saveStations,
  pruneStaleStations
} from '~/src/api/location/helpers/stations-repository.js'
import { lock, unlock } from '~/src/api/common/helpers/sync-lock.js'

const logger = createLogger()
const LOCK_NAME = 'stationsSync'

/**
 * Fetches the latest Ricardo station snapshot and persists it to the
 * `stations` collection, feeding the coordinate-based by-location lookup.
 * Lock-guarded so overlapping runs (or multiple instances) don't race.
 * @param {import('@hapi/hapi').Server} server
 * @returns {Promise<void>}
 */
async function syncStations(server) {
  if (!(await lock(server.db, LOCK_NAME))) {
    logger.info('Stations sync skipped - already running elsewhere')
    return
  }
  try {
    const syncedAt = new Date()
    const getRicardodata = await fetchRicardoData()
    const stations = frameSiteInfoData(getRicardodata?.measurements)
    await saveStations(server.db, stations, syncedAt)

    // Only prune after a non-empty write, so a failed Ricardo fetch can't wipe the cache.
    const pruned =
      stations.length > 0 ? await pruneStaleStations(server.db, syncedAt) : 0
    logger.info(
      `Stations sync complete: ${stations.length} stations, ${pruned} stale entries removed`
    )
  } catch (error) {
    logger.error(`Stations sync failed: ${error.message}`)
  } finally {
    await unlock(server.db, LOCK_NAME)
  }
}

/**
 * @satisfies { import('@hapi/hapi').ServerRegisterPluginObject<*> }
 */
const ricardoStationsScheduler = {
  plugin: {
    name: 'Ricardo Stations Scheduler',
    register: (server) => {
      logger.info('starting Ricardo Stations Scheduler')

      // Fire-and-forget so startup isn't blocked on an external fetch -
      // otherwise the cache stays empty until the first cron tick.
      syncStations(server).catch((error) => {
        logger.error(`Initial stations sync failed: ${error.message}`)
      })

      const task = schedule(config.get('stationsSyncSchedule'), () =>
        syncStations(server)
      )

      // Without this the cron timer keeps the process alive after shutdown.
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      server.events.on('stop', async () => {
        await task.stop()
      })
    }
  }
}

export { ricardoStationsScheduler, syncStations }
