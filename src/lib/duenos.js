// Dueños a partir de los clientes (cada cliente es un perro + su dueño). Se agrupan por nombre
// del dueño o por teléfono, igual que "Otros perros de…" en la ficha. No cambia la base: un perro
// nuevo de un dueño existente es otro cliente con el mismo nombre y teléfono de dueño.

export const normalizar = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const telCorto = s => (s || '').replace(/\D/g, '').slice(-8);

export function listaDuenos(clientes) {
  const grupos = [];
  for (const c of clientes) {
    const nombre = normalizar(c.owner), tel = telCorto(c.tel);
    if (!nombre && tel.length < 8) continue;
    const g = grupos.find(x => (nombre && x.claveNombre === nombre) || (tel.length >= 8 && x.claveTel === tel));
    if (g) {
      g.perros.push(c.dog);
      if (!g.tel && c.tel) { g.tel = c.tel; g.claveTel = tel; }
    } else {
      grupos.push({ owner: c.owner, tel: c.tel || '', claveNombre: nombre, claveTel: tel, perros: [c.dog] });
    }
  }
  return grupos
    .map(({ owner, tel, perros }) => ({ owner, tel, perros: [...new Set(perros)].sort((a, b) => a.localeCompare(b, 'es')) }))
    .sort((a, b) => (a.owner || '').localeCompare(b.owner || '', 'es'));
}

// Dueños que coinciden con lo escrito (nombre del dueño, teléfono o nombre de alguno de sus perros).
export function buscarDuenos(duenos, texto, max = 6) {
  const q = normalizar(texto);
  if (!q) return [];
  const digitos = texto.replace(/\D/g, '');
  return duenos.filter(d =>
    normalizar(d.owner).includes(q) ||
    d.perros.some(p => normalizar(p).includes(q)) ||
    (digitos.length >= 3 && (d.tel || '').replace(/\D/g, '').includes(digitos))
  ).slice(0, max);
}
