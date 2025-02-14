/* eslint-disable prettier/prettier */
import * as geolib from 'geolib'
import OsGridRef from 'mt-osgridref'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'
const logger = createLogger()

function convertPointToLonLat(matches, location, index) {
  let lat = ''
  let lon = ''
  let point
  let pointNI
  if (location === 'uk-location') {
    point = new OsGridRef(
      // matches[index].GAZETTEER_ENTRY.GEOMETRY_X,
      // matches[index].GAZETTEER_ENTRY.GEOMETRY_Y
      matches.getOSPlaces[index].GAZETTEER_ENTRY.GEOMETRY_X,
      matches.getOSPlaces[index].GAZETTEER_ENTRY.GEOMETRY_Y
    )
    const latlon = OsGridRef.osGridToLatLong(point)
    lat = latlon._lat
    lon = latlon._lon
  } else {
    try {
      pointNI = new OsGridRef(
        matches[index].xCoordinate,
        matches[index].yCoordinate
      )
    } catch (error) {
      logger.error(
        `Failed to fetch convertPointToLonLat matches
        .reduce: ${JSON.stringify(error)}`
      )
    }
    const latlon = OsGridRef.osGridToLatLong(pointNI)
    lat = latlon._lat
    lon = latlon._lon
  }
  return { lat, lon }
}

function coordinatesTotal(matches) {
  let coordinates = []
  try {
    coordinates = matches.reduce((acc, current) => {
      return [
        ...acc,
        {
          latitude: current.location.coordinates[0],
          longitude: current.location.coordinates[1]
        }
      ]
    }, [])
  } catch (error) {
    logger.error(
      `Failed to fetch coordinatesTotal matches
      .reduce: ${JSON.stringify(error)}`
    )
  }
  return coordinates
}
// checks if 51.525/7.4575 is within a radius of 5 km(5000), 25 km(25000), 50 km(50000),100 km(100000) from 51.5175/7.4678
function pointsInRange(point1, point2, miles) {
  const isPoint = geolib.isPointWithinRadius(
    { latitude: point1.lat, longitude: point1.lon },
    { latitude: point2.latitude, longitude: point2.longitude },
    miles
    // 100000
  )
  return isPoint
}
function getNearLocation(lat, lon, measurementsCoordinates) {
  let getLocation
  try {
    if (lat && lon && measurementsCoordinates) {
      getLocation = geolib.findNearest(
        { latitude: lat.toString().trim(), longitude: lon.toString().trim() },
        measurementsCoordinates
      )
    }
  } catch (error) {
    logger.error(
      `Failed to fetch getNearLocation: ${JSON.stringify(error.message)}`
    )
  }
  if (!getLocation || !getLocation.latitude || !getLocation.longitude) {
    logger.error('getLocation is undefined or missing properties')
    return []
  }
  // const nearestLocation = forecasts?.filter((item) => {
  //   return (
  //     item.location.coordinates[0] === getLocation.latitude &&
  //     item.location.coordinates[1] === getLocation.longitude
  //   )
  // })
  return getLocation
}
export {
  pointsInRange,
  getNearLocation,
  convertPointToLonLat,
  coordinatesTotal
}
