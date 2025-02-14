import { osplaceController } from '~/src/api/location/controllers/location.js'

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
          method: 'GET',
          path: '/monitoringstation/location={userLocation}',
          ...osplaceController
        }
      ])
    }
  }
}
export { osnameplaces }

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
