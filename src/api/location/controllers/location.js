import { fetchmonitoringstation } from '~/src/api/location/helpers/get-osplace-util.js'
import { findAllStations } from '~/src/api/location/helpers/stations-repository.js'
import { findStationByCoordinates } from '~/src/api/location/helpers/find-station-by-coordinates.js'
import { toStationSearchResult } from '~/src/api/location/helpers/to-station-search-result.js'
import { config } from '~/src/config/index.js'
import { statusCodes } from '~/src/api/common/constants/status-codes.js'

function withSecurityHeaders(response, allowOriginUrl) {
  return response
    .header('Access-Control-Allow-Origin', allowOriginUrl)
    .header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"
    )
    .header('Referrer-Policy', 'strict-origin-when-cross-origin')
    .header('X-Content-Type-Options', 'nosniff')
    .header('X-Frame-Options', 'DENY')
    .header('X-XSS-Protection', '1; mode=block')
    .header(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
}

const osplaceController = {
  handler: async (request, h) => {
    const allowOriginUrl = config.get('allowOriginUrl')
    let getmonitoringstation

    try {
      getmonitoringstation = await fetchmonitoringstation(request)
    } catch (error) {
      return withSecurityHeaders(
        h
          .response({ message: 'error', error: error.message })
          .code(statusCodes.badRequest),
        allowOriginUrl
      )
    }

    if (getmonitoringstation instanceof Error) {
      return withSecurityHeaders(
        h
          .response({
            message: 'error',
            error: getmonitoringstation.message
          })
          .code(statusCodes.badRequest),
        allowOriginUrl
      )
    }

    return withSecurityHeaders(
      h
        .response({ message: 'success', getmonitoringstation })
        .code(statusCodes.ok),
      allowOriginUrl
    )
  }
}

/**
 * Looks up a single station by coordinates, for deep links from other
 * services (e.g. aqie-maps-frontend) that only have lat/lng and a name.
 */
const stationByLocationController = {
  handler: async (request, h) => {
    const { lat, lng, name } = request.query
    const allowOriginUrl = config.get('allowOriginUrl')

    const stations = await findAllStations(request.db)
    const rawStation = findStationByCoordinates(stations, lat, lng, name)
    const station = toStationSearchResult(rawStation)

    const response = station
      ? h.response({ message: 'success', station }).code(statusCodes.ok)
      : h.response({ message: 'station not found' }).code(statusCodes.notFound)

    return response
      .header('Access-Control-Allow-Origin', allowOriginUrl)
      .header(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"
      )
      .header('Referrer-Policy', 'strict-origin-when-cross-origin')
      .header('X-Content-Type-Options', 'nosniff')
      .header('X-Frame-Options', 'DENY')
      .header('X-XSS-Protection', '1; mode=block')
      .header(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload'
      )
  }
}
export { osplaceController, stationByLocationController }
