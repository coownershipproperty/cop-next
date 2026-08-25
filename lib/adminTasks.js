const MADRID_TIME_ZONE = 'Europe/Madrid'

function zonedParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MADRID_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]))
}

export function madridLocalToIso(dateValue, timeValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue || '') || !/^\d{2}:\d{2}$/.test(timeValue || '')) {
    throw new Error('Choose a valid date and time.')
  }

  const [year, month, day] = dateValue.split('-').map(Number)
  const [hour, minute] = timeValue.split(':').map(Number)
  const intended = Date.UTC(year, month - 1, day, hour, minute, 0)
  let estimate = intended

  // Resolve the Madrid UTC offset at the requested instant. Running twice
  // covers the offset change around daylight-saving boundaries.
  for (let pass = 0; pass < 2; pass += 1) {
    const shown = zonedParts(new Date(estimate))
    const shownAsUtc = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute, shown.second)
    estimate += intended - shownAsUtc
  }

  const result = new Date(estimate)
  const finalParts = zonedParts(result)
  if (finalParts.year !== year || finalParts.month !== month || finalParts.day !== day || finalParts.hour !== hour || finalParts.minute !== minute) {
    throw new Error('That local time does not exist in Madrid because of the daylight-saving change.')
  }
  return result.toISOString()
}

export function formatMadridDateTime(value) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: MADRID_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

export { MADRID_TIME_ZONE }
