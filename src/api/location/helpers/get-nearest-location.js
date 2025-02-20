import * as geolib from 'geolib'
import {
  // getNearLocation,
  convertPointToLonLat,
  coordinatesTotal,
  pointsInRange
} from '~/src/api/location/helpers/location-util.js'
// import moment from 'moment-timezone'

function getNearestLocation(
  matches,
  measurements,
  location,
  miles,
  index
  // lang
) {
  const latlon =
    matches.length !== 0 ? convertPointToLonLat(matches, location, index) : {}
  const measurementsCoordinates =
    matches.length !== 0 ? coordinatesTotal(measurements) : []
  //   const nearestLocation =
  //     matches.length !== 0
  //       ? getNearLocation(latlon.lat, latlon.lon, measurementsCoordinates)
  //       : {}
  const orderByDistanceMeasurements = geolib.orderByDistance(
    { latitude: latlon.lat, longitude: latlon.lon },
    measurementsCoordinates
  )
  const nearestMeasurementsPoints = orderByDistanceMeasurements.slice(0, 40)
  const pointsToDisplay = nearestMeasurementsPoints.filter((p) =>
    pointsInRange(latlon, p, miles)
  )
  const nearestLocationsRangeCal = measurements?.filter((item) => {
    const opt = pointsToDisplay.some((dis) => {
      return (
        item.location.coordinates[0] === dis.latitude &&
        item.location.coordinates[1] === dis.longitude
      )
    })
    return opt
  })

  // TODO select and filter locations and pollutants which are not null or don't have exceptions
  const nearestLocationsRange = nearestLocationsRangeCal.reduce((acc, curr) => {
    const newpollutants = []
    let areaType
    const getDistance =
      geolib.getDistance(
        { latitude: latlon.lat, longitude: latlon.lon },
        {
          latitude: curr.location.coordinates[0],
          longitude: curr.location.coordinates[1]
        }
      ) * 0.000621371192

    areaType = curr.areaType.split(' ')
    areaType = areaType[1] + ' ' + areaType[0]

    Object.keys(curr.pollutants).forEach((pollutant) => {
      const pollutantname = pollutant
      // if(pollutantname == 'PM25' || pollutantname == 'GR25')
      // {
      //   pollutantname = 'PM2.5'
      // }
      // else if(pollutantname == 'MP10' || pollutantname == 'GE10' || pollutantname == 'GR10')
      // {
      //   pollutantname = 'PM10'
      // }

      // const polValue = curr.pollutants[pollutant].value
      // if (polValue !== null && polValue !== -99 && polValue !== '0') {
      //   const formatHour = moment(
      //     curr.pollutants[pollutant].time.date
      //   ).format('ha')
      //   const dayNumber = moment(curr.pollutants[pollutant].time.date).format(
      //     'D'
      //   )
      //   const yearNumber = moment(
      //     curr.pollutants[pollutant].time.date
      //   ).format('YYYY')
      //   const monthNumber = moment(
      //     curr.pollutants[pollutant].time.date
      //   ).format('MMMM')
      Object.assign(newpollutants, {
        [pollutant]: {
          pollutantname
          //   time: {
          //     date: curr.pollutants[pollutant].time.date,
          //     hour: formatHour,
          //     day: dayNumber,
          //     month: monthNumber,
          //     year: yearNumber
          //   }
        }
      })
      // }
    })
    if (Object.keys(newpollutants).length !== 0) {
      acc.push({
        region: curr.area,
        siteType: areaType, // curr.areaType,
        localSiteID: curr.localSiteID,
        location: {
          type: curr.location.type,
          coordinates: [
            curr.location.coordinates[0],
            curr.location.coordinates[1]
          ]
        },
        id: curr.name.replaceAll(' ', ''),
        name: curr.name,
        updated: curr.updated,
        distance: getDistance.toFixed(1),
        pollutants: { ...newpollutants }
      })
    }
    acc.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    return acc
  }, [])

  return { nearestLocationsRange, latlon }
}

export { getNearestLocation }
