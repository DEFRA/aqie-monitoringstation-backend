/* eslint-disable prettier/prettier */
import * as geolib from 'geolib'

import {
  convertPointToLonLat,
  coordinatesTotal,
  pointsInRange,
  getNearLocation
} from '~/src/api/location/helpers/location-util.js'

jest.mock('mt-osgridref', () => {
  const osGridToLatLong = jest.fn().mockReturnValue({ _lat: 51.5, _lon: -0.1 })

  function OsGridRef(x, y) {
    this.x = x
    this.y = y
  }

  OsGridRef.osGridToLatLong = osGridToLatLong

  return {
    __esModule: true,
    default: OsGridRef
  }
})

jest.mock('~/src/api/common/helpers/logging/logger.js', () => {
  const error = jest.fn()
  const info = jest.fn()
  global.mockLogger = { error, info }
  return {
    createLogger: () => ({
      error,
      info
    })
  }
})

jest.mock('geolib')

describe('location-util', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('convertPointToLonLat', () => {
    it('should convert UK location using getOSPlaces', () => {
      const matches = {
        getOSPlaces: [
          {
            GAZETTEER_ENTRY: {
              GEOMETRY_X: 123,
              GEOMETRY_Y: 456
            }
          }
        ]
      }
      const result = convertPointToLonLat(matches, 'uk-location', 0)
      expect(result).toHaveProperty('lat')
      expect(result).toHaveProperty('lon')
    })

    it.skip('should convert non-UK location using x/y coordinates', () => {
      const matches = [
        {
          xCoordinate: 123,
          yCoordinate: 456
        }
      ]
      const result = convertPointToLonLat(matches, 'non-uk', 0)
      expect(result).toHaveProperty('lat')
      expect(result).toHaveProperty('lon')
    })

    it.skip('should log error if non-UK location throws', async () => {
      const { default: OsGridRef } = await import('mt-osgridref')
      OsGridRef.mockImplementation(() => {
        throw new Error('mock failure')
      })

      const matches = [
        {
          xCoordinate: 123,
          yCoordinate: 456
        }
      ]
      const result = convertPointToLonLat(matches, 'non-uk', 0)
      expect(global.mockLogger.error).toHaveBeenCalled()
      expect(result).toHaveProperty('lat')
      expect(result).toHaveProperty('lon')
    })
  })

  describe('coordinatesTotal', () => {
    it('should convert coordinates to lat/lon array', () => {
      const matches = [
        { location: { coordinates: [51.5, -0.1] } },
        { location: { coordinates: [52.5, -0.2] } }
      ]
      const result = coordinatesTotal(matches)
      expect(result).toEqual([
        { latitude: 51.5, longitude: -0.1 },
        { latitude: 52.5, longitude: -0.2 }
      ])
    })

    it('should log error and return empty array on exception', () => {
      const matches = null
      const result = coordinatesTotal(matches)
      expect(global.mockLogger.error).toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })

  describe('pointsInRange', () => {
    it('should return true if point is within radius', () => {
      geolib.isPointWithinRadius.mockReturnValue(true)
      const result = pointsInRange(
        { lat: 51.5, lon: -0.1 },
        { latitude: 51.5, longitude: -0.1 },
        1000
      )
      expect(result).toBe(true)
    })

    it('should return false if point is outside radius', () => {
      geolib.isPointWithinRadius.mockReturnValue(false)
      const result = pointsInRange(
        { lat: 51.5, lon: -0.1 },
        { latitude: 52.5, longitude: -0.2 },
        1000
      )
      expect(result).toBe(false)
    })
  })

  describe('getNearLocation', () => {
    it('should return nearest location if valid', () => {
      geolib.findNearest.mockReturnValue({ latitude: 51.5, longitude: -0.1 })
      const result = getNearLocation(51.5, -0.1, [
        { latitude: 51.5, longitude: -0.1 }
      ])
      expect(result).toEqual({ latitude: 51.5, longitude: -0.1 })
    })

    it('should return empty array if result is missing lat/lon', () => {
      geolib.findNearest.mockReturnValue({})
      const result = getNearLocation(51.5, -0.1, [
        { latitude: 51.5, longitude: -0.1 }
      ])
      expect(global.mockLogger.error).toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it('should log error and return empty array if geolib throws', () => {
      geolib.findNearest.mockImplementation(() => {
        throw new Error('fail')
      })
      const result = getNearLocation(51.5, -0.1, [
        { latitude: 51.5, longitude: -0.1 }
      ])
      expect(global.mockLogger.error).toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })
})
