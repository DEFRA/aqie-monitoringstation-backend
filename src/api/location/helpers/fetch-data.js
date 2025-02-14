import { config } from '~/src/config/index.js'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'
import { catchFetchError } from '~/src/api/common/helpers/catch-fetch-error.js'
// import { catchProxyFetchError } from '~/src/api/common/helpers/catch-proxy-fetch-error'

async function fetchData(locationType, userLocation) {
  // let optionsOAuth
  // let savedAccessToken
  // let accessToken

  const options = {
    method: 'get',
    headers: { 'Content-Type': 'text/json', preserveWhitespace: true }
  }
  const logger = createLogger()

  const OSPlaceApiUrl = config.get('OSPlaceApiUrl')
  // const osNamesApiUrlFull = OSPlaceApiUrl + userLocation
  const osNamesApiUrlFull = `${OSPlaceApiUrl}${encodeURIComponent(
    userLocation
  )}`
  // const symbolsArr = ['%', '$', '&', '#', '!', '¬', '`']
  // const shouldCallApi = symbolsArr.some((symbol) =>
  //   userLocation.includes(symbol)
  // )
  // logger.info(
  //   `osPlace data requested osNamesApiUrlFull: ${osNamesApiUrlFull}`
  // )
  const measurementsAPIurl = config.get('measurementsApiUrl')
  const [errorOSPlace, getOSPlaces] = await catchFetchError(
    osNamesApiUrlFull,
    options
  )
  if (errorOSPlace) {
    logger.error(
      `Error fetching statusCodeOSPlace data: ${errorOSPlace.message}`
    )
  } else {
    logger.info(`getOSPlaces data fetched:`)
  }
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
