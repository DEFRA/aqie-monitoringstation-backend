import { fetchmonitoringstation } from '~/src/api/location/helpers/get-osplace-util.js'
import { config } from '~/src/config/index.js'

const osplaceController = {
  handler: async (request, h) => {
    const getmonitoringstation = await fetchmonitoringstation(request)
    const allowOriginUrl = config.get('allowOriginUrl')
    return h
      .response({ message: 'success', getmonitoringstation })
      .code(200)
      .header('Access-Control-Allow-Origin', allowOriginUrl)
  }
}

export { osplaceController }
