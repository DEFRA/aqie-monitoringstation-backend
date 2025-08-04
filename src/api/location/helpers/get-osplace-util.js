import { fetchData } from '~/src/api/location/helpers/fetch-data.js'
import { getNearestLocation } from '~/src/api/location/helpers/get-nearest-location.js'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'
import {
  milesequal
  // requestmileslice
} from '~/src/api/location/helpers/constants.js'

async function fetchmonitoringstation(request) {
  const logger = createLogger()
  const { userLocation, usermiles } = request.payload || {}

  // Helper function to check if a value is null, undefined, or blank
  const isBlank = (value) => {
    return (
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '') ||
      (typeof value === 'object' && Object.keys(value).length === 0)
    )
  }

  if (isBlank(userLocation) || isBlank(usermiles)) {
    logger.info(
      `Invalid input: userLocation or usermiles is blank : ${userLocation}, ${usermiles}`
    )
  } else {
    logger.info(
      `Valid input: userLocation and usermiles are provided : ${userLocation}, ${usermiles}`
    )

    const locationType = 'uk-location'
    const locationNameOrPostcode = userLocation
    let requestmiles = usermiles

    requestmiles = requestmiles * milesequal // 1 miles equal to 1.609344 KM
    const miles = requestmiles * 1000

    const { getOSPlaces, getMeasurements } = await fetchData(
      locationType,
      locationNameOrPostcode,
      request,
      'h'
    )

    if (locationType === 'uk-location') {
      const selectedMatches = getOSPlaces

      const nearestLocationResult = getNearestLocation(
        selectedMatches,
        getMeasurements?.measurements,
        locationType,
        miles,
        0
      )

      if (nearestLocationResult && typeof nearestLocationResult === 'object') {
        const { finalnearestLocationsRange, latlon } = nearestLocationResult
        if (latlon != null) {
          return finalnearestLocationsRange
        }
        return finalnearestLocationsRange
      }
    }
    logger.info(
      `No nearest locations found for userLocation: ${userLocation}, usermiles: ${usermiles}`
    )
  }
  return 'no data found'
}
export { fetchmonitoringstation }
