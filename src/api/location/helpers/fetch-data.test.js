import { fetchData } from '~/src/api/location/helpers/fetch-data.js'
import { config } from '~/src/config/index.js'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'
import { catchFetchError } from '~/src/api/common/helpers/catch-fetch-error.js'
import { logConfig  } from '~/src/api/common/helpers/logging/logger-options.js'

jest.mock('~/src/config/index.js')
jest.mock('~/src/api/common/helpers/logging/logger.js')
jest.mock('~/src/api/common/helpers/catch-fetch-error.js')
jest.mock('~/src/api/common/helpers/logging/logger-options.js', () => ({
  logConfig: {
    enabled: true,
    redact: ['password', 'token']
  }
}))


describe('fetchData', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    createLogger.mockReturnValue(mockLogger)
  })

  it('should fetch both OSPlace and Measurements data successfully', async () => {
    config.get.mockImplementation((key) => {
      return key === 'OSPlaceApiUrl'
        ? 'https://os.api/'
        : 'https://measurements.api/'
    })

    catchFetchError
      .mockResolvedValueOnce([null, { os: 'place-data' }])
      .mockResolvedValueOnce([null, { measurements: 'data' }])

    const result = await fetchData('postcode', 'London')

    expect(result).toEqual({
      getOSPlaces: { os: 'place-data' },
      getMeasurements: { measurements: 'data' }
    })

    expect(mockLogger.info).toHaveBeenCalledWith('getOSPlaces data fetched:')
    expect(mockLogger.info).toHaveBeenCalledWith('getMeasurements data fetched:')
  })

  it('should log error if OSPlace fetch fails', async () => {
    config.get.mockImplementation((key) => {
      return key === 'OSPlaceApiUrl'
        ? 'https://os.api/'
        : 'https://measurements.api/'
    })

    catchFetchError
      .mockResolvedValueOnce([{ message: 'OSPlace error' }, null])
      .mockResolvedValueOnce([null, { measurements: 'data' }])

    const result = await fetchData('postcode', 'London')

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching statusCodeOSPlace data: OSPlace error'
    )
    expect(mockLogger.info).toHaveBeenCalledWith('getMeasurements data fetched:')
    expect(result.getOSPlaces).toBeNull()
  })

  it('should log error if Measurements fetch fails', async () => {
    config.get.mockImplementation((key) => {
      return key === 'OSPlaceApiUrl'
        ? 'https://os.api/'
        : 'https://measurements.api/'
    })

    catchFetchError
      .mockResolvedValueOnce([null, { os: 'place-data' }])
      .mockResolvedValueOnce([{ message: 'Measurements error' }, null])

    const result = await fetchData('postcode', 'London')

    expect(mockLogger.info).toHaveBeenCalledWith('getOSPlaces data fetched:')
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching Measurements data: Measurements error'
    )
    expect(result.getMeasurements).toBeNull()
  })

  it('should log both errors if both fetches fail', async () => {
    config.get.mockImplementation((key) => {
      return key === 'OSPlaceApiUrl'
        ? 'https://os.api/'
        : 'https://measurements.api/'
    })

    catchFetchError
      .mockResolvedValueOnce([{ message: 'OSPlace error' }, null])
      .mockResolvedValueOnce([{ message: 'Measurements error' }, null])

    const result = await fetchData('postcode', 'London')

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching statusCodeOSPlace data: OSPlace error'
    )
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching Measurements data: Measurements error'
    )
    expect(result).toEqual({ getOSPlaces: null, getMeasurements: null })
  })

  it('should handle empty userLocation', async () => {
    config.get.mockImplementation((key) => {
      return key === 'OSPlaceApiUrl'
        ? 'https://os.api/'
        : 'https://measurements.api/'
    })

    catchFetchError
      .mockResolvedValueOnce([null, { os: 'empty-location' }])
      .mockResolvedValueOnce([null, { measurements: 'data' }])

    const result = await fetchData('postcode', '')

    expect(result.getOSPlaces).toEqual({ os: 'empty-location' })
  })

  it('should encode special characters in userLocation', async () => {
    config.get.mockImplementation((key) => {
      return key === 'OSPlaceApiUrl'
        ? 'https://os.api/'
        : 'https://measurements.api/'
    })

    catchFetchError
      .mockResolvedValueOnce([null, { os: 'encoded' }])
      .mockResolvedValueOnce([null, { measurements: 'data' }])

    await fetchData('postcode', 'Londön & Co')

    expect(catchFetchError).toHaveBeenCalledWith(
      'https://os.api/Lond%C3%B6n%20%26%20Co',
      expect.any(Object)
    )
  })

  it('should handle undefined config URLs gracefully', async () => {
    config.get.mockReturnValue(undefined)

    catchFetchError
      .mockResolvedValueOnce([{ message: 'bad url' }, null])
      .mockResolvedValueOnce([{ message: 'bad url' }, null])

    const result = await fetchData('postcode', 'London')

    expect(mockLogger.error).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ getOSPlaces: null, getMeasurements: null })
  })
})
