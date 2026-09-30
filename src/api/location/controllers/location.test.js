import {
  osplaceController,
  stationByLocationController
} from '~/src/api/location/controllers/location.js'
import * as getOsPlaceUtil from '~/src/api/location/helpers/get-osplace-util.js'
import { findAllStations } from '~/src/api/location/helpers/stations-repository.js'
import { findStationByCoordinates } from '~/src/api/location/helpers/find-station-by-coordinates.js'
import { shapeStation } from '~/src/api/location/helpers/shape-station.js'
import { config } from '~/src/config/index.js'

jest.mock('~/src/api/common/helpers/logging/logger-options.js', () => ({
  logConfig: {
    enabled: true,
    redact: ['authorization']
  }
}))

jest.mock('~/src/api/location/helpers/get-osplace-util.js')
jest.mock('~/src/api/location/helpers/stations-repository.js')
jest.mock('~/src/api/location/helpers/find-station-by-coordinates.js')
jest.mock('~/src/api/location/helpers/shape-station.js')
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

describe('stationByLocationController.handler', () => {
  let mockRequest
  let mockResponseToolkit
  let mockDb

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb = {}
    mockRequest = {
      query: { lat: '51.5', lng: '-0.1', name: 'Test Station' },
      db: mockDb
    }
    mockResponseToolkit = {
      response: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis()
    }
    config.get = jest.fn().mockReturnValue('https://example.com')
  })

  it('reads cached stations from Mongo rather than fetching Ricardo live', async () => {
    const cachedStations = [{ name: 'Test Station' }]
    findAllStations.mockResolvedValue(cachedStations)
    findStationByCoordinates.mockReturnValue(cachedStations[0])
    shapeStation.mockReturnValue({ id: 'TestStation', name: 'Test Station' })

    await stationByLocationController.handler(mockRequest, mockResponseToolkit)

    expect(findAllStations).toHaveBeenCalledWith(mockDb)
    expect(findStationByCoordinates).toHaveBeenCalledWith(
      cachedStations,
      '51.5',
      '-0.1',
      'Test Station'
    )
  })

  it('returns 200 with the shaped station when a match is found', async () => {
    findAllStations.mockResolvedValue([{ name: 'Test Station' }])
    findStationByCoordinates.mockReturnValue({ name: 'Test Station' })
    const shaped = { id: 'TestStation', name: 'Test Station' }
    shapeStation.mockReturnValue(shaped)

    await stationByLocationController.handler(mockRequest, mockResponseToolkit)

    expect(mockResponseToolkit.response).toHaveBeenCalledWith({
      message: 'success',
      station: shaped
    })
    expect(mockResponseToolkit.code).toHaveBeenCalledWith(200)
  })

  it('returns 404 when no station matches the coordinates', async () => {
    findAllStations.mockResolvedValue([])
    findStationByCoordinates.mockReturnValue(null)
    shapeStation.mockReturnValue(null)

    await stationByLocationController.handler(mockRequest, mockResponseToolkit)

    expect(mockResponseToolkit.response).toHaveBeenCalledWith({
      message: 'station not found'
    })
    expect(mockResponseToolkit.code).toHaveBeenCalledWith(404)
  })

  it('sets the standard security headers on the response', async () => {
    findAllStations.mockResolvedValue([])
    findStationByCoordinates.mockReturnValue(null)
    shapeStation.mockReturnValue(null)

    await stationByLocationController.handler(mockRequest, mockResponseToolkit)

    expect(mockResponseToolkit.header).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'https://example.com'
    )
    expect(mockResponseToolkit.header).toHaveBeenCalledWith(
      'X-Frame-Options',
      'DENY'
    )
  })
})
