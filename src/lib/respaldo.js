import { supabase } from './supabase';
import { capacidades, traerTodo } from './db';

const KEY = 'paupet_ultimo_respaldo';
export const DIAS_RECORDATORIO = 7;

// Tablas que se guardan en la copia, tal cual están en la base.
const TABLAS = ['clientes', 'visitas', 'turnos', 'notas', 'config'];

// Descarga TODA la base (sin filtros ni fusiones) a un archivo JSON.
// Devuelve cuántas filas tiene cada tabla, para mostrarlo.
export async function descargarRespaldo() {
  const tablas = [...TABLAS, ...(capacidades.fotos ? ['fotos_cliente'] : [])];
  const datos = {};
  for (const t of tablas) {
    datos[t] = await traerTodo(() => supabase.from(t).select('*').order('id', { ascending: true }));
  }
  const ahora = new Date();
  const archivo = {
    app: 'Paupet',
    version: 1,
    creado: ahora.toISOString(),
    cantidades: Object.fromEntries(Object.entries(datos).map(([t, filas]) => [t, filas.length])),
    datos,
  };
  const pad = n => String(n).padStart(2, '0');
  const nombre = `paupet_copia_${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}.json`;
  const url = URL.createObjectURL(new Blob([JSON.stringify(archivo, null, 1)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  try { localStorage.setItem(KEY, ahora.toISOString()); } catch { /* sin almacenamiento local */ }
  return archivo.cantidades;
}

// Fecha de la última copia descargada en ESTE dispositivo (o null).
export function ultimoRespaldo() {
  try { const v = localStorage.getItem(KEY); return v ? new Date(v) : null; } catch { return null; }
}

export function respaldoVencido() {
  const u = ultimoRespaldo();
  return !u || (Date.now() - u.getTime()) > DIAS_RECORDATORIO * 86400000;
}
