import { useState } from 'react';
import Btn from '../../components/ui/Btn';
import FormGroup from '../../components/ui/FormGroup';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import ModalHead from '../../components/ui/ModalHead';
import { calcularHorariosLibres } from '../../lib/horariosLibres';
import { cuandoCorto } from '../../lib/pedidos';
import { C, inputStyle } from '../../lib/styles';
import { todayStr } from '../../lib/utils';
import { turnosQueSePisan, rangoTurno } from '../calendario/ayudaTurno';

// Pau elige otro día y hora para un pedido (o uno para un pedido sin horario) y se lo manda por WhatsApp.
// Ofrece los horarios libres cargados en "Horarios para Stories", o se elige a mano.
export default function ModalProponer({ pedido: p, config, turnos, pedidos, onClose, onEnviar }) {
  const libres = calcularHorariosLibres({ horarios_semanales: config.horariosSemanales }, turnos, new Date(), pedidos.filter(x => x.id !== p.id)).slice(0, 12);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const pisados = turnosQueSePisan(turnos, { fecha, hora, duracion: 60 });
  const chip = sel => ({
    height:40,padding:'0 12px',borderRadius:999,fontFamily:'inherit',fontSize:14,cursor:'pointer',
    background:sel?C.mentaSuave:'white',color:sel?C.verde:C.tinta,fontWeight:sel?600:400,
    border:sel?`1.5px solid ${C.mentaBorde}`:`1px solid ${C.linea}`,
  });

  return (
    <Modal open onClose={onClose} width={520}>
      <ModalHead title={p.fecha ? 'Proponer otro horario' : 'Proponer un horario'}
        subtitle={`${p.perro} · ${p.duenio}${p.fecha ? ` · pidió el ${cuandoCorto(p.fecha, p.hora)}` : p.preferencia ? ` · "${p.preferencia}"` : ''}`} onClose={onClose} />
      <div style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:14}}>
        {libres.length > 0 && (
          <div>
            <div style={{fontSize:13,color:C.tintaSuave,marginBottom:8}}>Horarios libres de la semana cargada:</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {libres.map(l => (
                <button key={l.fecha + l.hora} type="button" style={chip(l.fecha === fecha && l.hora === hora)}
                  onClick={() => { setFecha(l.fecha); setHora(l.hora); }}>{cuandoCorto(l.fecha, l.hora)}</button>
              ))}
            </div>
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FormGroup label="Día"><input type="date" value={fecha} min={todayStr()} onChange={e => setFecha(e.target.value)} style={inputStyle} /></FormGroup>
          <FormGroup label="Hora"><input type="time" value={hora} onChange={e => setHora(e.target.value)} style={inputStyle} /></FormGroup>
        </div>
        {pisados.length > 0 && (
          <div role="status" style={{padding:'10px 12px',borderRadius:10,background:C.rosaSuave,color:C.rosa,fontSize:13,fontWeight:500}}>
            Se pisa con {pisados.map(t => `${t.dogName || 'un turno'} (${rangoTurno(t)})`).join(', ')}.
          </div>
        )}
        <p style={{fontSize:13,color:C.tintaSuave,margin:0}}>
          Se abre WhatsApp con la propuesta. Cuando te conteste que sí, tocá <strong>Aceptó</strong> en el pedido y el turno se carga solo.
        </p>
        <Btn disabled={!fecha || !hora} onClick={() => onEnviar(p, fecha, hora)} style={{background:C.whatsapp,color:'white'}}>
          <Icon name="chat" size={18} />Enviar propuesta por WhatsApp
        </Btn>
      </div>
    </Modal>
  );
}
