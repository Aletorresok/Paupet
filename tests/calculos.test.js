import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toISODate, diasDesde, parseFecha } from '../src/lib/utils.js';
import { calcFrecuencia, clientesParaVolver } from '../src/lib/frecuencia.js';
import { turnosQueSePisan, fechaSugerida, serviciosFrecuentes, ultimaVisita } from '../src/pages/calendario/ayudaTurno.js';
import { ocupadosPorAgenda, generarSlots } from '../src/pages/horarios/horariosUtils.js';
import { agendadoPorCobrar, ingresosHastaDia, serviciosPorDia, calcResumenMes } from '../src/pages/finanzas/finanzasCalc.js';
import { FILTROS, conFrecuencia, normalizar } from '../src/pages/clientes/filtrosClientes.js';

// Fecha "YYYY-MM-DD" a `n` días de hoy (negativo = pasado).
const dia = n => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return toISODate(d); };
const visitas = (...hace) => hace.map((n, i) => ({ id: i, fecha: dia(-n), precio: 1000, servicio: 'Baño' }));

test('diasDesde usa fechas locales', () => {
  assert.equal(diasDesde(dia(0)), 0);
  assert.equal(diasDesde(dia(-10)), 10);
  assert.equal(toISODate(parseFecha('2026-03-01')), '2026-03-01');
});

test('frecuencia: sin datos suficientes devuelve null', () => {
  assert.equal(calcFrecuencia([]), null);
  assert.equal(calcFrecuencia(visitas(10)), null);
  assert.equal(calcFrecuencia(visitas(10, 12)), null, 'intervalos de menos de 7 días no cuentan');
});

test('frecuencia: mediana de los intervalos y estado', () => {
  const f = calcFrecuencia(visitas(100, 70, 40, 10));
  assert.equal(f.cadaDias, 30);
  assert.equal(f.diasRestantes, 20);
  assert.equal(f.estado, 'al_dia');
  assert.equal(calcFrecuencia(visitas(120, 90, 60, 30)).estado, 'pronto', 'le toca hoy → pronto');
  const vencido = calcFrecuencia(visitas(100, 70, 40));
  assert.equal(vencido.estado, 'vencido');
});

test('clientesParaVolver excluye a los que ya tienen turno', () => {
  const clientes = [{ id: 1, visitas: visitas(100, 70, 40) }, { id: 2, visitas: visitas(100, 70, 40) }];
  const turnos = [{ clientId: 2, fecha: dia(3), estado: 'confirmed' }];
  assert.deepEqual(clientesParaVolver(clientes, turnos).map(x => x.cliente.id), [1]);
});

test('turnosQueSePisan respeta la duración y excluye el que se edita', () => {
  const f = dia(1);
  const turnos = [
    { id: 1, fecha: f, hora: '09:00', duracion: 90, estado: 'confirmed', dogName: 'Coco' },
    { id: 2, fecha: f, hora: '11:00', duracion: 60, estado: 'confirmed' },
    { id: 3, fecha: f, hora: '10:00', duracion: 60, estado: 'completed' },
  ];
  assert.deepEqual(turnosQueSePisan(turnos, { fecha: f, hora: '10:00', duracion: 60 }).map(t => t.id), [1]);
  assert.deepEqual(turnosQueSePisan(turnos, { fecha: f, hora: '10:30', duracion: 60 }).map(t => t.id), [2]);
  assert.deepEqual(turnosQueSePisan(turnos, { fecha: f, hora: '09:00', duracion: 60, excluirId: 1 }), []);
  assert.deepEqual(turnosQueSePisan(turnos, { fecha: f, hora: '', duracion: 60 }), []);
});

test('fechaSugerida nunca cae domingo ni antes de mañana', () => {
  for (let n = -5; n < 40; n++) {
    const f = fechaSugerida(dia(-10), n);
    assert.notEqual(parseFecha(f).getDay(), 0, `cae domingo con ${n}`);
    assert.ok(f >= dia(1), `antes de mañana con ${n}`);
  }
});

test('servicios frecuentes y última visita', () => {
  const clientes = [{ visitas: [{ servicio: 'Baño', fecha: '2026-01-01' }, { servicio: 'Corte', fecha: '2026-02-01' }] }, { visitas: [{ servicio: 'Baño ', fecha: '2026-01-05' }] }];
  assert.deepEqual(serviciosFrecuentes(clientes), ['Baño', 'Corte']);
  assert.equal(ultimaVisita(clientes[0]).servicio, 'Corte');
  assert.equal(ultimaVisita({}), null);
});

test('horarios: ocupados por la agenda y generación de horarios', () => {
  const turnos = [{ fecha: '2026-10-05', hora: '10:30', duracion: 90, dogName: 'Luna' }, { fecha: '2026-10-05', hora: '', dogName: 'Sin hora' }];
  assert.deepEqual(ocupadosPorAgenda(turnos, '2026-10-05', ['09:00', '10:30', '11:00', '12:00']), { '10:30': 'Luna', '11:00': 'Luna' });
  assert.deepEqual(ocupadosPorAgenda(turnos, '2026-10-06', ['10:30']), {});
  assert.deepEqual(generarSlots('09:00', '12:00', 60), ['09:00', '10:00', '11:00']);
  assert.deepEqual(generarSlots('09:00', '10:30', 45), ['09:00', '09:45']);
});

test('finanzas: agendado, comparación por día y días de la semana', () => {
  const turnos = [
    { fecha: '2026-09-20', precio: 100, estado: 'confirmed' },
    { fecha: '2026-09-28', precio: 200, estado: 'pending' },
    { fecha: '2026-09-29', precio: 300, estado: 'completed' },
    { fecha: '2026-10-01', precio: 400, estado: 'confirmed' },
  ];
  assert.deepEqual(agendadoPorCobrar(turnos, '2026-09', '2026-09-26'), { cantidad: 1, monto: 200 });
  const clientes = [{ visitas: [{ fecha: '2026-08-05', precio: 10 }, { fecha: '2026-08-26', precio: 20 }, { fecha: '2026-08-27', precio: 40 }] }];
  assert.equal(ingresosHastaDia(clientes, '2026-08', 26), 30);
  const porDia = serviciosPorDia(clientes, '2026-08');
  assert.equal(porDia[0].nombre, 'Lunes');
  assert.equal(porDia.find(d => d.nombre === 'Miércoles').cantidad, 2); // 5 y 26 de agosto de 2026
  assert.ok(!porDia.some(d => d.nombre === 'Domingo'), 'domingo sólo si tiene servicios');
});

test('resumen del mes: ingresos por medio de pago y ganancia', () => {
  const clientes = [{ visitas: [{ fecha: '2026-09-02', precio: 100, forma_pago: 'efectivo' }, { fecha: '2026-09-03', precio: 50, forma_pago: 'transferencia' }, { fecha: '2026-08-30', precio: 999 }] }];
  const notas = [{ tipo: 'egreso', fecha: '2026-09-10', monto: 30 }, { tipo: 'compra', fecha: '2026-09-10', monto: 1000 }];
  const r = calcResumenMes(clientes, notas, '2026-09');
  assert.deepEqual([r.ingresos, r.efectivo, r.transferencia, r.egresos, r.ganancia, r.servicios, r.ticket], [150, 100, 50, 30, 120, 2, 75]);
});

test('clientes: filtros rápidos y búsqueda sin tildes', () => {
  const clientes = [
    { id: 1, dog: 'Simón', visitas: visitas(100, 70, 40), inasistencias: 2, etiquetas: ['Muerde'] },
    { id: 2, dog: 'Luna', visitas: visitas(5), inasistencias: 0, etiquetas: [] },
    { id: 3, dog: 'Toby', visitas: visitas(200, 170), etiquetas: [], notes: 'Alergia al pollo' },
  ];
  const base = conFrecuencia(clientes, [{ clientId: 3, fecha: dia(2), estado: 'pending' }]);
  const ids = id => base.filter(FILTROS.find(f => f.id === id).test).map(c => c.id);
  assert.deepEqual(ids('volver'), [1], 'Toby tiene turno, no aparece');
  assert.deepEqual(ids('cuidados'), [1, 3]);
  assert.deepEqual(ids('faltaron'), [1]);
  assert.deepEqual(ids('nuevos'), [2]);
  assert.deepEqual(ids('perdidos'), [3]);
  assert.equal(normalizar('Simón'), 'simon');
});
