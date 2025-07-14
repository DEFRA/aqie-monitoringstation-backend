import * as geolib from 'geolib'
import {
  convertPointToLonLat,
  coordinatesTotal,
  pointsInRange
} from '~/src/api/location/helpers/location-util.js'
import {
  geolibgetDistance,
  distanceMeasurements
} from '~/src/api/location/helpers/constants.js'

function getNearestLocation(matches, measurements, location, miles, index) {
  const latlon =
    matches.length !== 0 ? convertPointToLonLat(matches, location, index) : {}
  const measurementsCoordinates =
    matches.length !== 0 ? coordinatesTotal(measurements) : []
  const orderByDistanceMeasurements = geolib.orderByDistance(
    { latitude: latlon.lat, longitude: latlon.lon },
    measurementsCoordinates
  )
  const nearestMeasurementsPoints = orderByDistanceMeasurements.slice(
    0,
    distanceMeasurements
  )
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

  // select and filter locations and pollutants which are not null or don't have exceptions
  const nearestLocationsRange = nearestLocationsRangeCal.reduce((acc, curr) => {
    const newpollutants = []
    const getDistance =
      geolib.getDistance(
        { latitude: latlon.lat, longitude: latlon.lon },
        {
          latitude: curr.location.coordinates[0],
          longitude: curr.location.coordinates[1]
        }
      ) * geolibgetDistance

    const [first, second] = curr.areaType.split(' ')
    const areaType = `${second} ${first}`

    Object.keys(curr.pollutants).forEach((pollutant) => {
      let pollutantname = pollutant
      const pollutantData = curr.pollutants[pollutant]
      const { value, startDate, endDate } = pollutantData

      const isValuePositive = value > 0
      const isEndDateValid = endDate === null || endDate > '2017-12-31'
      const isValueMissingWithStart = value === null && startDate !== null
      if (
        (isValuePositive && isEndDateValid) ||
        (isValueMissingWithStart && isEndDateValid)
      ) {
        const pollutantAliases = {
          PM25: 'PM2.5',
          GR25: 'PM2.5',
          MP10: 'PM10',
          GE10: 'PM10',
          GR10: 'PM10',
          NO2: 'Nitrogen dioxide',
          O3: 'Ozone',
          SO2: 'Sulphur dioxide'
        }
        pollutantname = pollutantAliases[pollutantname] || pollutantname
        Object.assign(newpollutants, {
          [pollutant]: {
            pollutantname
          }
        })
      }
    })
    if (curr.localSiteID !== undefined) {
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
    }
    acc.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    return acc
  }, [])

  const finalnearestLocationsRange = nearestLocationsRange.reduce(
    (acc, curr) => {
      const pollutantname = []
      const order = [
        'PM2.5',
        'PM10',
        'Nitrogen dioxide',
        'Ozone',
        'Sulphur dioxide'
      ]
      Object.keys(curr.pollutants).forEach((pollutant) => {
        pollutantname.push(curr.pollutants[pollutant].pollutantname)
      })
      const uniqueArray = [...new Set(pollutantname)]
      uniqueArray.sort((a, b) => order.indexOf(a) - order.indexOf(b))
      acc.push({
        region: curr.region,
        siteType: curr.siteType, // curr.areaType,
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
        distance: curr.distance,
        pollutants: uniqueArray // { ...newpollutants }
      })
      return acc
    },
    []
  )
  return { finalnearestLocationsRange, latlon }
}

export { getNearestLocation }
