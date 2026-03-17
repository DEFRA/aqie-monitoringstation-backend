/**
 * Transform source SiteMetaData API payload into result API structure.
 * File: src/api/location/helpers/frame-siteinfo-data.js
 */

const POLLUTANT_RULES = [
  {
    code: 'PM25',
    test: (n) =>
      /^PM<sub>2\.5<\/sub> particulate matter \(Hourly measured\)$/i.test(n)
  },
  {
    code: 'GR25',
    test: (n) =>
      /^PM<sub>2\.5<\/sub> particulate matter \(Daily measured\)$/i.test(n)
  },
  {
    code: 'GR25U',
    test: (n) => /^Daily measured PM<sub>2\.5<\/sub> \(uncorrected\)$/i.test(n)
  },
  {
    code: 'GE10',
    test: (n) =>
      /^PM<sub>10<\/sub> particulate matter \(Hourly measured\)$/i.test(n)
  },
  {
    code: 'GR10',
    test: (n) =>
      /^PM<sub>10<\/sub> particulate matter \(Daily measured\)$/i.test(n)
  },
  {
    code: 'GR10U',
    test: (n) => /^Daily measured PM<sub>10<\/sub> \(uncorrected\)$/i.test(n)
  },
  { code: 'NO2', test: (n) => /^Nitrogen dioxide$/i.test(n) },
  { code: 'SO2', test: (n) => /^Sulphur dioxide$/i.test(n) },
  { code: 'O3', test: (n) => /^Ozone$/i.test(n) }
]

function toIsoDate(ddmmyyyy) {
  if (!ddmmyyyy) return null
  const [dd, mm, yyyy] = String(ddmmyyyy).split('/')
  if (!dd || !mm || !yyyy) return null
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function mapPollutantCode(name) {
  const rule = POLLUTANT_RULES.find((r) => r.test(name || ''))
  return rule ? rule.code : null
}

function buildPollutants(pollutantsMetaData = {}, includeMissingCodes = []) {
  const out = {}

  //   Object.values(pollutantsMetaData).forEach((p) => {
  Object.values(pollutantsMetaData ?? {}).forEach((p) => {
    const code = mapPollutantCode(p?.name)
    if (!code) return

    out[code] = {
      startDate: toIsoDate(p.startDate),
      endDate: toIsoDate(p.endDate)
    }
  })

  includeMissingCodes.forEach((code) => {
    if (!out[code]) {
      out[code] = { startDate: null, endDate: null }
    }
  })

  return out
}

/**
 * @param {object} sourceApiJson full source payload
 * @param {object} options
 * @param {string | Function} [options.updated] fixed ISO string or function(site)=>ISO string
 * @param {string[]} [options.includeMissingCodes] e.g. ['GR10']
 * @returns {Array<object>}
 */
function frameSiteInfoData(sourceApiJson, options = {}) {
  const members = Array.isArray(sourceApiJson?.member)
    ? sourceApiJson.member
    : []

  return members.map((site) => {
    const updated =
      typeof options.updated === 'function'
        ? options.updated(site)
        : (options.updated ?? new Date().toISOString())

    return {
      name: site.siteName ?? null,
      area: site.governmentRegion ?? null,
      localSiteID: site.localSiteId ?? null,
      areaType: `${site.siteType || ''} ${site.areaType || ''}`.trim() || null,
      location: {
        type: 'Point',
        // kept as [latitude, longitude] to match your sample output
        coordinates: [Number(site.latitude), Number(site.longitude)]
      },
      updated,
      pollutants: buildPollutants(
        site.pollutantsMetaData,
        options.includeMissingCodes ?? []
      )
    }
  })
}

export { frameSiteInfoData }
