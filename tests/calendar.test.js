import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esTurno, leerEventos, turnosDelCalendario } from '../src/lib/ical.js';
import { firma, limpiarTitulo, planSync, porCompletar, reconocer } from '../src/lib/calendarSync.js';
import { calendarioDemo } from '../src/lib/demo/calendarDemo.js';

const ev = (lineas) => ['BEGIN:VEVENT', ...lineas, 'END:VEVENT'].join('\r\n');
const ics = (...eventos) => ['BEGIN:VCALENDAR', 'VERSION:2.0', ...eventos, 'END:VCALENDAR'].join('\r\n');
const AHORA = new Date('2026-11-14T15:00:00-03:00');

test('qué es un turno: el emoji del perro o la palabra turno', () => {
  for (const t of ['🐶 Coco baño', 'Coco 🐶', 'Turno Luna', 'luna - TURNO', 'turnos: Rex y Kira']) assert.ok(esTurno(t), t);
  for (const t of ['Parcial Análisis II', 'Cumple mamá', 'Nocturno en el club', 'Turnover del equipo', '', undefined]) assert.ok(!esTurno(t), String(t));
});

test('lee horas en UTC, con zona y de todo el día', () => {
  const [utc, local, dia] = leerEventos(ics(
    ev(['UID:a@google.com', 'DTSTART:20261116T130000Z', 'DTEND:20261116T143000Z', 'SUMMARY:🐶 Coco baño']),
    ev(['UID:b@google.com', 'DTSTART;TZID=America/Argentina/Buenos_Aires:20261117T093000', 'DTEND;TZID=America/Argentina/Buenos_Aires:20261117T103000', 'SUMMARY:Turno\\, Luna']),
    ev(['UID:c@google.com', 'DTSTART;VALUE=DATE:20261118', 'DTEND;VALUE=DATE:20261119', 'SUMMARY:turno Rex']),
  ));
  assert.deepEqual([utc.fecha, utc.hora, utc.duracion], ['2026-11-16', '10:00', 90]);
  assert.deepEqual([local.fecha, local.hora, local.duracion, local.titulo], ['2026-11-17', '09:30', 60, 'Turno, Luna']);
  assert.deepEqual([dia.fecha, dia.hora, dia.duracion], ['2026-11-18', '', 60]);
});

test('una hora UTC de madrugada cae en el día anterior de Argentina', () => {
  const [e] = leerEventos(ics(ev(['UID:a', 'DTSTART:20261117T010000Z', 'DTEND:20261117T020000Z', 'SUMMARY:🐶 x'])));
  assert.deepEqual([e.fecha, e.hora], ['2026-11-16', '22:00']);
});

test('une las líneas cortadas del archivo', () => {
  const [e] = leerEventos(ics(ev(['UID:a', 'DTSTART:20261116T130000Z', 'SUMMARY:🐶 Coco baño y corte de', '  higiene'])));
  assert.equal(e.titulo, '🐶 Coco baño y corte de higiene');
});

test('sólo quedan los turnos: ni lo personal, ni lo pasado, ni lo cancelado, ni lo que se repite', () => {
  const r = turnosDelCalendario(ics(
    ev(['UID:si', 'DTSTART:20261116T130000Z', 'DTEND:20261116T140000Z', 'SUMMARY:🐶 Coco baño']),
    ev(['UID:facu', 'DTSTART:20261116T130000Z', 'SUMMARY:Parcial Análisis II']),
    ev(['UID:viejo', 'DTSTART:20261110T130000Z', 'SUMMARY:🐶 Luna']),
    ev(['UID:lejos', 'DTSTART:20270601T130000Z', 'SUMMARY:🐶 Luna']),
    ev(['UID:cancelado', 'DTSTART:20261116T150000Z', 'STATUS:CANCELLED', 'SUMMARY:🐶 Rex']),
    ev(['UID:fijo', 'DTSTART:20261001T130000Z', 'RRULE:FREQ=WEEKLY', 'SUMMARY:turno fijo Kira']),
  ), AHORA);
  assert.deepEqual(r.eventos.map(e => e.uid), ['si']);
  assert.equal(r.repetidos, 1);
  assert.equal(r.desde, '2026-11-14');
  assert.throws(() => turnosDelCalendario('<html>login</html>', AHORA));
});

const clientes = [
  { id: 1, dog: 'Coco', owner: 'María García' }, { id: 2, dog: 'Luna', owner: 'Sofía Fernández' },
  { id: 3, dog: 'Luna', owner: 'Pedro Gómez' }, { id: 4, dog: 'Mía', owner: 'Carolina Ferreyra' },
];
const servicios = ['Baño', 'Baño y corte', 'Corte de uñas'];

test('saca la marca del título', () => {
  assert.equal(limpiarTitulo('🐶 Turno: Coco baño'), 'Coco baño');
  assert.equal(limpiarTitulo('Coco baño - turno'), 'Coco baño');
  assert.equal(limpiarTitulo('🐶'), '');
});

test('reconoce el perro y el servicio del título', () => {
  assert.deepEqual(reconocer('🐶 coco baño y corte', clientes, servicios), { clientId: 1, servicio: 'Baño y corte', nombre: 'Coco' });
  assert.deepEqual(reconocer('Turno mia BAÑO', clientes, servicios), { clientId: 4, servicio: 'Baño', nombre: 'Mía' });
  assert.deepEqual(reconocer('🐶 Coco deslanado', clientes, servicios), { clientId: 1, servicio: 'Deslanado', nombre: 'Coco' });
  assert.deepEqual(reconocer('🐶 Coco', clientes, servicios), { clientId: 1, servicio: '', nombre: 'Coco' });
});

test('si no sabe qué perro es, no adivina', () => {
  assert.deepEqual(reconocer('🐶 Luna baño', clientes, servicios), { clientId: null, servicio: 'Baño', nombre: 'Luna' });
  assert.equal(reconocer('🐶 Luna de Pedro baño', clientes, servicios).clientId, 3);
  assert.deepEqual(reconocer('🐶 Rex corte de uñas', clientes, servicios), { clientId: null, servicio: 'Corte de uñas', nombre: 'Rex' });
  assert.equal(reconocer('🐶 Cocodrilo', clientes, servicios).clientId, null);
  assert.equal(reconocer('🐶', clientes, servicios).nombre, 'Turno de Calendar');
});

test('plan: crea lo nuevo, mueve lo que cambió en Calendar y marca lo que ya no está', () => {
  const cal = { desde: '2026-11-14', hasta: '2027-03-14', eventos: [
    { uid: 'nuevo', titulo: '🐶 Coco baño', fecha: '2026-11-16', hora: '10:00', duracion: 60 },
    { uid: 'igual', titulo: '🐶 Mía', fecha: '2026-11-17', hora: '09:00', duracion: 60 },
    { uid: 'movido', titulo: '🐶 Mía', fecha: '2026-11-19', hora: '11:00', duracion: 90 },
    { uid: 'cobrado', titulo: '🐶 Mía', fecha: '2026-11-14', hora: '12:00', duracion: 60 },
    { uid: 'borrado-en-paupet', titulo: '🐶 Coco', fecha: '2026-11-20', hora: '09:00', duracion: 60 },
  ] };
  const turnos = [
    // Pau lo pasó a las 15 en Paupet; en Calendar sigue igual que cuando entró: no se toca.
    { id: 10, gcalUid: 'igual', gcalInicio: '2026-11-17 09:00 60', fecha: '2026-11-17', hora: '15:00', estado: 'confirmed' },
    { id: 11, gcalUid: 'movido', gcalInicio: '2026-11-18 11:00 60', fecha: '2026-11-18', hora: '11:00', estado: 'confirmed' },
    { id: 12, gcalUid: 'cobrado', gcalInicio: '2026-11-14 09:00 60', fecha: '2026-11-14', hora: '09:00', estado: 'completed' },
    { id: 13, gcalUid: 'ya-no-esta', gcalInicio: 'x', fecha: '2026-11-21', hora: '09:00', estado: 'confirmed' },
    { id: 14, gcalUid: 'viejo', gcalInicio: 'x', fecha: '2026-11-01', hora: '09:00', estado: 'confirmed' },
    { id: 15, fecha: '2026-11-16', hora: '12:00', estado: 'confirmed' },
  ];
  const plan = planSync(cal, turnos, clientes, servicios, ['borrado-en-paupet', 'evento-viejo']);
  assert.deepEqual(plan.crear.map(e => [e.uid, e.clientId, e.servicio]), [['nuevo', 1, 'Baño']]);
  assert.deepEqual(plan.mover, [{ id: 11, fecha: '2026-11-19', hora: '11:00', duracion: 90, gcalInicio: '2026-11-19 11:00 90' }]);
  assert.deepEqual(plan.faltan.map(t => t.id), [13]);
  assert.deepEqual(plan.ignorados, ['borrado-en-paupet']);
  assert.equal(firma(cal.eventos[0]), '2026-11-16 10:00 60');
});

test('por completar: importado, sin cobrar y sin perro o sin servicio', () => {
  assert.ok(porCompletar({ gcalUid: 'a', clientId: null, servicio: 'Baño' }));
  assert.ok(porCompletar({ gcalUid: 'a', clientId: 1, servicio: '' }));
  assert.ok(!porCompletar({ gcalUid: 'a', clientId: 1, servicio: 'Baño' }));
  assert.ok(!porCompletar({ gcalUid: 'a', clientId: null, servicio: '', estado: 'completed' }));
  assert.ok(!porCompletar({ clientId: null, servicio: '' }));
});

test('el calendario demo mezcla turnos con cosas personales y sólo entran los turnos', () => {
  const r = turnosDelCalendario(calendarioDemo(AHORA), AHORA);
  assert.equal(r.eventos.length, 3);
  assert.ok(r.eventos.every(e => esTurno(e.titulo) && e.hora));
});
