import { osplaceController } from '~/src/api/location/controllers/location.js'
import * as getOsPlaceUtil from '~/src/api/location/helpers/get-osplace-util.js'
import { config } from '~/src/config/index.js'

jest.mock('~/src/api/common/helpers/logging/logger-options.js', () => ({
  logConfig: {
    enabled: true,
    redact: ['authorization']
  }
}))

jest.mock('~/src/api/location/helpers/get-osplace-util.js')
jest.mock('~/src/config/index.js')

describe('osplaceController.handler', () => {
  let mockRequest
  let mockResponseToolkit

  beforeEach(() => {
    mockRequest = { query: { id: '123' } }
    mockResponseToolkit = {
      response: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis()
    }
  })

  it('should return success response with monitoring station data', async () => {
    const mockData = { station: 'Station A' }
    getOsPlaceUtil.fetchmonitoringstation.mockResolvedValue(mockData)
    config.get = jest.fn().mockReturnValue('https://example.com')

    const result = await osplaceController.handler(
      mockRequest,
      mockResponseToolkit
    )

    expect(getOsPlaceUtil.fetchmonitoringstation).toHaveBeenCalledWith(
      mockRequest
    )
    expect(config.get).toHaveBeenCalledWith('allowOriginUrl')
    expect(mockResponseToolkit.response).toHaveBeenCalledWith({
      message: 'success',
      getmonitoringstation: mockData
    })
    expect(mockResponseToolkit.code).toHaveBeenCalledWith(200)
    expect(mockResponseToolkit.header).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'https://example.com'
    )
    expect(result).toBe(mockResponseToolkit)
  })

  it('should handle undefined allowOriginUrl gracefully', async () => {
    const mockData = { station: 'Station B' }
    getOsPlaceUtil.fetchmonitoringstation.mockResolvedValue(mockData)
    config.get = jest.fn().mockReturnValue(undefined)

    const result = await osplaceController.handler(
      mockRequest,
      mockResponseToolkit
    )

    expect(mockResponseToolkit.header).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      undefined
    )
    expect(result).toBe(mockResponseToolkit)
  })

  it('should handle fetchmonitoringstation throwing an error', async () => {
    const error = new Error('API failure')
    getOsPlaceUtil.fetchmonitoringstation.mockRejectedValue(error)

    await expect(
      osplaceController.handler(mockRequest, mockResponseToolkit)
    ).rejects.toThrow('API failure')
  })

  it('should handle fetchmonitoringstation returning null', async () => {
    getOsPlaceUtil.fetchmonitoringstation.mockResolvedValue(null)
    config.get = jest.fn().mockReturnValue('https://example.com')

    const result = await osplaceController.handler(
      mockRequest,
      mockResponseToolkit
    )

    expect(mockResponseToolkit.response).toHaveBeenCalledWith({
      message: 'success',
      getmonitoringstation: null
    })
    expect(result).toBe(mockResponseToolkit)
  })
})
