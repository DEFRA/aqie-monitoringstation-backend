import { fetchmonitoringstation } from '~/src/api/location/helpers/get-osplace-util.js'
import * as fetchDataModule from '~/src/api/location/helpers/fetch-data.js'
import * as getNearestLocationModule from '~/src/api/location/helpers/get-nearest-location.js'
import * as loggerModule from '~/src/api/common/helpers/logging/logger.js'
import { locationResult } from '~/src/api/location/helpers/constants.js'

jest.mock('~/src/api/location/helpers/fetch-data.js')
jest.mock('~/src/api/location/helpers/get-nearest-location.js')
jest.mock('~/src/api/common/helpers/logging/logger.js')

describe('fetchmonitoringstation', () => {
  const mockLogger = { info: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    loggerModule.createLogger.mockReturnValue(mockLogger)
  })

  it('should return "no data found" if userLocation is blank string', async () => {
    const result = await fetchmonitoringstation({
      payload: { userLocation: '', usermiles: 10 }
    })
    expect(result).toBe(locationResult)
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Invalid input')
    )
  })

  it('should return "no data found" if userLocation is null', async () => {
    const result = await fetchmonitoringstation({
      payload: { userLocation: null, usermiles: 10 }
    })
    expect(result).toBe(locationResult)
  })

  it('should return "no data found" if userLocation is empty object', async () => {
    const result = await fetchmonitoringstation({
      payload: { userLocation: {}, usermiles: 10 }
    })
    expect(result).toBe(locationResult)
  })

  it('should return "no data found" if usermiles is blank string', async () => {
    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London', usermiles: '' }
    })
    expect(result).toBe(locationResult)
  })

  it('should return "no data found" if usermiles is null', async () => {
    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London', usermiles: null }
    })
    expect(result).toBe(locationResult)
  })

  it('should return "no data found" if usermiles is undefined', async () => {
    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London' }
    })
    expect(result).toBe(locationResult)
  })

  it('should return "no data found" if payload is missing', async () => {
    const result = await fetchmonitoringstation({})
    expect(result).toBe(locationResult)
  })

  it('should return finalnearestLocationsRange if latlon is not null', async () => {
    const mockData = {
      getOSPlaces: ['place1'],
      getMeasurements: { measurements: ['m1'] }
    }
    const mockNearest = {
      finalnearestLocationsRange: ['loc1'],
      latlon: { lat: 51.5, lon: -0.1 }
    }

    fetchDataModule.fetchData.mockResolvedValue(mockData)
    getNearestLocationModule.getNearestLocation.mockReturnValue(mockNearest)

    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London', usermiles: 10 }
    })

    expect(result).toEqual(['loc1'])
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Valid input')
    )
  })

  it('should return finalnearestLocationsRange if latlon is null', async () => {
    const mockData = {
      getOSPlaces: ['place1'],
      getMeasurements: { measurements: ['m1'] }
    }
    const mockNearest = {
      finalnearestLocationsRange: ['loc2'],
      latlon: null
    }

    fetchDataModule.fetchData.mockResolvedValue(mockData)
    getNearestLocationModule.getNearestLocation.mockReturnValue(mockNearest)

    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London', usermiles: 5 }
    })

    expect(result).toEqual(['loc2'])
  })

  it('should handle usermiles as string and convert correctly', async () => {
    const mockData = {
      getOSPlaces: ['place1'],
      getMeasurements: { measurements: ['m1'] }
    }
    const mockNearest = {
      finalnearestLocationsRange: ['loc3'],
      latlon: { lat: 51.5, lon: -0.1 }
    }

    fetchDataModule.fetchData.mockResolvedValue(mockData)
    getNearestLocationModule.getNearestLocation.mockReturnValue(mockNearest)

    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London', usermiles: '2' }
    })

    expect(result).toEqual(['loc3'])
  })

  it('should return "no data found" if getNearestLocation returns undefined', async () => {
    const mockData = {
      getOSPlaces: ['place1'],
      getMeasurements: { measurements: ['m1'] }
    }

    fetchDataModule.fetchData.mockResolvedValue(mockData)
    getNearestLocationModule.getNearestLocation.mockReturnValue(undefined)

    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London', usermiles: 10 }
    })

    expect(result).toBe(locationResult)
  })

  it('should return "no data found" if userLocation is blank', async () => {
    const result = await fetchmonitoringstation({
      payload: { userLocation: '', usermiles: 10 }
    })
    expect(result).toBe(locationResult)
  })

  it('should return "no data found" if usermiles is blank', async () => {
    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London', usermiles: '' }
    })
    expect(result).toBe(locationResult)
  })

  it('should log and return "no data found" when processNearestLocationResult returns "no data found"', async () => {
    fetchDataModule.fetchData.mockResolvedValue({
      getOSPlaces: ['place1'],
      getMeasurements: { measurements: ['m1'] }
    })
    getNearestLocationModule.getNearestLocation.mockReturnValue(null)
    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London', usermiles: 10 }
    })
    expect(result).toBe(locationResult)
    expect(mockLogger.info).toHaveBeenCalledWith(
      'No nearest locations found for userLocation: London, usermiles: 10'
    )
  })

  it('should return nearest locations when valid input is provided', async () => {
    fetchDataModule.fetchData.mockResolvedValue({
      getOSPlaces: ['place1'],
      getMeasurements: { measurements: ['m1'] }
    })
    getNearestLocationModule.getNearestLocation.mockReturnValue({
      finalnearestLocationsRange: ['loc1'],
      latlon: { lat: 51.5, lon: -0.1 }
    })

    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London', usermiles: 10 }
    })
    expect(result).toEqual(['loc1'])
  })

  it('should handle cases where fetchData returns no OSPlaces or measurements', async () => {
    fetchDataModule.fetchData.mockResolvedValue({
      getOSPlaces: [],
      getMeasurements: {}
    })
    getNearestLocationModule.getNearestLocation.mockReturnValue(null)

    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London', usermiles: 10 }
    })
    expect(result).toBe(locationResult)
  })

  it('should log info when no nearest locations are found', async () => {
    fetchDataModule.fetchData.mockResolvedValue({
      getOSPlaces: ['place1'],
      getMeasurements: { measurements: ['m1'] }
    })
    getNearestLocationModule.getNearestLocation.mockReturnValue(null)

    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London', usermiles: 10 }
    })
    expect(result).toBe(locationResult)
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('No nearest locations found')
    )
  })

  it('should handle cases where getNearestLocation returns null', async () => {
    fetchDataModule.fetchData.mockResolvedValue({
      getOSPlaces: ['place1'],
      getMeasurements: { measurements: ['m1'] }
    })
    getNearestLocationModule.getNearestLocation.mockReturnValue(null)

    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London', usermiles: 10 }
    })
    expect(result).toBe(locationResult)
  })

  it('should handle cases where getNearestLocation returns empty array', async () => {
    fetchDataModule.fetchData.mockResolvedValue({
      getOSPlaces: ['place1'],
      getMeasurements: { measurements: ['m1'] }
    })
    getNearestLocationModule.getNearestLocation.mockReturnValue({
      finalnearestLocationsRange: [],
      latlon: { lat: 51.5, lon: -0.1 }
    })

    const result = await fetchmonitoringstation({
      payload: { userLocation: 'London', usermiles: 10 }
    })
    expect(result).toEqual([])
  })
})
