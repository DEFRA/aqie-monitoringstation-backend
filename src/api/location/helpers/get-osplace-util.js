import { fetchData } from '~/src/api/location/helpers/fetch-data.js'
import { getNearestLocation } from '~/src/api/location/helpers/get-nearest-location.js'
import {
  milesequal,
  requestmileslice
} from '~/src/api/location/helpers/constants.js'

async function fetchmonitoringstation(request) {
  if (
    request.params.userLocation !== '' &&
    request.params.userLocation !== null &&
    request.params.userLocation !== "''"
  ) {
    // const url = config.get('OSPlaceApiUrl')
    const locationType = 'uk-location'
    const requestdata = request.params.userLocation //= 'DA16 1LT'//'London'
    // const userLocation = request.params.userLocation.toUpperCase() //= 'DA16 1LT'//'LONDON'
    const paramlocationresult = requestdata.split('&')
    const locationNameOrPostcode = paramlocationresult[0] // 'London Apprentice'
    const requestmiles = paramlocationresult[1]
    let milesparamresult = requestmiles.slice(requestmileslice, 8)
    milesparamresult = milesparamresult * milesequal // 1 miles equal to 1.609344 KM
    const miles = milesparamresult * 1000

    // const querystringresult = querystring.parse(paramlocationresult)

    const { getOSPlaces, getMeasurements } = await fetchData(
      locationType,
      locationNameOrPostcode,
      request,
      'h'
    )
    if (locationType === 'uk-location') {
      // let results  = getOSPlaces
      const selectedMatches = getOSPlaces

      const { finalnearestLocationsRange, latlon } = getNearestLocation(
        selectedMatches,
        getMeasurements?.measurements,
        locationType,
        miles,
        0
        // 'en'
      )
      if (latlon != null) {
        return finalnearestLocationsRange
      }
      return finalnearestLocationsRange
    }
  }
  return 'no data found'
}
export { fetchmonitoringstation }
