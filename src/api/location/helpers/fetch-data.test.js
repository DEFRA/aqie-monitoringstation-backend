import { fetchData } from './fetch-data.js'
import { config } from '~/src/config/index.js'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'
import { catchFetchError } from '~/src/api/common/helpers/catch-fetch-error.js'

jest.mock('~/src/config/index.js', () => ({
  config: {
    get: jest.fn()
  }
}))

jest.mock('~/src/api/common/helpers/logging/logger.js', () => ({
  createLogger: jest.fn()
}))

jest.mock('~/src/api/common/helpers/catch-fetch-error.js', () => ({
  catchFetchError: jest.fn()
}))

describe('fetchData', () => {
  let mockLogger

  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    }
    createLogger.mockReturnValue(mockLogger)
    config.get.mockImplementation((key) => {
      switch (key) {
        case 'ricardoApiKey':
          return 'test-ricardo-api-key'
        case 'OSPlaceApiKey':
          return 'test-osplace-api-key'
        case 'OSPlaceApiUrl':
          return 'https://osplace.example.com/api'
        case 'ricardoApiUrl':
          return 'https://ricardo.example.com/api'
        default:
          return undefined
      }
    })
  })

  test('should return getOSPlaces and getRicardodata on successful fetches', async () => {
    const mockOSPlacesResponse = { results: [{ name: 'London' }] }
    const mockRicardoResponse = { stations: [{ id: 1 }] }

    catchFetchError
      .mockResolvedValueOnce([null, mockOSPlacesResponse])
      .mockResolvedValueOnce([null, mockRicardoResponse])

    const result = await fetchData('city', 'London')

    expect(result).toEqual({
      getOSPlaces: mockOSPlacesResponse,
      getRicardodata: mockRicardoResponse
    })
    expect(mockLogger.info).toHaveBeenCalledWith('getOSPlaces data fetched:')
    expect(mockLogger.info).toHaveBeenCalledWith('getRicardodata data fetched:')
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  test('should log error when OSPlace fetch fails', async () => {
    const osError = new Error('OSPlace network error')
    const mockRicardoResponse = { stations: [] }

    catchFetchError
      .mockResolvedValueOnce([osError, undefined])
      .mockResolvedValueOnce([null, mockRicardoResponse])

    const result = await fetchData('city', 'Manchester')

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching statusCodeOSPlace data: OSPlace network error'
    )
    expect(mockLogger.info).toHaveBeenCalledWith('getRicardodata data fetched:')
    expect(result).toEqual({
      getOSPlaces: undefined,
      getRicardodata: mockRicardoResponse
    })
  })

  test('should log error when Ricardo fetch fails', async () => {
    const ricardoError = new Error('Ricardo network error')
    const mockOSPlacesResponse = { results: [] }

    catchFetchError
      .mockResolvedValueOnce([null, mockOSPlacesResponse])
      .mockResolvedValueOnce([ricardoError, undefined])

    const result = await fetchData('postcode', 'SW1A 1AA')

    expect(mockLogger.info).toHaveBeenCalledWith('getOSPlaces data fetched:')
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching Ricardo data: Ricardo network error'
    )
    expect(result).toEqual({
      getOSPlaces: mockOSPlacesResponse,
      getRicardodata: undefined
    })
  })

  test('should log errors when both fetches fail', async () => {
    const osError = new Error('OSPlace timeout')
    const ricardoError = new Error('Ricardo timeout')

    catchFetchError
      .mockResolvedValueOnce([osError, undefined])
      .mockResolvedValueOnce([ricardoError, undefined])

    const result = await fetchData('region', 'Birmingham')

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching statusCodeOSPlace data: OSPlace timeout'
    )
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching Ricardo data: Ricardo timeout'
    )
    expect(result).toEqual({
      getOSPlaces: undefined,
      getRicardodata: undefined
    })
  })

  test('should call catchFetchError with correct OSPlace URL and options', async () => {
    catchFetchError
      .mockResolvedValueOnce([null, {}])
      .mockResolvedValueOnce([null, {}])

    await fetchData('city', 'Leeds')

    expect(catchFetchError).toHaveBeenCalledWith(
      'https://osplace.example.com/api',
      {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          preserveWhitespace: true
        },
        body: JSON.stringify({ userLocation: 'Leeds' })
      }
    )
  })

  test('should call catchFetchError with correct Ricardo URL and options', async () => {
    catchFetchError
      .mockResolvedValueOnce([null, {}])
      .mockResolvedValueOnce([null, {}])

    await fetchData('city', 'Bristol')

    expect(catchFetchError).toHaveBeenCalledWith(
      'https://ricardo.example.com/api?with-closed=true&with-pollutants=1&stream=data',
      {
        method: 'get',
        headers: {
          'Content-Type': 'text/json',
          preserveWhitespace: true
        }
      }
    )
  })

  test('should create a logger instance', async () => {
    catchFetchError
      .mockResolvedValueOnce([null, {}])
      .mockResolvedValueOnce([null, {}])

    await fetchData('city', 'Oxford')

    expect(createLogger).toHaveBeenCalledTimes(1)
  })

  test('should read all required config values', async () => {
    catchFetchError
      .mockResolvedValueOnce([null, {}])
      .mockResolvedValueOnce([null, {}])

    await fetchData('city', 'Cambridge')

    expect(config.get).toHaveBeenCalledWith('OSPlaceApiUrl')
    expect(config.get).toHaveBeenCalledWith('ricardoApiUrl')
  })
})
