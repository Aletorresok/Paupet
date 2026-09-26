// Datos ficticios para el modo demo. Se generan relativos a HOY para que siempre haya
// turnos de hoy, de mañana, clientes a los que "les toca volver", etc.
// Generador pseudoaleatorio con semilla fija: los mismos datos en cada reinicio del día.

function rng(semilla) {
  let a = semilla;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const masDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// [perro, dueño, raza, tamaño, pelaje, cada cuántos días viene (0 = vino una sola vez), etiquetas, notas]
const PERROS = [
  ['Coco', 'María García', 'Caniche', 'Pequeño', 'Blanco rizado', 30, ['Dócil'], 'Corte cachorro, orejas largas.'],
  ['Luna', 'Sofía Fernández', 'Golden Retriever', 'Grande', 'Dorado', 45, ['Miedo al secador'], 'Secar con toalla y aire frío.'],
  ['Toby', 'Julián Pereyra', 'Salchicha', 'Pequeño', 'Marrón', 35, [], ''],
  ['Milo', 'Carla Gómez', 'Yorkshire', 'Pequeño', 'Negro y fuego', 28, ['Nervioso/a'], 'Moño rosa siempre.'],
  ['Olivia', 'Lucía Martínez', 'Caniche', 'Pequeño', 'Gris', 21, ['Le gusta el moño'], ''],
  ['Simón', 'Diego Romero', 'Ovejero Alemán', 'Grande', 'Negro y fuego', 60, ['Muerde'], 'Usar bozal para las uñas.'],
  ['Frida', 'Valentina Díaz', 'Mestizo', 'Mediano', 'Atigrado', 42, [], ''],
  ['Rocco', 'Martín Suárez', 'Bulldog Francés', 'Pequeño', 'Atigrado', 50, ['Alergia: avena'], 'Shampoo hipoalergénico.'],
  ['Lola', 'Florencia Acosta', 'Shih Tzu', 'Pequeño', 'Blanco y marrón', 28, [], ''],
  ['Bruno', 'Pablo Benítez', 'Labrador', 'Grande', 'Chocolate', 56, [], 'Deslanado en primavera.'],
  ['Nina', 'Camila Herrera', 'Maltés', 'Pequeño', 'Blanco', 25, ['Alergia: pollo'], ''],
  ['Tango', 'Gustavo Molina', 'Schnauzer', 'Mediano', 'Sal y pimienta', 40, [], 'Corte schnauzer clásico.'],
  ['Mora', 'Agustina Ríos', 'Mestizo', 'Mediano', 'Negro', 45, ['Nervioso/a'], ''],
  ['Pancho', 'Roberto Castro', 'Salchicha', 'Pequeño', 'Negro y fuego', 60, [], ''],
  ['Kira', 'Micaela Luna', 'Golden Retriever', 'Grande', 'Crema', 35, [], ''],
  ['Uma', 'Natalia Ortiz', 'Caniche', 'Pequeño', 'Champagne', 24, ['Dócil'], ''],
  ['Felipe', 'Andrés Silva', 'Yorkshire', 'Pequeño', 'Gris y fuego', 30, [], ''],
  ['Chispa', 'Paula Medina', 'Mestizo', 'Pequeño', 'Blanco con manchas', 50, [], ''],
  ['Oreo', 'Tomás Aguirre', 'Border Collie', 'Mediano', 'Blanco y negro', 45, ['Miedo al secador'], ''],
  ['Canela', 'Rocío Vega', 'Cocker', 'Mediano', 'Dorado', 30, ['No tolera el agua caliente'], ''],
  ['Thor', 'Federico Sosa', 'Ovejero Alemán', 'Grande', 'Negro', 70, [], ''],
  ['Maya', 'Laura Paz', 'Schnauzer', 'Mediano', 'Negro', 35, [], ''],
  ['Pipo', 'Hernán Cabrera', 'Caniche', 'Pequeño', 'Blanco', 28, [], ''],
  ['Lupe', 'Daniela Rojas', 'Shih Tzu', 'Pequeño', 'Dorado', 21, [], ''],
  ['Zeus', 'Ignacio Méndez', 'Labrador', 'Grande', 'Negro', 0, [], 'Vino una vez, cliente nuevo.'],
  ['Mía', 'Carolina Ferreyra', 'Maltés', 'Pequeño', 'Blanco', 21, [], ''],
  ['Chocolate', 'Sergio Giménez', 'Mestizo', 'Mediano', 'Marrón', 90, [], ''],
  ['Pelusa', 'Mónica Ramírez', 'Gato Persa', 'Pequeño', 'Gris', 60, ['Nervioso/a'], 'Gata. Sólo baño.'],
  ['Duque', 'Esteban Ponce', 'Golden Retriever', 'Grande', 'Dorado', 40, [], ''],
  ['Jazmín', 'Gabriela Nieto', 'Caniche', 'Pequeño', 'Negro', 30, [], ''],
  ['Negrita', 'Alicia Domínguez', 'Mestizo', 'Pequeño', 'Negro', 45, [], ''],
  ['Rulo', 'María García', 'Caniche', 'Mediano', 'Marrón', 35, [], 'Hermano de Coco (misma dueña).'],
  ['Tita', 'Beatriz Luna', 'Yorkshire', 'Pequeño', 'Negro y fuego', 28, ['Alergia: '], ''],
  ['Firulais', 'Ramón Quiroga', 'Mestizo', 'Grande', 'Canela', 0, [], ''],
  ['Kiara', 'Victoria Arias', 'Bulldog Francés', 'Pequeño', 'Blanco', 38, [], ''],
  ['Benito', 'Lucas Figueroa', 'Salchicha', 'Pequeño', 'Arlequín', 32, [], ''],
];

const SERVICIOS = {
  Pequeño: [['Baño y corte', 0.55], ['Baño', 0.25], ['Corte de uñas', 0.1], ['Corte a tijera', 0.1]],
  Mediano: [['Baño y corte', 0.5], ['Baño', 0.3], ['Baño y corte de higiene', 0.2]],
  Grande: [['Baño', 0.45], ['Deslanado', 0.35], ['Baño y corte', 0.2]],
};
const PRECIO_BASE = { Pequeño: 19000, Mediano: 25000, Grande: 33000 };

export function crearDatosDemo() {
  const r = rng(20260926);
  const pick = arr => arr[Math.floor(r() * arr.length)];
  const pesado = opciones => { let x = r(); for (const [v, p] of opciones) { if ((x -= p) <= 0) return v; } return opciones[0][0]; };
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const hoyISO = iso(hoy);
  let id = 1000;

  const clientes = [], visitas = [], turnos = [], notas = [];
  const precioEn = (size, fecha, servicio) => {
    // ~3% de aumento por mes hacia atrás; redondeado a $500.
    const meses = (hoy - fecha) / (30 * 86400000);
    let p = PRECIO_BASE[size] / Math.pow(1.03, meses);
    if (servicio === 'Baño') p *= 0.75;
    if (servicio === 'Corte de uñas') p = 5000 / Math.pow(1.03, meses);
    if (servicio === 'Deslanado') p *= 1.15;
    p *= 0.92 + r() * 0.16;
    return Math.round(p / 500) * 500;
  };
  const tel = () => `11-${Math.floor(1000 + r() * 8999)}-${Math.floor(1000 + r() * 8999)}`;
  const telDe = {};

  PERROS.forEach(([dog, owner, raza, size, pelaje, cada, etiquetas, notes], i) => {
    const cid = ++id;
    telDe[owner] = telDe[owner] || tel();
    clientes.push({
      id: cid, dog, owner, raza, size, pelaje, tel: i % 11 === 10 ? '' : telDe[owner], notes, foto: null,
      inasistencias: [5, 12, 19].includes(i) ? 1 + (i % 2) : 0, etiquetas, created_at: masDias(hoy, -400).toISOString(),
    });
    // Visitas: desde hace ~12 meses cada `cada` días (±5). Algunos quedan "vencidos" a propósito.
    const vencido = i % 5 === 2;
    let f = masDias(hoy, -(300 + Math.floor(r() * 60)));
    const fin = masDias(hoy, vencido ? -(cada + 12) : -2);
    if (!cada) f = masDias(hoy, -(20 + Math.floor(r() * 40)));
    while (f <= fin) {
      if (f.getDay() !== 0) {
        const servicio = pesado(SERVICIOS[size]);
        visitas.push({
          id: ++id, cliente_id: cid, servicio, fecha: iso(f),
          precio: precioEn(size, f, servicio), forma_pago: r() < 0.4 ? 'transferencia' : 'efectivo',
          created_at: f.toISOString(),
        });
      }
      if (!cada) break;
      f = masDias(f, cada + Math.floor(r() * 11) - 5);
    }
  });

  // Un cliente cargado dos veces (la app los fusiona sin tocar la base).
  const dup = { ...clientes[0], id: ++id, notes: '' };
  clientes.push(dup);
  visitas.push({ id: ++id, cliente_id: dup.id, servicio: 'Corte de uñas', fecha: iso(masDias(hoy, -200)), precio: 3500, forma_pago: 'efectivo', created_at: '' });

  // Turnos completados de las últimas 3 semanas (espejo de sus visitas, como hace la app).
  visitas.filter(v => v.fecha >= iso(masDias(hoy, -21)) && v.fecha < hoyISO).forEach((v, k) => {
    const c = clientes.find(x => x.id === v.cliente_id);
    turnos.push({
      id: ++id, cliente_id: c.id, dog_name: c.dog, servicio: v.servicio, fecha: v.fecha,
      hora: pick(['09:00', '10:30', '12:00', '14:00', '15:30', '17:00']), precio: v.precio,
      estado: 'completed', from_portal: false, forma_pago: v.forma_pago, duracion: k % 3 ? 60 : 90, created_at: '',
    });
  });

  // Agenda: hoy, mañana y las próximas dos semanas (lunes a sábado).
  // Los "vencidos" (i % 5 === 2) quedan sin turno para que aparezcan en "Ya les toca volver".
  const libres = clientes.slice(0, PERROS.length).filter((c, i) => i % 5 !== 2);
  // Los perros de hoy no tienen otro turno futuro (así "Completar y cobrar" sugiere el próximo).
  let turnoIdx = 0;
  const deHoy = new Set();
  const agendar = (fecha, hora, estado, duracion = 60, sinHora = false) => {
    let c = libres[(turnoIdx++ * 7) % libres.length];
    if (iso(fecha) === hoyISO) deHoy.add(c.id);
    else while (deHoy.has(c.id)) c = libres[(turnoIdx++ * 7) % libres.length];
    const servicio = pesado(SERVICIOS[c.size]);
    turnos.push({
      id: ++id, cliente_id: c.id, dog_name: c.dog, servicio, fecha: iso(fecha), hora: sinHora ? '' : hora,
      precio: precioEn(c.size, fecha, servicio), estado, from_portal: false,
      forma_pago: 'efectivo', duracion, created_at: '',
    });
  };
  for (let d = 0; d <= 16; d++) {
    const fecha = masDias(hoy, d);
    if (fecha.getDay() === 0) continue;
    const sabado = fecha.getDay() === 6;
    const horas = sabado ? ['09:00', '10:30', '12:00'] : ['09:00', '10:30', '12:00', '14:30', '16:00', '17:30'];
    const cuantos = d === 0 ? 4 : d === 1 ? 3 : Math.max(1, Math.round(horas.length * (0.75 - d * 0.035)));
    horas.slice(0, cuantos).forEach((h, k) => {
      const estado = d < 3 ? (k % 3 === 2 ? 'pending' : 'confirmed') : (k % 2 ? 'pending' : 'confirmed');
      agendar(fecha, h, estado, h === '10:30' ? 90 : 60);
    });
    if (d === 2) agendar(fecha, '10:00', 'confirmed', 60);          // se pisa con el de las 09:00 (solape)
    if (d === 4) agendar(fecha, '', 'pending', 60, true);            // turno sin hora cargada
  }

  // Notas: lista de compras y gastos de los últimos 7 meses.
  const compra = (item, cantidad, precio, texto, completada = false) =>
    notas.push({ id: ++id, tipo: 'compra', item, cantidad, precio, notas_texto: texto, concepto: '', categoria: '', monto: 0, fecha: hoyISO, completada, created_at: masDias(hoy, -3).toISOString() });
  compra('Shampoo hipoalergénico 5L', 1, 38000, 'El de avena no (Rocco)');
  compra('Cuchillas #10 para la máquina', 2, 22000, 'Andis');
  compra('Toallas de microfibra', 6, 4500, '');
  compra('Moños y pañuelos', 30, 300, 'Colores pastel', true);
  compra('Perfume para perros', 2, 9000, '');
  const GASTOS = [['Alquiler del local', 'Alquiler', 150000], ['Luz', 'Servicios', 26000], ['Agua', 'Servicios', 7000],
    ['Insumos (shampoo, acondicionador)', 'Insumos', 45000], ['Monotributo', 'Impuestos', 32000], ['Internet', 'Servicios', 15000]];
  for (let m = 6; m >= 0; m--) {
    const base = new Date(hoy.getFullYear(), hoy.getMonth() - m, 1);
    GASTOS.forEach(([concepto, categoria, monto], k) => {
      const f = new Date(base.getFullYear(), base.getMonth(), 3 + k * 4);
      if (f > hoy) return;
      notas.push({ id: ++id, tipo: 'egreso', item: '', cantidad: 1, precio: 0, notas_texto: '', concepto, categoria,
        monto: Math.round(monto / Math.pow(1.03, m) / 100) * 100, fecha: iso(f), completada: false, created_at: f.toISOString() });
    });
    if (m % 3 === 1) notas.push({ id: ++id, tipo: 'egreso', item: '', cantidad: 1, precio: 0, notas_texto: '', concepto: 'Mantenimiento secador', categoria: 'Equipamiento', monto: 35000, fecha: iso(new Date(base.getFullYear(), base.getMonth(), 20)), completada: false, created_at: '' });
  }

  // Horarios para Stories: semana que viene publicada, con un par tomados.
  const lunes = masDias(hoy, ((8 - hoy.getDay()) % 7) || 7);
  const slots = {}, tomados = {};
  for (let k = 0; k < 6; k++) {
    const key = iso(masDias(lunes, k));
    slots[key] = k === 5 ? ['09:00', '10:30', '12:00'] : ['09:00', '10:30', '12:00', '14:30', '16:00', '17:30'];
    if (k % 2 === 0) tomados[key] = [slots[key][1]];
  }
  const config = [{
    id: 1, nombre: 'Paupet Peluquería', msg: '¡Hola! Reservá el turno de tu peludo. 🐾', anticip: 30,
    horarios: { domingo: { open: false, desde: '09:00', hasta: '13:00' } },
    // Horarios base de Configuración (para los días que no están en "Horarios para Stories").
    slots: Object.fromEntries(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].map(d => [d,
      (d === 'sabado' ? ['09:00', '10:30', '12:00'] : ['09:00', '10:30', '12:00', '14:30', '16:00', '17:30']).map(hora => ({ hora, duracion: 90 }))])),
    horarios_semanales: { semanaInicio: lunes.toISOString(), slots, diasActivos: [], tomados },
  }];

  // Pedidos de turno hechos en /turnos (todavía no son turnos).
  const digitos = t => (t || '').replace(/\D/g, '');
  const hace = horas => new Date(Date.now() - horas * 3600000).toISOString();
  const pedido = (extra) => ({ id: ++id, estado: 'nuevo', raza: '', tamanio: '', vino_antes: '', servicios: 'Baño y corte', notas: '',
    fecha: null, hora: null, preferencia: '', fecha_prop: null, hora_prop: null, turno_id: null, avisado: false, ...extra });
  const milo = clientes.find(c => c.dog === 'Milo'), maria = clientes.find(c => c.dog === 'Coco');
  const pedidos_turno = [
    pedido({ created_at: hace(2), perro: 'Milo', duenio: 'Carla', tel: digitos(milo.tel), raza: 'Yorkshire', tamanio: 'Chico',
      vino_antes: 'Sí, ya vino', fecha: iso(lunes), hora: '16:00', notas: 'Tiene nudos' }),
    pedido({ created_at: hace(5), perro: 'Pupa', duenio: 'Julieta Sosa', tel: '1155554444', raza: 'Caniche', tamanio: 'Chico',
      vino_antes: 'Es la primera vez', servicios: 'Baño', preferencia: 'martes o jueves, a la tarde', notas: 'Es cachorro' }),
    pedido({ created_at: hace(20), perro: 'Pompón', duenio: 'María', tel: digitos(maria.tel), raza: 'Caniche', tamanio: 'Chico',
      vino_antes: 'Es la primera vez', servicios: 'Baño + Corte de uñas', fecha: iso(masDias(lunes, 3)), hora: '14:30' }),
    pedido({ created_at: hace(30), estado: 'propuesto', perro: 'Tofu', duenio: 'Nicolás Paz', tel: '1166667777', raza: 'Mestizo',
      tamanio: 'Mediano', vino_antes: 'Es la primera vez', servicios: 'Deslanado', fecha: iso(lunes), hora: '09:00',
      fecha_prop: iso(masDias(lunes, 1)), hora_prop: '17:30' }),
  ];

  return { creado: hoyISO, ultimoId: id, tablas: { clientes, visitas, turnos, notas, config, fotos_cliente: [], pedidos_turno } };
}
