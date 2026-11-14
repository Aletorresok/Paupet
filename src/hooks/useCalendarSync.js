import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../lib/db';
import { MODO_DEMO, supabase } from '../lib/supabase';
import { turnosDelCalendario } from '../lib/ical';
import { calendarioDemo } from '../lib/demo/calendarDemo';
import { firma, planSync, porCompletar } from '../lib/calendarSync';
import { serviciosFrecuentes } from '../pages/calendario/ayudaTurno';
import { fmtFecha } from '../lib/utils';

const CADA_MS = 60000; // al volver a la app no se vuelve a leer si se leyó hace menos de un minuto

// Los turnos del calendario: { eventos, desde, hasta, repetidos }. En producción los lee la función de Vercel
// (el navegador no puede leer la dirección de Google); en el modo demo, un calendario de mentira.
async function traerCalendario(url) {
  if (MODO_DEMO) return turnosDelCalendario(calendarioDemo());
  const { data } = await supabase.auth.getSession();
  const r = await fetch('/api/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` },
    body: JSON.stringify({ url }),
  });
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(cuerpo.error || `No se pudo leer el calendario (${r.status})`);
  return cuerpo;
}

// Trae a Paupet los turnos cargados en Google Calendar: al abrir la app, al volver a ella y con "Sincronizar ahora".
// `estado` = { sincronizando, ultima (Date), error, repetidos }.
export function useCalendarSync({ loading, caps, calendar, clientes, turnos, loadAll, toast, askConfirm }) {
  const [estado, setEstado] = useState({ sincronizando: false, ultima: null, error: '', repetidos: 0 });
  // Lo último cargado, sin volver a crear `sincronizar` en cada render.
  const datos = useRef({});
  useEffect(() => { datos.current = { calendar, clientes, turnos, loadAll, toast, askConfirm }; });
  const enCurso = useRef(false);
  const ultima = useRef(0);
  const url = caps.calendar ? calendar?.url || '' : '';

  // `manual`: lo pidió Pau (avisa también si no hubo cambios o si falló). `urlNueva`: recién pegada en Ajustes.
  const sincronizar = useCallback(async ({ manual = false, urlNueva } = {}) => {
    const direccion = urlNueva ?? datos.current.calendar?.url;
    if (!direccion || enCurso.current) return false;
    enCurso.current = true;
    ultima.current = Date.now(); // también si falla: no se reintenta hasta dentro de un minuto
    setEstado(e => ({ ...e, sincronizando: true }));
    const { toast } = datos.current;
    try {
      const cal = await traerCalendario(direccion);
      const { clientes, turnos, calendar, loadAll, askConfirm } = datos.current;
      const plan = planSync(cal, turnos, clientes, serviciosFrecuentes(clientes, 20), calendar?.ignorados || []);

      let entraron = 0;
      for (const e of plan.crear) {
        try {
          await db.insertTurno({ clientId: e.clientId, dogName: e.nombre, servicio: e.servicio, fecha: e.fecha, hora: e.hora, duracion: e.duracion,
            precio: 0, estado: 'confirmed', gcalUid: e.uid, gcalTitulo: e.titulo, gcalInicio: firma(e) });
          entraron++;
        } catch (err) {
          // Otro dispositivo lo importó al mismo tiempo (el evento es único en la base): no es un error.
          if (err.code !== '23505') throw err;
        }
      }
      for (const { id, ...campos } of plan.mover) await db.updateTurno(id, campos);

      // Eventos que ya no están en Calendar: si el turno estaba sin completar se va solo; si ya tenía datos, se pregunta.
      let sacados = 0;
      for (const t of plan.faltan) {
        const borrar = porCompletar(t) || await askConfirm(`${t.dogName || 'Un turno'} (${fmtFecha(t.fecha)}${t.hora ? ` ${t.hora}` : ''}) ya no está en tu Google Calendar. ¿Lo borro también de Paupet?`);
        if (borrar) await db.deleteTurno(t.id);
        else await db.updateTurno(t.id, { gcalUid: null }); // queda como un turno común de Paupet
        sacados++;
      }
      if (plan.ignorados.length !== (calendar?.ignorados || []).length) await db.saveCalendar({ ignorados: plan.ignorados });

      setEstado({ sincronizando: false, ultima: new Date(), error: '', repetidos: cal.repetidos || 0 });
      const cambios = entraron + plan.mover.length + sacados;
      if (cambios || urlNueva != null) await loadAll();
      if (entraron) toast(entraron === 1 ? 'Entró 1 turno desde Google Calendar 📅' : `Entraron ${entraron} turnos desde Google Calendar 📅`);
      else if (plan.mover.length) toast(plan.mover.length === 1 ? 'Se movió 1 turno, como en Google Calendar 📅' : `Se movieron ${plan.mover.length} turnos, como en Google Calendar 📅`);
      else if (manual) toast('Calendar al día: no hay turnos nuevos');
      return true;
    } catch (e) {
      setEstado(s => ({ ...s, sincronizando: false, error: e.message }));
      if (manual) toast('Google Calendar: ' + e.message, true);
      return false;
    } finally {
      enCurso.current = false;
    }
  }, []);

  // Al abrir la app (cuando terminó de cargar) y cada vez que se vuelve a ella.
  useEffect(() => {
    if (loading || !url) return;
    const siHaceFalta = () => { if (document.visibilityState === 'visible' && Date.now() - ultima.current > CADA_MS) sincronizar(); };
    siHaceFalta();
    document.addEventListener('visibilitychange', siHaceFalta);
    return () => document.removeEventListener('visibilitychange', siHaceFalta);
  }, [loading, url, sincronizar]);

  // Conectar (o desconectar con '') desde Ajustes. Al conectar se prueba la dirección antes de guardarla.
  const conectar = async nueva => {
    try {
      if (nueva) {
        const ok = await sincronizar({ manual: true, urlNueva: nueva });
        if (!ok) return false;
      }
      await db.saveCalendar({ url: nueva });
      await loadAll();
      toast(nueva ? 'Google Calendar conectado ✅' : 'Google Calendar desconectado');
      return true;
    } catch (e) { toast(e.message, true); return false; }
  };

  return { estado, sincronizar, conectar };
}
