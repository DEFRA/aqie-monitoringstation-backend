import { fetchData } from '~/src/api/location/helpers/fetch-data.js'
import { config } from '~/src/config/index.js'
import { catchFetchError } from '~/src/api/common/helpers/catch-fetch-error.js'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'

jest.mock('~/src/config/index.js', () => ({
  config: {
    get: jest.fn()
  }
}))

jest.mock('~/src/api/common/helpers/logging/logger.js', () => {
  const mockLogger = {
    error: jest.fn(),
    info: jest.fn()
  }
  return {
    createLogger: jest.fn(() => mockLogger)
  }
})

jest.mock('~/src/api/common/helpers/catch-fetch-error.js', () => ({
  catchFetchError: jest.fn()
}))

describe('fetchData', () => {
  const mockLogger = {
    error: jest.fn(),
    info: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    createLogger.mockReturnValue(mockLogger)
  })

  it('should fetch data successfully from both APIs', async () => {
    config.get.mockImplementation((key) =>
      key === 'OSPlaceApiUrl'
        ? 'https://osplace.test'
        : 'https://measurements.test'
    )

    catchFetchError
      .mockResolvedValueOnce([null, { osPlace: 'data' }])
      .mockResolvedValueOnce([null, { measurements: 'data' }])

    const result = await fetchData('city', 'London')

    expect(result).toEqual({
      getOSPlaces: { osPlace: 'data' },
      getMeasurements: { measurements: 'data' }
    })

    expect(mockLogger.info).toHaveBeenCalledWith('getOSPlaces data fetched:')
    expect(mockLogger.info).toHaveBeenCalledWith(
      'getMeasurements data fetched:'
    )
  })

  it('should log error if OSPlace API fails', async () => {
    config.get.mockImplementation((key) =>
      key === 'OSPlaceApiUrl'
        ? 'https://osplace.test'
        : 'https://measurements.test'
    )

    catchFetchError
      .mockResolvedValueOnce([{ message: 'OSPlace error' }, null])
      .mockResolvedValueOnce([null, { measurements: 'data' }])

    const result = await fetchData('city', 'London')

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching statusCodeOSPlace data: OSPlace error'
    )
    expect(mockLogger.info).toHaveBeenCalledWith(
      'getMeasurements data fetched:'
    )
    expect(result.getOSPlaces).toBeNull()
  })

  it('should log error if Measurements API fails', async () => {
    config.get.mockImplementation((key) =>
      key === 'OSPlaceApiUrl'
        ? 'https://osplace.test'
        : 'https://measurements.test'
    )

    catchFetchError
      .mockResolvedValueOnce([null, { osPlace: 'data' }])
      .mockResolvedValueOnce([{ message: 'Measurements error' }, null])

    const result = await fetchData('city', 'London')

    expect(mockLogger.info).toHaveBeenCalledWith('getOSPlaces data fetched:')
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching Measurements data: Measurements error'
    )
    expect(result.getMeasurements).toBeNull()
  })

  it('should log errors if both APIs fail', async () => {
    config.get.mockImplementation((key) =>
      key === 'OSPlaceApiUrl'
        ? 'https://osplace.test'
        : 'https://measurements.test'
    )

    catchFetchError
      .mockResolvedValueOnce([{ message: 'OSPlace error' }, null])
      .mockResolvedValueOnce([{ message: 'Measurements error' }, null])

    const result = await fetchData('city', 'London')

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching statusCodeOSPlace data: OSPlace error'
    )
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching Measurements data: Measurements error'
    )
    expect(result).toEqual({ getOSPlaces: null, getMeasurements: null })
  })

  it('should handle unexpected config values gracefully', async () => {
    config.get.mockReturnValue(undefined)

    catchFetchError
      .mockResolvedValueOnce([null, { osPlace: 'data' }])
      .mockResolvedValueOnce([null, { measurements: 'data' }])

    const result = await fetchData('city', 'London')

    expect(result).toEqual({
      getOSPlaces: { osPlace: 'data' },
      getMeasurements: { measurements: 'data' }
    })
  })

  it('should handle null or undefined userLocation', async () => {
    config.get.mockReturnValue('https://test.api')

    catchFetchError
      .mockResolvedValueOnce([null, { osPlace: 'data' }])
      .mockResolvedValueOnce([null, { measurements: 'data' }])

    const result = await fetchData('city', null)

    expect(result.getOSPlaces).toBeDefined()
    expect(result.getMeasurements).toBeDefined()
  })

  it('should handle unexpected catchFetchError return format', async () => {
    config.get.mockReturnValue('https://test.api')

    catchFetchError
      .mockResolvedValueOnce([undefined, undefined])
      .mockResolvedValueOnce([undefined, undefined])

    const result = await fetchData('city', 'London')

    expect(result).toEqual({
      getOSPlaces: undefined,
      getMeasurements: undefined
    })
  })
})
