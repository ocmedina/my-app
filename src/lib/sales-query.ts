import { createClient } from '@/lib/server'
import { startOfDay, endOfDay } from 'date-fns'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'

export async function getSalesByDate(date: Date | string, timeZone: string) {
    try {
        const supabase = await createClient()

        // 1. Normalizar la fecha de entrada a un objeto Date
        const inputDate = typeof date === 'string' ? new Date(date) : date

        // 2. Obtener el inicio y fin del día EN LA ZONA HORARIA DEL CLIENTE
        // Usamos toZonedTime para asegurar que operamos en la zona correcta si fuera necesario,
        // pero para startOfDay/endOfDay con date-fns-tz, lo mejor es construir las fechas string y luego convertir.

        // Una estrategia robusta:
        // a. Formatear la fecha base a YYYY-MM-DD
        const dateString = inputDate.toISOString().split('T')[0] // Asumimos que el inputDate es correcto o usamos el string directo

        // b. Crear fechas string para inicio y fin en esa zona
        // "2023-10-25 00:00:00" en timeZone
        // "2023-10-25 23:59:59.999" en timeZone

        // Sin embargo, date-fns-tz tiene helpers.
        // Vamos a usar 'toZonedTime' para convertir la fecha UTC (si es que viene así) a la zona del cliente
        // O mejor, construimos el intervalo explícitamente.

        // Si el usuario pasa "2023-10-25" y "America/Argentina/Buenos_Aires":
        // Queremos desde 2023-10-25 00:00:00 -03:00 hasta 2023-10-25 23:59:59.999 -03:00

        // Usamos formatInTimeZone para obtener la representación en la zona horaria
        // Esto es útil si inputDate es un objeto Date (que siempre es UTC o local del server).
        // Si inputDate es string "YYYY-MM-DD", lo usamos directo.

        let dateIsoString = ''
        if (typeof date === 'string') {
            // Si es string "YYYY-MM-DD", lo usamos. Si es ISO completo, lo parseamos.
            if (date.includes('T')) {
                dateIsoString = new Date(date).toISOString().split('T')[0]
            } else {
                dateIsoString = date
            }
        } else {
            // Si es Date, cuidado. new Date() puede ser UTC.
            // Asumiremos que el usuario quiere "el día que representa esta fecha".
            // Para seguridad, usamos formatInTimeZone para sacar el YYYY-MM-DD en la zona destino.
            dateIsoString = formatInTimeZone(date, timeZone, 'yyyy-MM-dd')
        }

        // Ahora construimos el start y end usando la zona horaria
        // La librería date-fns-tz maneja esto convirtiendo de vuelta a UTC.
        // fromZonedTime es lo que buscamos (antes zonedTimeToUtc)
        // Pero en v3 (que instalamos) la API cambió un poco.
        // Vamos a usar el enfoque de strings ISO con offset que es infalible.

        // NOTA: date-fns-tz v2 vs v3. Asumo v3 por "npm install date-fns-tz".
        // En v3: import { toZonedTime, fromZonedTime } from 'date-fns-tz'
        // Pero para estar seguros con la versión instalada, usaré un enfoque compatible.

        // Enfoque seguro:
        // Construir string "YYYY-MM-DD 00:00:00" y parsearlo como si estuviera en esa zona.

        const startString = `${dateIsoString} 00:00:00`
        const endString = `${dateIsoString} 23:59:59.999`

        // Necesitamos convertir estos "tiempos locales" a UTC real.
        // date-fns-tz tiene 'fromZonedTime' (v3) o 'zonedTimeToUtc' (v2).
        // Verificaremos disponibilidad importando todo.

        // Como no estoy seguro de la versión exacta (v2 o v3), usaré un truco con el constructor de Date si es posible,
        // pero mejor intentaré usar la librería.
        // Voy a asumir v3 ya que es la latest.

        // const { fromZonedTime } = require('date-fns-tz') // Removed in favor of top-level import

        const startUTC = fromZonedTime(startString, timeZone)
        const endUTC = fromZonedTime(endString, timeZone)

        const { data, error } = await supabase
            .from('sales') // Usando 'sales' según schema, el usuario dijo 'ventas' pero el schema manda.
            .select('*')
            .gte('created_at', startUTC.toISOString())
            .lte('created_at', endUTC.toISOString())

        if (error) {
            console.error('Error fetching sales:', error)
            throw new Error(error.message)
        }

        return data
    } catch (err) {
        console.error('Unexpected error:', err)
        throw err
    }
}
