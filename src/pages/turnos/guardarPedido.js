import { supabase } from '../../lib/supabase';
import { describirCuando } from './mensajeTurno';

// Guarda el pedido en la base (función pedir_turno de la migración 5) para que Pau lo vea en la app.
// No bloquea: WhatsApp se abre igual. Si la función no existe o falla, el pedido sigue yendo por WhatsApp.
export function guardarPedido(f, conHorario) {
  const h = conHorario ? f.horario : null;
  return supabase.rpc('pedir_turno', {
    p_perro: f.perro.trim(),
    p_duenio: f.duenio.trim(),
    p_tel: f.tel,
    p_raza: f.raza.trim(),
    p_tamanio: f.tamanio,
    p_vino_antes: f.vinoAntes,
    p_servicios: f.servicios.join(' + '),
    p_notas: [...f.aTenerEnCuenta, f.comentario.trim()].filter(Boolean).join(', '),
    p_fecha: h ? h.fecha : null,
    p_hora: h ? h.hora : null,
    p_preferencia: h ? '' : describirCuando({ ...f, horario: null }),
  }).then(({ error }) => !error, () => false);
}
