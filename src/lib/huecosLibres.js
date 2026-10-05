// Huecos libres para Pau (Hoy, Nuevo turno y Agenda): una sola regla, ver REDISENO.md.
// Es la de /turnos (`calcularHorariosLibres`: lo cargado en "Horarios para Stories" menos tomados, días
// apagados y lo que se pisa con un turno), salvo que acá los horarios pedidos por clientes NO se descartan.
// Sin horarios cargados ese día, no hay huecos.
import { calcularHorariosLibres } from './horariosLibres';
import { aHora, aMinutos } from './duracion';

// `config` es el de la app (con `horariosSemanales`).
export function horariosLibresPau(config, turnos, ahora = new Date()) {
  return calcularHorariosLibres({ horarios_semanales: config?.horariosSemanales }, turnos, ahora);
}

// Huecos de un día, juntando horarios libres seguidos: [{ hora, hasta, minutos }].
// Cada hueco va desde un horario libre hasta el próximo turno u horario no libre o, si no hay, una hora
// después del último horario cargado ese día.
export function huecosDelDia(config, turnos, fecha, ahora = new Date()) {
  const libres = horariosLibresPau(config, turnos, ahora).filter(x => x.fecha === fecha).map(x => aMinutos(x.hora));
  if (!libres.length) return [];
  const cargados = (config?.horariosSemanales?.slots?.[fecha] || []).map(aMinutos);
  const finDia = Math.max(...cargados, ...libres) + 60;
  // Un hueco termina en el próximo turno o en el próximo horario cargado que no está libre (p. ej. tomado).
  const inicios = [
    ...turnos.filter(t => t.fecha === fecha && t.hora).map(t => aMinutos(t.hora)),
    ...cargados.filter(m => !libres.includes(m)),
  ];
  const huecos = [];
  libres.sort((a, b) => a - b).forEach(desde => {
    const anterior = huecos[huecos.length - 1];
    if (anterior && desde < aMinutos(anterior.hasta)) return;
    const fin = Math.min(finDia, ...inicios.filter(i => i > desde));
    huecos.push({ hora: aHora(desde), hasta: aHora(fin), minutos: fin - desde });
  });
  return huecos;
}

