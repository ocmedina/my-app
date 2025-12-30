const { fromZonedTime } = require('date-fns-tz');

// Simular inputs
const date = '2023-10-25';
const timeZone = 'America/Argentina/Buenos_Aires';

console.log('--- Verificación de Lógica de Zona Horaria ---');
console.log(`Fecha seleccionada: ${date}`);
console.log(`Zona Horaria del Cliente: ${timeZone}`);

// 1. Construir inicio y fin del día en la zona horaria local
const startString = `${date} 00:00:00`;
const endString = `${date} 23:59:59.999`;

console.log(`\nInicio Local: ${startString}`);
console.log(`Fin Local:    ${endString}`);

// 2. Convertir a UTC (lo que se envía a Supabase)
const startUTC = fromZonedTime(startString, timeZone);
const endUTC = fromZonedTime(endString, timeZone);

console.log(`\n--- Conversión a UTC (para Supabase) ---`);
console.log(`Inicio UTC: ${startUTC.toISOString()}`);
console.log(`Fin UTC:    ${endUTC.toISOString()}`);

console.log('\nExplicación:');
console.log('Si son las 21:30 en Buenos Aires (UTC-3), en UTC son las 00:30 del día siguiente.');
console.log('Sin este ajuste, una venta a las 21:30 se guardaría como "mañana" en UTC.');
console.log('Con este ajuste, buscamos desde las 03:00 UTC (00:00 local) hasta las 03:00 UTC del día siguiente (00:00 local), cubriendo todo el día local correctamente.');
