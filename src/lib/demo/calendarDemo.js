// Calendario de Google de mentira para el modo demo: turnos marcados (🐶 o "turno") mezclados con
// cosas de la facultad y personales, en el mismo formato iCal que entrega Google.

const pad = n => String(n).padStart(2, '0');
const dia = (d, mas) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + mas); return `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}`; };
// Hora de Argentina (UTC−3) escrita en UTC, como la manda Google.
const utc = (fecha, hora) => `${fecha}T${pad(hora + 3)}0000Z`;

export function calendarioDemo(hoy = new Date()) {
  const evento = (uid, mas, desde, hasta, titulo) => ['BEGIN:VEVENT', `UID:demo-${uid}@google.com`,
    `DTSTART:${utc(dia(hoy, mas), desde)}`, `DTEND:${utc(dia(hoy, mas), hasta)}`, `SUMMARY:${titulo}`, 'END:VEVENT'];
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Google Inc//Google Calendar 70.9054//EN',
    ...evento('kira', 3, 15, 16, '🐶 Kira baño'),               // perro y servicio reconocidos: entra completo
    ...evento('rex', 4, 11, 12, '🐶 Rex (nuevo) baño y corte'),  // perro que no está cargado: por completar
    ...evento('nina', 5, 16, 17, 'Turno Nina'),                  // falta el servicio: por completar
    ...evento('parcial', 3, 18, 21, 'Parcial Análisis II'),
    ...evento('dentista', 4, 9, 10, 'Dentista'),
    'BEGIN:VEVENT', 'UID:demo-cumple@google.com', `DTSTART;VALUE=DATE:${dia(hoy, 6)}`, `DTEND;VALUE=DATE:${dia(hoy, 7)}`, 'SUMMARY:Cumple mamá', 'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
