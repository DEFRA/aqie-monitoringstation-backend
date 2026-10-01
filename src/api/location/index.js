import {
  osplaceController,
  stationByLocationController
} from '~/src/api/location/controllers/location.js'

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
const osnameplaces = {
  plugin: {
    name: 'osnameplaces',
    register: (server) => {
      server.route([
        {
          method: 'GET',
          path: '/osnameplaces',
          ...osplaceController
        },
        {
          method: 'POST',
          path: '/monitoringstation',
          ...osplaceController
        },
        {
          method: 'GET',
          path: '/monitoringstation/by-location',
          ...stationByLocationController
        }
      ])
    }
  }
}
export { osnameplaces }

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
