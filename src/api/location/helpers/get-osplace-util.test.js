import { fetchmonitoringstation } from '~/src/api/location/helpers/get-osplace-util.js'
import { fetchData } from '~/src/api/location/helpers/fetch-data.js'
import { getNearestLocation } from '~/src/api/location/helpers/get-nearest-location.js'

jest.mock('~/src/api/location/helpers/fetch-data.js')
jest.mock('~/src/api/location/helpers/get-nearest-location.js')

describe('fetchmonitoringstation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return "no data found" when userLocation is empty string', async () => {
    const request = { params: { userLocation: '' } }
    const result = await fetchmonitoringstation(request)
    expect(result).toBe('no data found')
  })

  it('should return "no data found" when userLocation is null', async () => {
    const request = { params: { userLocation: null } }
    const result = await fetchmonitoringstation(request)
    expect(result).toBe('no data found')
  })

  it("should return 'no data found' when userLocation is \"''\"", async () => {
    const request = { params: { userLocation: "''" } }
    const result = await fetchmonitoringstation(request)
    expect(result).toBe('no data found')
  })

  it('should return finalnearestLocationsRange when latlon is not null', async () => {
    const request = { params: { userLocation: 'London&mile=5' } }

    fetchData.mockResolvedValue({
      getOSPlaces: [{ name: 'London' }],
      getMeasurements: { measurements: [{ dummy: 'data' }] }
    })

    getNearestLocation.mockReturnValue({
      finalnearestLocationsRange: ['location1', 'location2'],
      latlon: { lat: 51.5, lon: -0.1 }
    })

    const result = await fetchmonitoringstation(request)
    expect(result).toEqual(['location1', 'location2'])
    expect(fetchData).toHaveBeenCalled()
    expect(getNearestLocation).toHaveBeenCalled()
  })

  it('should return finalnearestLocationsRange when latlon is null', async () => {
    const request = { params: { userLocation: 'London&mile=5' } }

    fetchData.mockResolvedValue({
      getOSPlaces: [{ name: 'London' }],
      getMeasurements: { measurements: [{ dummy: 'data' }] }
    })

    getNearestLocation.mockReturnValue({
      finalnearestLocationsRange: ['location1'],
      latlon: null
    })

    const result = await fetchmonitoringstation(request)
    expect(result).toEqual(['location1'])
  })
})
