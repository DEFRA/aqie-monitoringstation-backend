import { config } from '~/src/config/index.js'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'
import { catchFetchError } from '~/src/api/common/helpers/catch-fetch-error.js'

async function fetchData(locationType, userLocation) {
  const logger = createLogger()
  const data = {
    userLocation
  }
  const optionsricardo = {
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
  const ricardoAPIurl = config.get('ricardoApiUrl')
  const baseParams = '?with-closed=true&with-pollutants=1&stream=data'
  const ricardoAPIurlFull = `${ricardoAPIurl}${baseParams}`
  const [errorRicardo, getRicardodata] = await catchFetchError(
    ricardoAPIurlFull,
    optionsricardo
  )
  if (errorRicardo) {
    logger.error(`Error fetching Ricardo data: ${errorRicardo.message}`)
  } else {
    logger.info(`getRicardodata data fetched:`)
  }
  return { getOSPlaces, getRicardodata }
}
export { fetchData }
