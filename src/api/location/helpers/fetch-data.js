import { config } from '~/src/config/index.js'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'
import { catchFetchError } from '~/src/api/common/helpers/catch-fetch-error.js'

async function fetchData(locationType, userLocation) {
  const logger = createLogger()
  const data = {
    userLocation
  }
  const options = {
    method: 'get',
    headers: { 'Content-Type': 'text/json', preserveWhitespace: true }
  }
  const optionsOSPlace = {
    method: 'post',
    headers: { 'Content-Type': 'application/json', preserveWhitespace: true },
    body: JSON.stringify(data)
  }
  const OSPlaceApiUrl = config.get('OSPlaceApiUrl')
  const [errorOSPlace, getOSPlaces] = await catchFetchError(
    OSPlaceApiUrl,
    optionsOSPlace
  )
  if (errorOSPlace) {
    logger.error(
      `Error fetching statusCodeOSPlace data: ${errorOSPlace.message}`
    )
  } else {
    logger.info(`getOSPlaces data fetched:`)
  }
  const measurementsAPIurl = config.get('measurementsApiUrl')
  const [errorMeasurements, getMeasurements] = await catchFetchError(
    measurementsAPIurl,
    options
  )
  if (errorMeasurements) {
    logger.error(
      `Error fetching Measurements data: ${errorMeasurements.message}`
    )
  } else {
    logger.info(`getMeasurements data fetched:`)
  }
  return { getOSPlaces, getMeasurements }
}
export { fetchData }
