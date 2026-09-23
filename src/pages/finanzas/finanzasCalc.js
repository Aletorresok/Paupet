import { calcResumenMes } from '../dashboard/dashboardStats';

export const MES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

export const mesActual = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

// "2026-09" ± n meses
export const moverMes = (mes, n) => {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export { calcResumenMes };

// Ingresos y gastos de los últimos `n` meses hasta `mes` inclusive.
export function serieMeses(clientes, notas, mes, n = 6) {
  return Array.from({ length: n }, (_, i) => {
    const m = moverMes(mes, i - n + 1);
    const r = calcResumenMes(clientes, notas, m);
    return { mes: m, label: MES_CORTO[Number(m.slice(5)) - 1], ingresos: r.ingresos, gastos: r.egresos };
  });
}

const visitasDelMes = (clientes, mes) =>
  clientes.flatMap(c => (c.visitas || []).map(v => ({ ...v, dog: c.dog, owner: c.owner })))
    .filter(v => v.fecha && v.fecha.startsWith(mes));

// Servicios que más facturaron en el mes (agrupados por nombre, sin distinguir mayúsculas).
export function topServicios(clientes, mes, n = 5) {
  const grupos = new Map();
  visitasDelMes(clientes, mes).forEach(v => {
    const nombre = (v.servicio || 'Sin nombre').trim();
    const k = nombre.toLowerCase();
    const g = grupos.get(k) || { nombre, cantidad: 0, monto: 0 };
    g.cantidad += 1; g.monto += v.precio || 0;
    grupos.set(k, g);
  });
  return [...grupos.values()].sort((a, b) => b.monto - a.monto).slice(0, n);
}

// Gastos del mes agrupados por categoría.
export function gastosPorCategoria(notas, mes) {
  const grupos = new Map();
  notas.filter(n => n.tipo === 'egreso' && n.fecha && n.fecha.startsWith(mes)).forEach(n => {
    const cat = (n.categoria || 'Sin categoría').trim();
    grupos.set(cat, (grupos.get(cat) || 0) + (n.monto || 0));
  });
  return [...grupos.entries()].map(([categoria, monto]) => ({ categoria, monto })).sort((a, b) => b.monto - a.monto);
}

// CSV del mes (visitas + gastos) para abrir en Excel o Google Sheets.
export function csvDelMes(clientes, notas, mes) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const filas = [['Tipo', 'Fecha', 'Detalle', 'Cliente', 'Forma de pago', 'Monto']];
  visitasDelMes(clientes, mes).sort((a, b) => a.fecha.localeCompare(b.fecha))
    .forEach(v => filas.push(['Ingreso', v.fecha, v.servicio, `${v.dog} (${v.owner})`, v.forma_pago || 'efectivo', v.precio || 0]));
  notas.filter(n => n.tipo === 'egreso' && n.fecha && n.fecha.startsWith(mes))
    .forEach(n => filas.push(['Gasto', n.fecha, `${n.concepto}${n.categoria ? ' · ' + n.categoria : ''}`, '', '', -(n.monto || 0)]));
  return '﻿' + filas.map(f => f.map(esc).join(';')).join('\n');
}

export function descargarCsv(texto, nombre) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
