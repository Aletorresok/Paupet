import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// El Supabase falso guarda en localStorage: acá se simula con un objeto en memoria.
const almacen = new Map();
globalThis.localStorage = {
  getItem: k => almacen.get(k) ?? null,
  setItem: (k, v) => almacen.set(k, String(v)),
  removeItem: k => almacen.delete(k),
};

const { crearSupabaseDemo } = await import('../src/lib/demo/fakeSupabase.js');
const { crearDatosDemo } = await import('../src/lib/demo/seed.js');

let sb;
beforeEach(() => { sb = crearSupabaseDemo(); });

test('los datos demo tienen de todo un poco', () => {
  const d = crearDatosDemo();
  assert.ok(d.tablas.clientes.length > 30);
  assert.ok(d.tablas.visitas.length > 200);
  assert.ok(d.tablas.turnos.some(t => t.fecha === d.creado), 'hay turnos hoy');
  assert.ok(d.tablas.notas.some(n => n.tipo === 'egreso') && d.tablas.notas.some(n => n.tipo === 'compra'));
  assert.deepEqual(crearDatosDemo().tablas.clientes.map(c => c.dog), d.tablas.clientes.map(c => c.dog), 'misma semilla, mismos datos');
});

test('select con embebido, orden y rango', async () => {
  const { data, error } = await sb.from('clientes').select('*, visitas(*)').order('dog', { ascending: true }).range(0, 4);
  assert.equal(error, null);
  assert.equal(data.length, 5);
  assert.ok(Array.isArray(data[0].visitas));
  assert.ok(data.every(c => c.visitas.every(v => v.cliente_id === c.id)));
  assert.ok(data[0].dog.localeCompare(data[1].dog) <= 0);
});

test('insert → update → delete', async () => {
  const { data } = await sb.from('notas').insert({ tipo: 'compra', item: 'Test' }).select('id').single();
  assert.ok(data.id);
  await sb.from('notas').update({ completada: true }).eq('id', data.id);
  const leida = await sb.from('notas').select('*').eq('id', data.id).single();
  assert.equal(leida.data.completada, true);
  await sb.from('notas').delete().eq('id', data.id);
  const borrada = await sb.from('notas').select('*').eq('id', data.id);
  assert.equal(borrada.data.length, 0);
});

test('completar un turno sólo una vez (neq)', async () => {
  const { data: [t] } = await sb.from('turnos').select('*').neq('estado', 'completed').limit(1);
  const a = await sb.from('turnos').update({ estado: 'completed' }).eq('id', t.id).neq('estado', 'completed').select('id');
  const b = await sb.from('turnos').update({ estado: 'completed' }).eq('id', t.id).neq('estado', 'completed').select('id');
  assert.equal(a.data.length, 1);
  assert.equal(b.data.length, 0);
});

test('tabla inexistente da error (como detectarCapacidades espera)', async () => {
  const { error } = await sb.from('no_existe').select('id').limit(1);
  assert.ok(error);
});

test('horarios_libres no ofrece tomados ni pisados por un turno', async () => {
  const { data: cfg } = await sb.from('config').select('*').eq('id', 1).single();
  const { slots, tomados } = cfg.horarios_semanales;
  const { data: libres } = await sb.rpc('horarios_libres');
  assert.ok(libres.length > 0);
  const { data: turnos } = await sb.from('turnos').select('*');
  for (const { fecha, hora } of libres) {
    // Días cargados en Stories: sólo esos horarios; el resto sale de los horarios base de Configuración.
    if (slots[fecha]) assert.ok(slots[fecha].includes(hora));
    else assert.ok(cfg.slots[['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][new Date(fecha + 'T12:00').getDay()]].some(s => s.hora === hora));
    assert.ok(!(tomados[fecha] || []).includes(hora), `${fecha} ${hora} está tomado`);
    assert.ok(!turnos.some(t => t.fecha === fecha && t.hora === hora), `${fecha} ${hora} tiene turno`);
  }
});

test('auth: sesión demo y salir', async () => {
  assert.ok((await sb.auth.getSession()).data.session);
  let ultimo;
  sb.auth.onAuthStateChange((_e, s) => { ultimo = s; });
  await sb.auth.signOut();
  assert.equal(ultimo, null);
});
