const STATIONS_COLLECTION = 'stations'

/**
 * Builds a bulkWrite replaceOne operation, upserting by station name and
 * stamping the sync time so stale entries can be identified later.
 * @param {object} station shaped station from frameSiteInfoData
 * @param {Date} syncedAt
 * @returns {{ replaceOne: { filter: object, replacement: object, upsert: boolean } }}
 */
function toBulkReplace(station, syncedAt) {
  return {
    replaceOne: {
      filter: { name: station.name },
      replacement: { ...station, syncedAt },
      upsert: true
    }
  }
}

/**
 * Persists the latest Ricardo station snapshot, upserting by name so
 * repeated syncs replace rather than duplicate entries.
 * @param {import('mongodb').Db} db
 * @param {Array<object>} stations
 * @param {Date} [syncedAt] stamped on every document, used by
 *   pruneStaleStations to find entries no longer returned by Ricardo
 * @returns {Promise<void>}
 */
async function saveStations(db, stations, syncedAt = new Date()) {
  if (!stations || stations.length === 0) {
    return
  }
  await db
    .collection(STATIONS_COLLECTION)
    .bulkWrite(stations.map((station) => toBulkReplace(station, syncedAt)))
}

/**
 * Removes stations not touched by the sync at syncedAt - i.e. stations
 * Ricardo no longer returns (renamed, merged or deregistered), which would
 * otherwise linger in the cache indefinitely.
 * @param {import('mongodb').Db} db
 * @param {Date} syncedAt the timestamp passed to the saveStations call for
 *   this same sync run
 * @returns {Promise<number>} number of stale documents removed
 */
async function pruneStaleStations(db, syncedAt) {
  const result = await db
    .collection(STATIONS_COLLECTION)
    .deleteMany({ syncedAt: { $lt: syncedAt } })
  return result.deletedCount
}

/**
 * Reads the cached station snapshot for coordinate-based lookups.
 * @param {import('mongodb').Db} db
 * @returns {Promise<Array<object>>}
 */
async function findAllStations(db) {
  return db.collection(STATIONS_COLLECTION).find({}).toArray()
}

export {
  saveStations,
  pruneStaleStations,
  findAllStations,
  STATIONS_COLLECTION
}
