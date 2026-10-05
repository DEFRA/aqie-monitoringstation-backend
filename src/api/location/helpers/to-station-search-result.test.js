import { toStationSearchResult } from './to-station-search-result.js'

const baseStation = (overrides = {}) => ({
  name: 'Sibton',
  area: 'South East',
  localSiteID: 'SIB',
  areaType: 'Rural Background',
  location: { type: 'Point', coordinates: [52.2944, 1.463497] },
  updated: '2026-09-22T00:00:00.000Z',
  pollutants: {
    O3: { startDate: '1973-07-01', endDate: null }
  },
  ...overrides
})

describe('toStationSearchResult', () => {
  it('returns null when curr is null', () => {
    expect(toStationSearchResult(null)).toBeNull()
  })

  it('returns null when curr is undefined', () => {
    expect(toStationSearchResult(undefined)).toBeNull()
  })

  it('returns null when localSiteID is undefined', () => {
    expect(
      toStationSearchResult(baseStation({ localSiteID: undefined }))
    ).toBeNull()
  })

  it('returns null when localSiteID is null', () => {
    expect(toStationSearchResult(baseStation({ localSiteID: null }))).toBeNull()
  })

  it('returns null when there are no active pollutants', () => {
    const closed = baseStation({
      pollutants: {
        O3: { startDate: '1973-07-01', endDate: '1996-09-12' }
      }
    })

    expect(toStationSearchResult(closed)).toBeNull()
  })

  it('includes a pollutant with a null endDate as active', () => {
    const result = toStationSearchResult(baseStation())

    expect(result.pollutants).toEqual(['Ozone'])
  })

  it('includes a pollutant with an endDate after the cutoff as active', () => {
    const result = toStationSearchResult(
      baseStation({
        pollutants: {
          O3: { startDate: '1973-07-01', endDate: '2020-01-01' }
        }
      })
    )

    expect(result.pollutants).toEqual(['Ozone'])
  })

  it('excludes a pollutant with an endDate on or before the cutoff', () => {
    const result = toStationSearchResult(
      baseStation({
        pollutants: {
          O3: { startDate: '1973-07-01', endDate: '2017-12-31' },
          NO2: { startDate: '1973-07-01', endDate: null }
        }
      })
    )

    expect(result.pollutants).toEqual(['Nitrogen dioxide'])
  })

  it('aliases known pollutant codes and orders them consistently', () => {
    const result = toStationSearchResult(
      baseStation({
        pollutants: {
          SO2: { startDate: '2000-01-01', endDate: null },
          GE10: { startDate: '2000-01-01', endDate: null },
          NO2: { startDate: '2000-01-01', endDate: null },
          PM25: { startDate: '2000-01-01', endDate: null }
        }
      })
    )

    expect(result.pollutants).toEqual([
      'PM2.5',
      'PM10',
      'Nitrogen dioxide',
      'Sulphur dioxide'
    ])
  })

  it('deduplicates aliases that map to the same pollutant name', () => {
    const result = toStationSearchResult(
      baseStation({
        pollutants: {
          GE10: { startDate: '2000-01-01', endDate: null },
          GR10: { startDate: '2000-01-01', endDate: null }
        }
      })
    )

    expect(result.pollutants).toEqual(['PM10'])
  })

  it('keeps unknown pollutant codes as-is', () => {
    const result = toStationSearchResult(
      baseStation({
        pollutants: {
          UNKNOWN: { startDate: '2000-01-01', endDate: null }
        }
      })
    )

    expect(result.pollutants).toEqual(['UNKNOWN'])
  })

  it('swaps the two areaType words', () => {
    const result = toStationSearchResult(
      baseStation({ areaType: 'Rural Background' })
    )

    expect(result.siteType).toBe('Background Rural')
  })

  it('defaults areaType to an empty string when missing', () => {
    const result = toStationSearchResult(baseStation({ areaType: undefined }))

    expect(result.siteType).toBe('')
  })

  it('handles a single-word areaType', () => {
    const result = toStationSearchResult(baseStation({ areaType: 'Urban' }))

    expect(result.siteType).toBe('Urban')
  })

  it('returns null when pollutants is missing entirely', () => {
    expect(
      toStationSearchResult(baseStation({ pollutants: undefined }))
    ).toBeNull()
  })

  it('builds the id by removing spaces from the name', () => {
    const result = toStationSearchResult(baseStation({ name: 'Bush Estate' }))

    expect(result.id).toBe('BushEstate')
  })

  it('defaults distance to null when not provided', () => {
    const result = toStationSearchResult(baseStation())

    expect(result.distance).toBeNull()
  })

  it('passes through a provided distance', () => {
    const result = toStationSearchResult(baseStation(), 123)

    expect(result.distance).toBe(123)
  })

  it('copies the coordinates array rather than referencing the original', () => {
    const station = baseStation()

    const result = toStationSearchResult(station)

    expect(result.location.coordinates).toEqual(station.location.coordinates)
    expect(result.location.coordinates).not.toBe(station.location.coordinates)
  })

  it('maps region, localSiteID, name and updated straight through', () => {
    const result = toStationSearchResult(baseStation())

    expect(result.region).toBe('South East')
    expect(result.localSiteID).toBe('SIB')
    expect(result.name).toBe('Sibton')
    expect(result.updated).toBe('2026-09-22T00:00:00.000Z')
  })
})
