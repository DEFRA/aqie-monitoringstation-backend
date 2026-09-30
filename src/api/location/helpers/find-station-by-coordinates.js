// ~11 metres — same source coordinates parsed via Number() on both sides, so
// exact matches are expected; the tolerance only absorbs stray formatting.
const COORDINATE_TOLERANCE = 0.0001

/**
 * Finds a station by matching latitude/longitude against a list of stations.
 * Falls back to matching by name when coordinates collide (e.g. co-located
 * instruments sharing one physical site).
 * @param {Array<object>} stations
 * @param {string|number} lat
 * @param {string|number} lng
 * @param {string} [name]
 * @returns {object|null}
 */
function findStationByCoordinates(stations, lat, lng, name) {
  const targetLat = Number.parseFloat(lat)
  const targetLng = Number.parseFloat(lng)

  if (Number.isNaN(targetLat) || Number.isNaN(targetLng)) {
    return null
  }

  const matches = (stations ?? []).filter((station) => {
    const [stationLat, stationLng] = station.location?.coordinates ?? []
    return (
      Math.abs(stationLat - targetLat) <= COORDINATE_TOLERANCE &&
      Math.abs(stationLng - targetLng) <= COORDINATE_TOLERANCE
    )
  })

  if (matches.length <= 1) {
    return matches[0] ?? null
  }

  const byName = matches.find(
    (station) => station.name?.toLowerCase() === name?.toLowerCase()
  )
  return byName ?? matches[0]
}

export { findStationByCoordinates }
