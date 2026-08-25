import { EUROPE_COUNTRIES, INTERNATIONAL_COUNTRIES } from '@/lib/internationalDialCodes'

const DESTINATION_COUNTRY_PRIORITY = ['Spain', 'France', 'Italy', 'Portugal', 'England', 'Austria', 'Germany', 'Croatia', 'Sweden', 'USA', 'Mexico']

const priorityNationalities = ['United Kingdom', 'United States']
const europeanNationalities = EUROPE_COUNTRIES.filter((country) => country !== 'United Kingdom')
const otherNationalities = INTERNATIONAL_COUNTRIES.filter((country) => !priorityNationalities.includes(country))

export const NATIONALITY_GROUPS = [
  { label: 'UK & USA', countries: priorityNationalities },
  { label: 'Europe', countries: europeanNationalities },
  { label: 'Rest of the world', countries: otherNationalities },
]

export const ALL_NATIONALITIES = NATIONALITY_GROUPS.flatMap((group) => group.countries)

export function buildDestinationGroups(properties) {
  const byCountry = new Map()
  for (const property of properties || []) {
    const country = String(property.country || '').trim()
    const region = String(property.region || '').trim()
    if (!country || !region) continue
    if (!byCountry.has(country)) byCountry.set(country, new Set())
    byCountry.get(country).add(region)
  }
  if (!byCountry.has('Spain')) byCountry.set('Spain', new Set())
  byCountry.get('Spain').add('Balearics')

  return [...byCountry.entries()]
    .map(([country, regions]) => ({ country, regions: [...regions].sort((a, b) => a.localeCompare(b)) }))
    .sort((a, b) => {
      const aPriority = DESTINATION_COUNTRY_PRIORITY.indexOf(a.country)
      const bPriority = DESTINATION_COUNTRY_PRIORITY.indexOf(b.country)
      if (aPriority !== -1 || bPriority !== -1) return (aPriority === -1 ? 999 : aPriority) - (bPriority === -1 ? 999 : bPriority)
      return a.country.localeCompare(b.country)
    })
}

export function hasDestination(groups, value) {
  return Boolean(value) && groups.some((group) => group.regions.includes(value))
}
