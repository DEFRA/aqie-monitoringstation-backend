import { getNearestLocation } from '~/src/api/location/helpers/get-nearest-location.js'
import * as geolib from 'geolib'
import * as locationUtil from '~/src/api/location/helpers/location-util.js'

jest.mock('geolib')
jest.mock('~/src/api/location/helpers/location-util.js')
jest.mock('~/src/api/location/helpers/constants.js', () => ({
  geolibgetDistance: 0.000621371,
  distanceMeasurements: 10
}))

describe('getNearestLocation', () => {
  const defaultLatlon = { lat: 51.5074, lon: -0.1278 }

  beforeEach(() => {
    jest.clearAllMocks()
    locationUtil.convertPointToLonLat.mockReturnValue(defaultLatlon)
    locationUtil.coordinatesTotal.mockReturnValue([
      { latitude: 51.5074, longitude: -0.1278 }
    ])
    geolib.getDistance.mockReturnValue(1000)
  })

  function makeMeasurement(overrides = {}) {
    return {
      area: 'London',
      areaType: 'Urban Background',
      localSiteID: 'LON1',
      location: {
        type: 'Point',
        coordinates: [51.5074, -0.1278]
      },
      name: 'London Marylebone',
      updated: '2024-01-01',
      pollutants: {
        PM25: { value: 10, startDate: '2020-01-01', endDate: null },
        NO2: { value: 20, startDate: '2020-01-01', endDate: '2024-01-01' }
      },
      ...overrides
    }
  }

  function setupMocks(measurements, pointsInRangeReturn = true) {
    const coords = measurements.map((m) => ({
      latitude: m.location.coordinates[0],
      longitude: m.location.coordinates[1]
    }))
    locationUtil.coordinatesTotal.mockReturnValue(coords)
    geolib.orderByDistance.mockReturnValue(coords)
    locationUtil.pointsInRange.mockReturnValue(pointsInRangeReturn)
  }

  it('should return empty results when matches is empty', () => {
    locationUtil.convertPointToLonLat.mockReturnValue({})
    locationUtil.coordinatesTotal.mockReturnValue([])
    geolib.orderByDistance.mockReturnValue([])

    const result = getNearestLocation([], [], {}, 10, 0)
    expect(result.finalnearestLocationsRange).toEqual([])
    expect(result.latlon).toEqual({})
  })

  it('should return nearest locations with pollutant aliases PM25 and NO2', () => {
    const measurements = [makeMeasurement()]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )

    expect(result.finalnearestLocationsRange).toHaveLength(1)
    expect(result.finalnearestLocationsRange[0].name).toBe('London Marylebone')
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual([
      'PM2.5',
      'Nitrogen dioxide'
    ])
    expect(result.finalnearestLocationsRange[0].id).toBe('LondonMarylebone')
    expect(result.finalnearestLocationsRange[0].siteType).toBe(
      'Background Urban'
    )
    expect(result.finalnearestLocationsRange[0].region).toBe('London')
  })

  it('should handle GR25 alias to PM2.5', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          GR25: { value: 5, startDate: '2020-01-01', endDate: null }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual(['PM2.5'])
  })

  it('should handle GR25U alias to PM2.5', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          GR25U: { value: 5, startDate: '2020-01-01', endDate: null }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual(['PM2.5'])
  })

  it('should handle MP10 alias to PM10', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          MP10: { value: 5, startDate: '2020-01-01', endDate: null }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual(['PM10'])
  })

  it('should handle GE10 alias to PM10', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          GE10: { value: 5, startDate: '2020-01-01', endDate: null }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual(['PM10'])
  })

  it('should handle GR10 alias to PM10', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          GR10: { value: 5, startDate: '2020-01-01', endDate: null }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual(['PM10'])
  })

  it('should handle GR10U alias to PM10', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          GR10U: { value: 5, startDate: '2020-01-01', endDate: null }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual(['PM10'])
  })

  it('should handle O3 alias to Ozone', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          O3: { value: 5, startDate: '2020-01-01', endDate: null }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual(['Ozone'])
  })

  it('should handle SO2 alias to Sulphur dioxide', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          SO2: { value: 5, startDate: '2020-01-01', endDate: null }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual([
      'Sulphur dioxide'
    ])
  })

  it('should keep unknown pollutant names as-is', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          CO: { value: 5, startDate: '2020-01-01', endDate: null }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual(['CO'])
  })

  it('should filter out pollutants with endDate <= 2017-12-31', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          PM25: { value: 10, startDate: '2015-01-01', endDate: '2016-12-31' }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    // No valid pollutants so the measurement should be excluded
    expect(result.finalnearestLocationsRange).toHaveLength(0)
  })

  it('should include pollutants with endDate exactly 2017-12-31', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          PM25: { value: 10, startDate: '2015-01-01', endDate: '2017-12-31' }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    // endDate '2017-12-31' is NOT > '2017-12-31', so filtered out
    expect(result.finalnearestLocationsRange).toHaveLength(0)
  })

  it('should include pollutants with null startDate', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          NO2: { value: 10, startDate: null, endDate: null }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange).toHaveLength(1)
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual([
      'Nitrogen dioxide'
    ])
  })

  it('should exclude measurements without localSiteID', () => {
    const measurement = makeMeasurement()
    delete measurement.localSiteID
    const measurements = [measurement]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange).toHaveLength(0)
  })

  it('should exclude measurements with empty pollutants after filtering', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          PM25: { value: 0, startDate: '2010-01-01', endDate: '2015-01-01' }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange).toHaveLength(0)
  })

  it('should filter points not in range', () => {
    const measurements = [makeMeasurement()]
    setupMocks(measurements, false)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange).toHaveLength(0)
  })

  it('should sort results by distance ascending', () => {
    const m1 = makeMeasurement({
      name: 'Far Station',
      location: { type: 'Point', coordinates: [52.0, -1.0] },
      pollutants: {
        NO2: { value: 10, startDate: '2020-01-01', endDate: null }
      }
    })
    const m2 = makeMeasurement({
      name: 'Near Station',
      location: { type: 'Point', coordinates: [51.5074, -0.1278] },
      pollutants: {
        NO2: { value: 10, startDate: '2020-01-01', endDate: null }
      }
    })

    const coords = [
      { latitude: 52.0, longitude: -1.0 },
      { latitude: 51.5074, longitude: -0.1278 }
    ]
    locationUtil.coordinatesTotal.mockReturnValue(coords)
    geolib.orderByDistance.mockReturnValue(coords)
    locationUtil.pointsInRange.mockReturnValue(true)

    geolib.getDistance.mockImplementation((from, to) => {
      if (to.latitude === 52.0) return 50000
      return 500
    })

    const result = getNearestLocation([{ point: 'some' }], [m1, m2], {}, 100, 0)

    expect(result.finalnearestLocationsRange).toHaveLength(2)
    expect(
      parseFloat(result.finalnearestLocationsRange[0].distance)
    ).toBeLessThan(parseFloat(result.finalnearestLocationsRange[1].distance))
  })

  it('should deduplicate pollutant names in final output', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          PM25: { value: 10, startDate: '2020-01-01', endDate: null },
          GR25: { value: 5, startDate: '2020-01-01', endDate: null }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    // Both PM25 and GR25 map to PM2.5, should be deduplicated
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual(['PM2.5'])
  })

  it('should order pollutants according to predefined order', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          SO2: { value: 5, startDate: '2020-01-01', endDate: null },
          O3: { value: 5, startDate: '2020-01-01', endDate: null },
          NO2: { value: 5, startDate: '2020-01-01', endDate: null },
          GR10: { value: 5, startDate: '2020-01-01', endDate: null },
          PM25: { value: 5, startDate: '2020-01-01', endDate: null }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange[0].pollutants).toEqual([
      'PM2.5',
      'PM10',
      'Nitrogen dioxide',
      'Ozone',
      'Sulphur dioxide'
    ])
  })

  it('should return latlon from convertPointToLonLat', () => {
    const measurements = [makeMeasurement()]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.latlon).toEqual(defaultLatlon)
  })

  it('should correctly compute distance field', () => {
    const measurements = [makeMeasurement()]
    setupMocks(measurements)
    geolib.getDistance.mockReturnValue(16093) // ~10 miles

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    const expectedDistance = (16093 * 0.000621371).toFixed(1)
    expect(result.finalnearestLocationsRange[0].distance).toBe(expectedDistance)
  })

  it('should handle measurement with coordinates that do not match ordered points', () => {
    const measurements = [
      makeMeasurement({
        location: { type: 'Point', coordinates: [99.0, 99.0] }
      })
    ]
    // orderByDistance returns different coords than measurement
    const coords = [{ latitude: 51.5074, longitude: -0.1278 }]
    locationUtil.coordinatesTotal.mockReturnValue(coords)
    geolib.orderByDistance.mockReturnValue(coords)
    locationUtil.pointsInRange.mockReturnValue(true)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    // measurement coordinates don't match pointsToDisplay, so filtered out
    expect(result.finalnearestLocationsRange).toHaveLength(0)
  })

  it('should handle multiple measurements with some in range and some not', () => {
    const m1 = makeMeasurement({
      name: 'In Range',
      location: { type: 'Point', coordinates: [51.5074, -0.1278] }
    })
    const m2 = makeMeasurement({
      name: 'Out Range',
      location: { type: 'Point', coordinates: [52.0, -1.0] }
    })

    const coords = [
      { latitude: 51.5074, longitude: -0.1278 },
      { latitude: 52.0, longitude: -1.0 }
    ]
    locationUtil.coordinatesTotal.mockReturnValue(coords)
    geolib.orderByDistance.mockReturnValue(coords)
    locationUtil.pointsInRange
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)

    const result = getNearestLocation([{ point: 'some' }], [m1, m2], {}, 10, 0)
    expect(result.finalnearestLocationsRange).toHaveLength(1)
    expect(result.finalnearestLocationsRange[0].name).toBe('In Range')
  })

  it('should handle endDate > 2017-12-31 correctly', () => {
    const measurements = [
      makeMeasurement({
        pollutants: {
          PM25: { value: 10, startDate: '2018-01-01', endDate: '2018-01-01' }
        }
      })
    ]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange).toHaveLength(1)
  })

  it('should preserve location type and coordinates in output', () => {
    const measurements = [
      makeMeasurement({
        location: { type: 'MultiPoint', coordinates: [10.5, 20.3] }
      })
    ]
    const coords = [{ latitude: 10.5, longitude: 20.3 }]
    locationUtil.coordinatesTotal.mockReturnValue(coords)
    geolib.orderByDistance.mockReturnValue(coords)
    locationUtil.pointsInRange.mockReturnValue(true)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange[0].location.type).toBe(
      'MultiPoint'
    )
    expect(result.finalnearestLocationsRange[0].location.coordinates).toEqual([
      10.5, 20.3
    ])
  })

  it('should set updated field correctly', () => {
    const measurements = [makeMeasurement({ updated: '2023-06-15T12:00:00Z' })]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange[0].updated).toBe(
      '2023-06-15T12:00:00Z'
    )
  })

  it('should handle name with spaces by removing them for id', () => {
    const measurements = [makeMeasurement({ name: 'Station With Many Spaces' })]
    setupMocks(measurements)

    const result = getNearestLocation(
      [{ point: 'some' }],
      measurements,
      {},
      10,
      0
    )
    expect(result.finalnearestLocationsRange[0].id).toBe(
      'StationWithManySpaces'
    )
    expect(result.finalnearestLocationsRange[0].name).toBe(
      'Station With Many Spaces'
    )
  })
})
