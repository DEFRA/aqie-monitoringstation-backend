import { fetchData } from '~/src/api/location/helpers/fetch-data.js'
import { getNearestLocation } from '~/src/api/location/helpers/get-nearest-location.js'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'
import {
  milesequal,
  locationResult
} from '~/src/api/location/helpers/constants.js'

function isBlank(value) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  )
}

function processNearestLocationResult(nearestLocationResult) {
  if (
    nearestLocationResult &&
    typeof nearestLocationResult === 'object' &&
    nearestLocationResult.latlon != null &&
    nearestLocationResult.finalnearestLocationsRange != null
  ) {
    return nearestLocationResult.finalnearestLocationsRange
  }
  return nearestLocationResult?.finalnearestLocationsRange || locationResult
}

async function fetchmonitoringstation(request) {
  const logger = createLogger()
  const { userLocation, usermiles } = request.payload || {}

  if (isBlank(userLocation) || isBlank(usermiles)) {
    logger.info(
      `Invalid input: userLocation or usermiles is blank : ${userLocation}, ${usermiles}`
    )
    return locationResult
  }

  logger.info(
    `Valid input: userLocation and usermiles are provided : ${userLocation}, ${usermiles}`
  )

  const locationType = 'uk-location'
  const locationNameOrPostcode = userLocation
  const requestmiles = usermiles * milesequal
  const miles = requestmiles * 1000

  const { getOSPlaces, getMeasurements } = await fetchData(
    locationType,
    locationNameOrPostcode,
    request,
    'h'
  )

  if (locationType !== 'uk-location') {
    logger.info(
      `No nearest locations found for userLocation: ${userLocation}, usermiles: ${usermiles}`
    )
    return locationResult
  }

  const selectedMatches = getOSPlaces
  const nearestLocationResult = getNearestLocation(
    selectedMatches,
    getMeasurements?.measurements,
    locationType,
    miles,
    0
  )

  const result = processNearestLocationResult(nearestLocationResult)
  if (result === locationResult) {
    logger.info(
      `No nearest locations found for userLocation: ${userLocation}, usermiles: ${usermiles}`
    )
  }

  return result
}

export { fetchmonitoringstation }
