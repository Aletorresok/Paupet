import { useEffect, useState } from 'react';
import Btn from './Btn';
import Icon from './Icon';
import { activarAvisos, desactivarAvisos, estadoAvisos, probarAviso } from '../../lib/avisos';
import { C, cardStyle, sectionTitleStyle } from '../../lib/styles';

// Activar / probar los avisos al celular cuando entra un pedido de turno.
// `compacto`: versión para el panel "Hoy" (sólo aparece si falta activarlos en este dispositivo).
export default function AvisosCard({ habilitado, toast, compacto = false }) {
  const [estado, setEstado] = useState('cargando');
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => { let vivo = true; estadoAvisos().then(e => vivo && setEstado(e)); return () => { vivo = false; }; }, []);

  const hacer = async (fn, ok) => {
    setOcupado(true);
    try { const r = await fn(); setEstado(await estadoAvisos()); if (ok) toast(typeof ok === 'function' ? ok(r) : ok); }
    catch (e) { toast(e.message, true); }
    finally { setOcupado(false); }
  };
  const activar = () => hacer(activarAvisos, 'Avisos activados en este celular 🔔');

  if (compacto) {
    if (!habilitado || estado !== 'inactivo') return null;
    return (
      <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',background:C.mentaSuave,color:'#173F31',borderRadius:14,padding:'12px 16px',marginBottom:20}}>
        <Icon name="alert" />
        <span style={{flex:1,minWidth:200,fontSize:14}}><strong>Activá los avisos</strong> para que te llegue al celular cada pedido de turno, aunque la app esté cerrada.</span>
        <Btn size="sm" onClick={activar} disabled={ocupado}>Activar avisos</Btn>
      </div>
    );
  }

  return (
    <section style={{...cardStyle,padding:'18px 20px',marginBottom:16}}>
      <h3 style={{...sectionTitleStyle,marginBottom:4}}>Avisos al celular</h3>
      <p style={{fontSize:14,color:C.tintaSuave,marginBottom:12}}>Cuando alguien pide turno desde la página, te llega una notificación a este celular.</p>
      {!habilitado ? <p style={{fontSize:14,color:C.ambar}}>Falta correr la migración 6 (<code>supabase/migracion_06_avisos.sql</code>) en Supabase.</p>
        : estado === 'no-soportado' ? <p style={{fontSize:14}}>Este navegador no permite avisos. En Android usá Chrome; en iPhone, agregá la app a la pantalla de inicio.</p>
        : estado === 'bloqueado' ? <p style={{fontSize:14,color:C.rosa}}>Los avisos están bloqueados para esta página. En Chrome: tocá el candado junto a la dirección → Permisos → Notificaciones → Permitir, y volvé a entrar.</p>
        : estado === 'activo' ? (
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,fontWeight:600,color:C.verde,marginRight:6}}><Icon name="check" strokeWidth={2.2} />Activos en este celular</span>
            <Btn size="sm" variant="ghost" disabled={ocupado} onClick={() => hacer(probarAviso, r => r.enviados ? 'Aviso de prueba enviado' : 'No se encontró este celular: desactivá y volvé a activar')}>Probar aviso</Btn>
            <Btn size="sm" variant="ghost" disabled={ocupado} onClick={() => hacer(desactivarAvisos, 'Avisos desactivados en este celular')}>Desactivar</Btn>
          </div>
        )
        : estado === 'cargando' ? null
        : <Btn onClick={activar} disabled={ocupado}><Icon name="check" strokeWidth={2} />Activar avisos en este celular</Btn>}
    </section>
  );
}
