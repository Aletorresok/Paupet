import { crearDatosDemo } from './seed';
import { calcularHorariosLibres } from '../horariosLibres';

// Imitación en memoria del cliente de Supabase, SÓLO para el modo demo (`npm run demo`).
// Implementa lo que usa la app: from().select/insert/update/upsert/delete con eq/neq/order/
// range/limit/single, embebido "tabla(*)", storage, auth y rpc('horarios_libres').
// Nunca se conecta a internet: la base real no se toca.

const KEY = 'paupet_demo_db';

function cargar() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* sin almacenamiento local */ }
  return crearDatosDemo();
}

let db = cargar();
const guardar = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* lleno o bloqueado */ } };

export function reiniciarDemo() {
  db = crearDatosDemo();
  guardar();
  window.location.reload();
}

const copia = x => JSON.parse(JSON.stringify(x));
const errorTabla = t => ({ message: `relation "public.${t}" does not exist`, code: '42P01' });

// "*, visitas(*)" → embebidos ['visitas']
const embebidos = cols => [...(cols || '').matchAll(/(\w+)\(\*\)/g)].map(m => m[1]);
// clientes → cliente_id
const fkDe = tabla => tabla.replace(/s$/, '') + '_id';

class Consulta {
  constructor(tabla) {
    this.tabla = tabla; this.op = 'select'; this.cols = '*'; this.filtros = [];
    this.orden = []; this.rango = null; this.limite = null; this.unica = false;
    this.devolver = false;
  }
  select(cols = '*') { if (this.op === 'select') this.cols = cols; else { this.devolver = true; this.cols = cols; } return this; }
  insert(filas) { this.op = 'insert'; this.payload = filas; return this; }
  upsert(fila) { this.op = 'upsert'; this.payload = fila; return this; }
  update(campos) { this.op = 'update'; this.payload = campos; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(c, v) { this.filtros.push(r => r[c] == v); return this; }
  neq(c, v) { this.filtros.push(r => r[c] != v); return this; }
  order(c, { ascending = true } = {}) { this.orden.push([c, ascending]); return this; }
  range(a, b) { this.rango = [a, b]; return this; }
  limit(n) { this.limite = n; return this; }
  single() { this.unica = true; return this; }
  then(ok, mal) { return new Promise(r => setTimeout(r, 60)).then(() => this.ejecutar()).then(ok, mal); }

  filasFiltradas() { return db.tablas[this.tabla].filter(r => this.filtros.every(f => f(r))); }

  armarSalida(filas) {
    let out = copia(filas);
    for (const [c, asc] of [...this.orden].reverse()) {
      out.sort((a, b) => (a[c] ?? '') < (b[c] ?? '') ? (asc ? -1 : 1) : (a[c] ?? '') > (b[c] ?? '') ? (asc ? 1 : -1) : 0);
    }
    for (const emb of embebidos(this.cols)) {
      const hijos = db.tablas[emb] || [];
      const fk = fkDe(this.tabla);
      out = out.map(r => ({ ...r, [emb]: copia(hijos.filter(h => h[fk] === r.id)) }));
    }
    if (this.rango) out = out.slice(this.rango[0], this.rango[1] + 1);
    if (this.limite != null) out = out.slice(0, this.limite);
    if (this.unica) return out.length ? { data: out[0], error: null } : { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
    return { data: out, error: null };
  }

  ejecutar() {
    const t = this.tabla;
    if (!db.tablas[t]) return { data: null, error: errorTabla(t) };
    const ahora = new Date().toISOString();
    if (this.op === 'select') return this.armarSalida(this.filasFiltradas());
    if (this.op === 'insert') {
      const nuevas = (Array.isArray(this.payload) ? this.payload : [this.payload])
        .map(f => ({ created_at: ahora, ...f, id: ++db.ultimoId }));
      db.tablas[t].push(...nuevas);
      guardar();
      return this.devolver ? this.armarSalida(nuevas) : { data: null, error: null };
    }
    if (this.op === 'upsert') {
      const f = this.payload;
      const i = db.tablas[t].findIndex(r => r.id === f.id);
      if (i >= 0) db.tablas[t][i] = { ...db.tablas[t][i], ...f };
      else db.tablas[t].push({ created_at: ahora, ...f });
      guardar();
      return { data: null, error: null };
    }
    const afectadas = this.filasFiltradas();
    if (this.op === 'update') {
      afectadas.forEach(r => Object.assign(r, copia(this.payload)));
    } else {
      db.tablas[t] = db.tablas[t].filter(r => !afectadas.includes(r));
      if (t === 'clientes') {
        const ids = new Set(afectadas.map(r => r.id));
        db.tablas.visitas = db.tablas.visitas.filter(v => !ids.has(v.cliente_id));
        db.tablas.fotos_cliente = db.tablas.fotos_cliente.filter(v => !ids.has(v.cliente_id));
      }
    }
    guardar();
    return this.devolver ? this.armarSalida(afectadas) : { data: null, error: null };
  }
}

// Misma regla que la función SQL (ver lib/horariosLibres.js).
const horariosLibres = () => calcularHorariosLibres(db.tablas.config.find(c => c.id === 1), db.tablas.turnos, new Date(), db.tablas.pedidos_turno || []);

// Imitación de la función SQL pedir_turno (misma validación, sin el límite por hora).
function pedirTurno(p) {
  const tel = String(p.p_tel || '').replace(/\D/g, '');
  if (!String(p.p_perro || '').trim() || !String(p.p_duenio || '').trim()) return { data: null, error: { message: 'faltan_datos' } };
  if (tel.length < 8 || tel.length > 15) return { data: null, error: { message: 'telefono_invalido' } };
  db.tablas.pedidos_turno = db.tablas.pedidos_turno || [];
  const repetido = db.tablas.pedidos_turno.find(x => x.tel === tel && x.perro.toLowerCase() === p.p_perro.trim().toLowerCase()
    && (x.fecha || null) === (p.p_fecha || null) && (x.hora || null) === (p.p_hora || null) && Date.now() - new Date(x.created_at) < 1800000);
  if (repetido) return { data: repetido.id, error: null };
  const fila = {
    id: ++db.ultimoId, created_at: new Date().toISOString(), estado: 'nuevo', perro: p.p_perro.trim(), duenio: p.p_duenio.trim(), tel,
    raza: p.p_raza || '', tamanio: p.p_tamanio || '', vino_antes: p.p_vino_antes || '', servicios: p.p_servicios || '', notas: p.p_notas || '',
    fecha: p.p_fecha || null, hora: p.p_hora || null, preferencia: p.p_preferencia || '', fecha_prop: null, hora_prop: null, turno_id: null, avisado: false,
  };
  db.tablas.pedidos_turno.push(fila);
  guardar();
  return { data: fila.id, error: null };
}

const SESION = { user: { id: 'demo', email: 'demo@paupet.local' }, access_token: 'demo' };

export function crearSupabaseDemo() {
  let sesion = SESION;
  const oyentes = new Set();
  const avisar = () => oyentes.forEach(fn => fn(sesion ? 'SIGNED_IN' : 'SIGNED_OUT', sesion));
  const archivos = new Map();

  return {
    from: tabla => new Consulta(tabla),
    rpc: async (nombre, params = {}) => nombre === 'horarios_libres'
      ? { data: horariosLibres(), error: null }
      : nombre === 'pedir_turno' ? pedirTurno(params)
      : { data: null, error: { message: `function ${nombre} does not exist` } },
    storage: {
      from: () => ({
        upload: async (path, file) => { archivos.set(path, URL.createObjectURL(file)); return { data: { path }, error: null }; },
        getPublicUrl: path => ({ data: { publicUrl: archivos.get(path) || '' } }),
      }),
    },
    auth: {
      getSession: async () => ({ data: { session: sesion } }),
      onAuthStateChange: fn => { oyentes.add(fn); return { data: { subscription: { unsubscribe: () => oyentes.delete(fn) } } }; },
      signInWithPassword: async () => { sesion = SESION; avisar(); return { data: { session: sesion }, error: null }; },
      signOut: async () => { sesion = null; avisar(); return { error: null }; },
    },
  };
}
