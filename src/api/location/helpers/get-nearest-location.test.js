// 30 seconds
import { getNearestLocation } from '~/src/api/location/helpers/get-nearest-location.js'
import * as geolib from 'geolib'
import * as locationUtil from '~/src/api/location/helpers/location-util.js'
// import {
//   geolibgetDistance,
//   distanceMeasurements
// } from '~/src/api/location/helpers/constants.js'

jest.mock('geolib')
jest.mock('~/src/api/location/helpers/location-util.js')
jest.mock('~/src/api/location/helpers/constants.js', () => ({
  geolibgetDistance: 0.001,
  distanceMeasurements: 2
}))

describe('getNearestLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty result when matches is empty', () => {
    geolib.orderByDistance.mockReturnValue([])
    const result = getNearestLocation([], [], {}, 10, 0)
    expect(result).toEqual({ finalnearestLocationsRange: [], latlon: {} })
  })

  it('should return nearest locations with valid pollutants', () => {
    const matches = [{ dummy: 'match' }]
    const location = { dummy: 'location' }
    const index = 0
    const latlon = { lat: 51.5, lon: -0.1 }

    const measurements = [
      {
        area: 'Area 1',
        areaType: 'Urban Background',
        localSiteID: '123',
        name: 'Site A',
        updated: '2025-06-18',
        location: {
          type: 'Point',
          coordinates: [51.51, -0.11]
        },
        pollutants: {
          PM25: { value: 10, startDate: '2020-01-01', endDate: null },
          NO2: { value: null, startDate: '2020-01-01', endDate: '2025-01-01' },
          O3: { value: 0, startDate: null, endDate: null }
        }
      }
    ]

    locationUtil.convertPointToLonLat.mockReturnValue(latlon)
    locationUtil.coordinatesTotal.mockReturnValue([
      { latitude: 51.51, longitude: -0.11 }
    ])
    geolib.orderByDistance.mockReturnValue([
      { latitude: 51.51, longitude: -0.11 }
    ])
    locationUtil.pointsInRange.mockReturnValue(true)
    geolib.getDistance.mockReturnValue(1000)

    const result = getNearestLocation(
      matches,
      measurements,
      location,
      10,
      index
    )

    expect(result.finalnearestLocationsRange).toHaveLength(1)
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual([
      'PM2.5',
      'Nitrogen dioxide'
    ])
    expect(result.latlon).toEqual(latlon)
  })

  it('should exclude pollutants with invalid endDate and value', () => {
    const matches = [{ dummy: 'match' }]
    const location = {}
    const index = 0
    const latlon = { lat: 51.5, lon: -0.1 }

    const measurements = [
      {
        area: 'Area 2',
        areaType: 'Suburban Industrial',
        localSiteID: '456',
        name: 'Site B',
        updated: '2025-06-18',
        location: {
          type: 'Point',
          coordinates: [51.52, -0.12]
        },
        pollutants: {
          SO2: { value: null, startDate: null, endDate: '2010-01-01' }
        }
      }
    ]

    locationUtil.convertPointToLonLat.mockReturnValue(latlon)
    locationUtil.coordinatesTotal.mockReturnValue([
      { latitude: 51.52, longitude: -0.12 }
    ])
    geolib.orderByDistance.mockReturnValue([
      { latitude: 51.52, longitude: -0.12 }
    ])
    locationUtil.pointsInRange.mockReturnValue(true)
    geolib.getDistance.mockReturnValue(2000)

    const result = getNearestLocation(
      matches,
      measurements,
      location,
      10,
      index
    )

    expect(result.finalnearestLocationsRange).toHaveLength(0)
  })

  it('should skip entries without localSiteID', () => {
    const matches = [{ dummy: 'match' }]
    const location = {}
    const index = 0
    const latlon = { lat: 51.5, lon: -0.1 }

    const measurements = [
      {
        area: 'Area 3',
        areaType: 'Rural Background',
        name: 'Site C',
        updated: '2025-06-18',
        location: {
          type: 'Point',
          coordinates: [51.53, -0.13]
        },
        pollutants: {
          PM10: { value: 15, startDate: '2020-01-01', endDate: null }
        }
      }
    ]

    locationUtil.convertPointToLonLat.mockReturnValue(latlon)
    locationUtil.coordinatesTotal.mockReturnValue([
      { latitude: 51.53, longitude: -0.13 }
    ])
    geolib.orderByDistance.mockReturnValue([
      { latitude: 51.53, longitude: -0.13 }
    ])
    locationUtil.pointsInRange.mockReturnValue(true)
    geolib.getDistance.mockReturnValue(1500)

    const result = getNearestLocation(
      matches,
      measurements,
      location,
      10,
      index
    )

    expect(result.finalnearestLocationsRange).toHaveLength(0)
  })

  it('should sort pollutants in correct order', () => {
    const matches = [{ dummy: 'match' }]
    const location = {}
    const index = 0
    const latlon = { lat: 51.5, lon: -0.1 }

    const measurements = [
      {
        area: 'Area 4',
        areaType: 'Urban Traffic',
        localSiteID: '789',
        name: 'Site D',
        updated: '2025-06-18',
        location: {
          type: 'Point',
          coordinates: [51.54, -0.14]
        },
        pollutants: {
          O3: { value: 5, startDate: '2020-01-01', endDate: null },
          PM25: { value: 10, startDate: '2020-01-01', endDate: null }
        }
      }
    ]

    locationUtil.convertPointToLonLat.mockReturnValue(latlon)
    locationUtil.coordinatesTotal.mockReturnValue([
      { latitude: 51.54, longitude: -0.14 }
    ])
    geolib.orderByDistance.mockReturnValue([
      { latitude: 51.54, longitude: -0.14 }
    ])
    locationUtil.pointsInRange.mockReturnValue(true)
    geolib.getDistance.mockReturnValue(1200)

    const result = getNearestLocation(
      matches,
      measurements,
      location,
      10,
      index
    )

    expect(result.finalnearestLocationsRange[0].pollutants).toEqual([
      'PM2.5',
      'Ozone'
    ])
  })
})
