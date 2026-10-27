import { fetchmonitoringstation } from '~/src/api/location/helpers/get-osplace-util.js'
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
export { osplaceController }
