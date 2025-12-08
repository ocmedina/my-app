import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'

/**
 * Calculates the UTC start and end times for a given date in a specific timezone.
 * Useful for querying databases that store timestamps in UTC (like Supabase)
 * based on a user's local "day".
 * 
 * @param date - The date to query (Date object or "YYYY-MM-DD" string)
 * @param timeZone - The user's timezone (e.g., "America/Argentina/Buenos_Aires")
 * @returns Object containing startUTC and endUTC ISO strings
 */
export function getUTCInterval(date: Date | string, timeZone: string) {
    let dateIsoString = ''

    if (typeof date === 'string') {
        // If it's a string "YYYY-MM-DD", use it directly.
        if (date.includes('T')) {
            dateIsoString = new Date(date).toISOString().split('T')[0]
        } else {
            dateIsoString = date
        }
    } else {
        // If it's a Date object, format it to YYYY-MM-DD in the target timezone
        dateIsoString = formatInTimeZone(date, timeZone, 'yyyy-MM-dd')
    }

    // Construct start and end of day in the LOCAL timezone
    const startString = `${dateIsoString} 00:00:00`
    const endString = `${dateIsoString} 23:59:59.999`

    // Convert these local times to UTC
    const startUTC = fromZonedTime(startString, timeZone)
    const endUTC = fromZonedTime(endString, timeZone)

    return {
        startUTC: startUTC.toISOString(),
        endUTC: endUTC.toISOString()
    }
}
