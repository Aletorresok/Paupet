// Señas y saldo a favor: la plata que un cliente dejó por adelantado. Cada movimiento es
// { id, cliente_id, monto, tipo: 'sena'|'uso'|'devolucion', forma_pago, turno_id, visita_id, nota, fecha }.
// Seña = monto positivo; uso y devolución = monto negativo. El saldo es la suma.

export const saldoDe = movimientos => (movimientos || []).reduce((s, m) => s + (m.monto || 0), 0);

// Cuánto se descuenta del saldo en un cobro de `precio`, y cuánto queda por cobrar.
export function repartoCobro(saldo, precio, usar = true) {
  const descuento = usar && saldo > 0 && precio > 0 ? Math.min(saldo, precio) : 0;
  return { descuento, resto: Math.max(precio - descuento, 0), quedaAFavor: Math.max(saldo - descuento, 0) };
}

// Forma de pago a anotar en la visita: la del resto que se cobra; si todo salió del saldo, la de la última seña.
export function medioDeVisita(movimientos, restoMedio) {
  if (restoMedio) return restoMedio;
  const senas = (movimientos || []).filter(m => m.tipo === 'sena').sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || b.id - a.id);
  return senas[0]?.forma_pago || 'efectivo';
}

// Perros con saldo a favor y ningún turno por delante: hay que agendarles el próximo.
// `turnos` ya trae el clientId del perro que se muestra. Devuelve [{ cliente, saldo }], de más a menos saldo.
export function conSaldoSinTurno(clientes, turnos, hoy) {
  const conTurno = new Set(turnos.filter(t => t.estado !== 'completed' && t.fecha >= hoy).map(t => t.clientId));
  return clientes.filter(c => (c.saldo || 0) > 0 && !conTurno.has(c.id))
    .map(c => ({ cliente: c, saldo: c.saldo })).sort((a, b) => b.saldo - a.saldo);
}

// "Seña", "Usado en un cobro", "Devuelto": texto corto de un movimiento para la ficha.
export const textoMovimiento = m =>
  m.tipo === 'uso' ? 'Descontado en un cobro' : m.tipo === 'devolucion' ? 'Devuelto' : m.nota ? `Seña · ${m.nota}` : 'Seña';
