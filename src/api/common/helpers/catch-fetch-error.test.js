import { jest } from '@jest/globals'

const mockInfo = jest.fn()
const mockError = jest.fn()

let catchFetchError

beforeEach(async () => {
  jest.resetModules()
  jest.clearAllMocks()

  jest.mock('~/src/api/common/helpers/logging/logger.js', () => ({
    createLogger: () => ({
      info: mockInfo,
      error: mockError
    })
  }))

  // Mock performance.now()
  global.performance = {
    now: jest.fn().mockReturnValueOnce(1000).mockReturnValueOnce(1500)
  }

  // Mock Date
  const fixedDate = new Date('2025-06-25T10:00:00Z')
  global.Date = class extends Date {
    constructor() {
      super()
      return fixedDate
    }
  }

  // Dynamically import the module after mocks are set
  await jest.isolateModulesAsync(async () => {
    const module = await import('~/src/api/common/helpers/catch-fetch-error.js')
    catchFetchError = module.catchFetchError
  })
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('catchFetchError', () => {
  it('should return data on successful fetch', async () => {
    const mockData = { message: 'success' }

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData)
    })

    const [error, data] = await catchFetchError('https://api.example.com', {})

    expect(error).toBeUndefined()
    expect(data).toEqual(mockData)

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringMatching(
        /API from https:\/\/api\.example\.com fetch took .* milliseconds/
      )
    )
  })

  it('should handle non-ok response and throw error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: jest.fn()
    })

    const [error, data] = await catchFetchError('https://api.example.com', {})

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain(
      'HTTP error! status from https://api.example.com: 404'
    )
    expect(data).toBeUndefined()
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining(
        'Failed to fetch data from https://api.example.com'
      )
    )
    expect(mockError).toHaveBeenCalled()
  })

  it('should handle fetch throwing an error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'))

    const [error, data] = await catchFetchError('https://api.example.com', {})

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Network failure')
    expect(data).toBeUndefined()
    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining(
        'Failed to fetch data from https://api.example.com: Network failure'
      )
    )
  })

  it('should handle error thrown by response.json()', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
    })

    const [error, data] = await catchFetchError('https://api.example.com', {})

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Invalid JSON')
    expect(data).toBeUndefined()
    expect(mockError).toHaveBeenCalled()
  })

  it('should log correct date format', async () => {
    const mockData = { result: 'ok' }

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData)
    })

    await catchFetchError('https://api.example.com', {})

    const logCall = mockInfo.mock.calls.find((call) =>
      call[0].includes('Wed, 25 Jun 2025 10:00:00 GMT')
    )

    expect(logCall).toBeDefined()
  })
})
