import { findStationByCoordinates } from './find-station-by-coordinates.js'

const stationAt = (lat, lng, name) => ({
  name,
  location: { type: 'Point', coordinates: [lat, lng] }
})

describe('findStationByCoordinates', () => {
  it('returns null when lat is not a valid number', () => {
    const result = findStationByCoordinates(
      [stationAt(51.5, -0.1, 'A')],
      'not-a-number',
      -0.1
    )

    expect(result).toBeNull()
  })

  it('returns null when lng is not a valid number', () => {
    const result = findStationByCoordinates(
      [stationAt(51.5, -0.1, 'A')],
      51.5,
      'not-a-number'
    )

    expect(result).toBeNull()
  })

  it('returns null when stations is undefined', () => {
    const result = findStationByCoordinates(undefined, 51.5, -0.1)

    expect(result).toBeNull()
  })

  it('returns null when no station matches the coordinates', () => {
    const stations = [stationAt(51.5, -0.1, 'A')]

    const result = findStationByCoordinates(stations, 52, 0)

    expect(result).toBeNull()
  })

  it('returns the single matching station within tolerance', () => {
    const stations = [stationAt(51.5, -0.1, 'A'), stationAt(52, 0, 'B')]

    const result = findStationByCoordinates(stations, '51.5', '-0.1')

    expect(result).toEqual(stations[0])
  })

  it('matches when coordinates differ within the tolerance band', () => {
    const stations = [stationAt(51.5, -0.1, 'A')]

    const result = findStationByCoordinates(stations, 51.50005, -0.10005)

    expect(result).toEqual(stations[0])
  })

  it('does not match when coordinates differ beyond the tolerance band', () => {
    const stations = [stationAt(51.5, -0.1, 'A')]

    const result = findStationByCoordinates(stations, 51.501, -0.1)

    expect(result).toBeNull()
  })

  it('ignores stations missing location data', () => {
    const stations = [{ name: 'No location' }]

    const result = findStationByCoordinates(stations, 51.5, -0.1)

    expect(result).toBeNull()
  })

  it('breaks a coordinate collision using name (case-insensitive)', () => {
    const stations = [
      stationAt(52.2, 0.9, 'Northampton'),
      stationAt(52.2, 0.9, 'Northampton PM10')
    ]

    const result = findStationByCoordinates(
      stations,
      52.2,
      0.9,
      'northampton pm10'
    )

    expect(result).toEqual(stations[1])
  })

  it('falls back to the first match when no name matches a collision', () => {
    const stations = [
      stationAt(52.2, 0.9, 'Northampton'),
      stationAt(52.2, 0.9, 'Northampton PM10')
    ]

    const result = findStationByCoordinates(stations, 52.2, 0.9, 'Unrelated')

    expect(result).toEqual(stations[0])
  })

  it('falls back to the first match when no name is provided on collision', () => {
    const stations = [
      stationAt(52.2, 0.9, 'Northampton'),
      stationAt(52.2, 0.9, 'Northampton PM10')
    ]

    const result = findStationByCoordinates(stations, 52.2, 0.9)

    expect(result).toEqual(stations[0])
  })
})
