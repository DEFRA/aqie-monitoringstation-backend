import { frameSiteInfoData } from './frame-siteinfo-data.js'

describe('frameSiteInfoData', () => {
  const fixedDate = '2024-01-15T12:00:00.000Z'

  describe('when sourceApiJson has no member array', () => {
    it('returns empty array for undefined input', () => {
      expect(frameSiteInfoData(undefined, { updated: fixedDate })).toEqual([])
    })

    it('returns empty array for null input', () => {
      expect(frameSiteInfoData(null, { updated: fixedDate })).toEqual([])
    })

    it('returns empty array when member is not an array', () => {
      expect(
        frameSiteInfoData({ member: 'not-array' }, { updated: fixedDate })
      ).toEqual([])
    })

    it('returns empty array for empty object', () => {
      expect(frameSiteInfoData({}, { updated: fixedDate })).toEqual([])
    })
  })

  describe('when sourceApiJson has an empty member array', () => {
    it('returns empty array', () => {
      expect(frameSiteInfoData({ member: [] }, { updated: fixedDate })).toEqual(
        []
      )
    })
  })

  describe('basic site mapping', () => {
    it('maps site fields correctly', () => {
      const source = {
        member: [
          {
            siteName: 'Test Site',
            governmentRegion: 'North East',
            localSiteId: 'TS01',
            siteType: 'Urban',
            areaType: 'Background',
            latitude: '54.123',
            longitude: '-1.456',
            pollutantsMetaData: {}
          }
        ]
      }

      const result = frameSiteInfoData(source, { updated: fixedDate })

      expect(result).toEqual([
        {
          name: 'Test Site',
          area: 'North East',
          localSiteID: 'TS01',
          areaType: 'Urban Background',
          location: {
            type: 'Point',
            coordinates: [54.123, -1.456]
          },
          updated: fixedDate,
          pollutants: {}
        }
      ])
    })

    it('handles missing site fields with null defaults', () => {
      const source = {
        member: [{}]
      }

      const result = frameSiteInfoData(source, { updated: fixedDate })

      expect(result[0].name).toBeNull()
      expect(result[0].area).toBeNull()
      expect(result[0].localSiteID).toBeNull()
      expect(result[0].areaType).toBeNull()
      expect(result[0].location.coordinates).toEqual([NaN, NaN])
    })
  })

  describe('areaType construction', () => {
    it('returns only siteType when areaType is missing', () => {
      const source = {
        member: [{ siteType: 'Rural', areaType: '' }]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].areaType).toBe('Rural')
    })

    it('returns only areaType when siteType is missing', () => {
      const source = {
        member: [{ siteType: '', areaType: 'Industrial' }]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].areaType).toBe('Industrial')
    })

    it('returns null when both siteType and areaType are empty', () => {
      const source = {
        member: [{ siteType: '', areaType: '' }]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].areaType).toBeNull()
    })

    it('returns null when both siteType and areaType are undefined', () => {
      const source = {
        member: [{}]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].areaType).toBeNull()
    })
  })

  describe('updated option', () => {
    it('uses provided fixed string', () => {
      const source = { member: [{}] }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].updated).toBe(fixedDate)
    })

    it('uses function when provided', () => {
      const source = { member: [{ siteName: 'A' }] }
      const updatedFn = (site) => `updated-${site.siteName}`
      const result = frameSiteInfoData(source, { updated: updatedFn })
      expect(result[0].updated).toBe('updated-A')
    })

    it('defaults to current ISO string when updated option is not provided', () => {
      const before = new Date().toISOString()
      const source = { member: [{}] }
      const result = frameSiteInfoData(source)
      const after = new Date().toISOString()
      expect(result[0].updated >= before).toBe(true)
      expect(result[0].updated <= after).toBe(true)
    })

    it('defaults to current ISO string when options is empty', () => {
      const before = new Date().toISOString()
      const source = { member: [{}] }
      const result = frameSiteInfoData(source, {})
      const after = new Date().toISOString()
      expect(result[0].updated >= before).toBe(true)
      expect(result[0].updated <= after).toBe(true)
    })
  })

  describe('toIsoDate', () => {
    it('converts dd/mm/yyyy to ISO date', () => {
      const source = {
        member: [
          {
            pollutantsMetaData: {
              p1: {
                name: 'Nitrogen dioxide',
                startDate: '01/06/2020',
                endDate: '15/12/2023'
              }
            }
          }
        ]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].pollutants.NO2).toEqual({
        startDate: '2020-06-01',
        endDate: '2023-12-15'
      })
    })

    it('pads single-digit day and month', () => {
      const source = {
        member: [
          {
            pollutantsMetaData: {
              p1: {
                name: 'Ozone',
                startDate: '5/3/2021',
                endDate: '9/1/2022'
              }
            }
          }
        ]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].pollutants.O3).toEqual({
        startDate: '2021-03-05',
        endDate: '2022-01-09'
      })
    })

    it('returns null for empty/null dates', () => {
      const source = {
        member: [
          {
            pollutantsMetaData: {
              p1: {
                name: 'Ozone',
                startDate: null,
                endDate: ''
              }
            }
          }
        ]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].pollutants.O3).toEqual({
        startDate: null,
        endDate: null
      })
    })

    it('returns null for malformed date string missing parts', () => {
      const source = {
        member: [
          {
            pollutantsMetaData: {
              p1: {
                name: 'Ozone',
                startDate: '01/06',
                endDate: '2023'
              }
            }
          }
        ]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].pollutants.O3).toEqual({
        startDate: null,
        endDate: null
      })
    })

    it('returns null for undefined date', () => {
      const source = {
        member: [
          {
            pollutantsMetaData: {
              p1: {
                name: 'Ozone',
                startDate: undefined,
                endDate: undefined
              }
            }
          }
        ]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].pollutants.O3).toEqual({
        startDate: null,
        endDate: null
      })
    })
  })

  describe('mapPollutantCode — all pollutant rules', () => {
    const makeSite = (name) => ({
      member: [
        {
          pollutantsMetaData: {
            p1: { name, startDate: '01/01/2020', endDate: '31/12/2023' }
          }
        }
      ]
    })

    it.each([
      ['PM<sub>2.5</sub> particulate matter (Hourly measured)', 'PM25'],
      ['PM<sub>2.5</sub> particulate matter (Daily measured)', 'GR25'],
      ['Daily measured PM<sub>2.5</sub> (uncorrected)', 'GR25U'],
      ['PM<sub>10</sub> particulate matter (Hourly measured)', 'GE10'],
      ['PM<sub>10</sub> particulate matter (Daily measured)', 'GR10'],
      ['Daily measured PM<sub>10</sub> (uncorrected)', 'GR10U'],
      ['Nitrogen dioxide', 'NO2'],
      ['Sulphur dioxide', 'SO2'],
      ['Ozone', 'O3']
    ])('maps "%s" to code "%s"', (name, expectedCode) => {
      const result = frameSiteInfoData(makeSite(name), {
        updated: fixedDate
      })
      expect(result[0].pollutants[expectedCode]).toBeDefined()
      expect(result[0].pollutants[expectedCode].startDate).toBe('2020-01-01')
    })

    it('skips unknown pollutant names', () => {
      const result = frameSiteInfoData(makeSite('Unknown Gas'), {
        updated: fixedDate
      })
      expect(result[0].pollutants).toEqual({})
    })

    it('handles null/undefined pollutant name', () => {
      const source = {
        member: [
          {
            pollutantsMetaData: {
              p1: { name: null, startDate: '01/01/2020', endDate: null },
              p2: { startDate: '01/01/2020', endDate: null }
            }
          }
        ]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].pollutants).toEqual({})
    })
  })

  describe('buildPollutants with includeMissingCodes', () => {
    it('adds missing codes with null dates', () => {
      const source = {
        member: [
          {
            pollutantsMetaData: {
              p1: {
                name: 'Ozone',
                startDate: '01/01/2020',
                endDate: '31/12/2023'
              }
            }
          }
        ]
      }
      const result = frameSiteInfoData(source, {
        updated: fixedDate,
        includeMissingCodes: ['GR10', 'NO2']
      })
      expect(result[0].pollutants.O3).toEqual({
        startDate: '2020-01-01',
        endDate: '2023-12-31'
      })
      expect(result[0].pollutants.GR10).toEqual({
        startDate: null,
        endDate: null
      })
      expect(result[0].pollutants.NO2).toEqual({
        startDate: null,
        endDate: null
      })
    })

    it('does not overwrite existing code with includeMissingCodes', () => {
      const source = {
        member: [
          {
            pollutantsMetaData: {
              p1: {
                name: 'Ozone',
                startDate: '01/01/2020',
                endDate: '31/12/2023'
              }
            }
          }
        ]
      }
      const result = frameSiteInfoData(source, {
        updated: fixedDate,
        includeMissingCodes: ['O3']
      })
      expect(result[0].pollutants.O3).toEqual({
        startDate: '2020-01-01',
        endDate: '2023-12-31'
      })
    })
  })

  describe('buildPollutants with null/undefined pollutantsMetaData', () => {
    it('handles null pollutantsMetaData', () => {
      const source = {
        member: [{ pollutantsMetaData: null }]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].pollutants).toEqual({})
    })

    it('handles undefined pollutantsMetaData', () => {
      const source = {
        member: [{}]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].pollutants).toEqual({})
    })

    it('handles null pollutantsMetaData with includeMissingCodes', () => {
      const source = {
        member: [{ pollutantsMetaData: null }]
      }
      const result = frameSiteInfoData(source, {
        updated: fixedDate,
        includeMissingCodes: ['PM25']
      })
      expect(result[0].pollutants.PM25).toEqual({
        startDate: null,
        endDate: null
      })
    })
  })

  describe('multiple members', () => {
    it('maps all members in array', () => {
      const source = {
        member: [
          { siteName: 'Site A', pollutantsMetaData: {} },
          { siteName: 'Site B', pollutantsMetaData: {} },
          { siteName: 'Site C', pollutantsMetaData: {} }
        ]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Site A')
      expect(result[1].name).toBe('Site B')
      expect(result[2].name).toBe('Site C')
    })
  })

  describe('case insensitivity of pollutant names', () => {
    it('matches pollutant names case-insensitively', () => {
      const source = {
        member: [
          {
            pollutantsMetaData: {
              p1: {
                name: 'NITROGEN DIOXIDE',
                startDate: '01/01/2020',
                endDate: null
              },
              p2: {
                name: 'ozone',
                startDate: '01/01/2021',
                endDate: null
              },
              p3: {
                name: 'SULPHUR DIOXIDE',
                startDate: '05/05/2019',
                endDate: null
              }
            }
          }
        ]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].pollutants.NO2).toBeDefined()
      expect(result[0].pollutants.O3).toBeDefined()
      expect(result[0].pollutants.SO2).toBeDefined()
    })
  })

  describe('multiple pollutants on one site', () => {
    it('maps all matching pollutants', () => {
      const source = {
        member: [
          {
            pollutantsMetaData: {
              p1: {
                name: 'Nitrogen dioxide',
                startDate: '01/01/2020',
                endDate: '31/12/2023'
              },
              p2: {
                name: 'Ozone',
                startDate: '15/06/2019',
                endDate: null
              },
              p3: {
                name: 'PM<sub>2.5</sub> particulate matter (Hourly measured)',
                startDate: '10/03/2018',
                endDate: '20/11/2022'
              },
              p4: {
                name: 'PM<sub>10</sub> particulate matter (Daily measured)',
                startDate: '01/01/2017',
                endDate: '01/01/2021'
              }
            }
          }
        ]
      }
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(Object.keys(result[0].pollutants)).toEqual(
        expect.arrayContaining(['NO2', 'O3', 'PM25', 'GR10'])
      )
      expect(result[0].pollutants.NO2.startDate).toBe('2020-01-01')
      expect(result[0].pollutants.O3.endDate).toBeNull()
      expect(result[0].pollutants.PM25.startDate).toBe('2018-03-10')
      expect(result[0].pollutants.GR10.endDate).toBe('2021-01-01')
    })
  })

  describe('pollutantsMetaData entry with undefined properties', () => {
    it('handles pollutant entry where p is undefined-ish', () => {
      const source = {
        member: [
          {
            pollutantsMetaData: {
              p1: undefined
            }
          }
        ]
      }
      // mapPollutantCode receives undefined name => p?.name => undefined => test('')
      const result = frameSiteInfoData(source, { updated: fixedDate })
      expect(result[0].pollutants).toEqual({})
    })
  })

  describe('edge: no options argument', () => {
    it('works without options', () => {
      const source = { member: [{ siteName: 'X' }] }
      const result = frameSiteInfoData(source)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('X')
      expect(result[0].pollutants).toEqual({})
    })
  })
})
