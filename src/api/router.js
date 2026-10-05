import { health } from '~/src/api/health/index.js'
import { osnameplaces } from '~/src/api/location/index.js'
/**
 * @satisfies { import('@hapi/hapi').ServerRegisterPluginObject<*> }
 */
const router = {
  plugin: {
    name: 'Router',
    register: async (server) => {
      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      await server.register([osnameplaces])
    }
  }
}

export { router }
