const POLLUTANT_ALIASES = {
  PM25: 'PM2.5',
  GR25: 'PM2.5',
  GR25U: 'PM2.5',
  MP10: 'PM10',
  GE10: 'PM10',
  GR10: 'PM10',
  GR10U: 'PM10',
  NO2: 'Nitrogen dioxide',
  O3: 'Ozone',
  SO2: 'Sulphur dioxide'
}

const POLLUTANT_ORDER = [
  'PM2.5',
  'PM10',
  'Nitrogen dioxide',
  'Ozone',
  'Sulphur dioxide'
]

const CLOSED_BEFORE_DATE = '2017-12-31'

/**
 * Shapes a raw frameSiteInfoData station into the same format used by
 * getNearestLocation's results, so callers on the dataselector side (session,
 * views) can treat single-station lookups the same as radius-search results.
 * @param {object} curr raw station from frameSiteInfoData
 * @param {number|null} [distance] distance in metres, or null when not applicable
 * @returns {object|null} shaped station, or null if invalid/no active pollutants
 */
function toStationSearchResult(curr, distance = null) {
  if (curr?.localSiteID === undefined || curr?.localSiteID === null) {
    return null
  }

  const [first, second] = (curr.areaType || '').split(' ')
  const areaType = `${second ?? ''} ${first ?? ''}`.trim()

  const pollutantNames = Object.keys(curr.pollutants || {})
    .filter((pollutant) => {
      const { startDate, endDate } = curr.pollutants[pollutant]
      const isStartDateValid = startDate === null || startDate !== null
      const isEndDateValid = endDate === null || endDate > CLOSED_BEFORE_DATE
      return isStartDateValid && isEndDateValid
    })
    .map((pollutant) => POLLUTANT_ALIASES[pollutant] || pollutant)

  if (pollutantNames.length === 0) {
    return null
  }

  const uniquePollutants = [...new Set(pollutantNames)].sort(
    (a, b) => POLLUTANT_ORDER.indexOf(a) - POLLUTANT_ORDER.indexOf(b)
  )

  return {
    region: curr.area,
    siteType: areaType,
    localSiteID: curr.localSiteID,
    location: {
      type: curr.location.type,
      coordinates: [...curr.location.coordinates]
    },
    id: curr.name.replaceAll(' ', ''),
    name: curr.name,
    updated: curr.updated,
    distance,
    pollutants: uniquePollutants
  }
}

export { toStationSearchResult }
