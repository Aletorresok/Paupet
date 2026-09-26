import { useState, useRef } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import PageHeader from '../../components/ui/PageHeader';
import { MESES } from '../../lib/constants';
import { C, serif } from '../../lib/styles';
import Icon from '../../components/ui/Icon';
import { toKey, generarSlots, descargarNodoComoPng, compartirNodoComoPng, puedeCompartirImagen, rangoSemana, ocupadosPorAgenda, huellaHorarios } from './horariosUtils';
import { useHorariosSemana } from './useHorariosSemana';
import SemanaNav from './SemanaNav';
import DiaSlotsCard from './DiaSlotsCard';
import StoryPreview from './StoryPreview';
import StoryPreviewNuevo from './StoryPreviewNuevo';
import DisenoSelector from './DisenoSelector';
import { leerDiseno, guardarDiseno, esFondo } from './disenoStorage';
import StoryPreviewFondo from './StoryPreviewFondo';
import { FONDOS } from './fondosStory';
import AutoGenModal from './AutoGenModal';
import LinkTurnosCard from './LinkTurnosCard';

export default function HorariosPage({ horariosData, turnos = [], onSaveHorarios }) {
  const { isMob } = useResp();
  const semana = useHorariosSemana(horariosData);
  const { semanaInicio } = semana;
  // Los horarios que ya tienen turno en la agenda cuentan como tomados. No se guardan:
  // si el turno se borra o se mueve, el horario vuelve a quedar libre solo.
  const dias = semana.dias.map(d => {
    const agenda = ocupadosPorAgenda(turnos, toKey(d.date), d.horas);
    return { ...d, agenda, tomados: [...new Set([...d.tomados, ...Object.keys(agenda)])] };
  });

  const sinGuardar = huellaHorarios(semana.snapshot()) !== huellaHorarios(horariosData);
  const [nuevoSlot, setNuevoSlot] = useState({});
  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const previewRef = useRef(null);
  const [autoGenModal, setAutoGenModal] = useState({open:false, dia:null});
  const [autoGenForm, setAutoGenForm] = useState({desde:'09:00',hasta:'17:00',dur:'60'});
  const [diseno, setDiseno] = useState(leerDiseno);
  const cambiarDiseno = d => { setDiseno(d); guardarDiseno(d); };

  const agregarSlot = (dia) => {
    const hora = nuevoSlot[dia]||'';
    if (!hora) return;
    semana.agregarSlots(dia, [hora]);
    setNuevoSlot(n => ({...n, [dia]:''}));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    await onSaveHorarios(semana.snapshot());
    setGuardando(false);
  };

  const handleAutoGen = () => {
    const { desde, hasta, dur } = autoGenForm;
    semana.agregarSlots(autoGenModal.dia, generarSlots(desde, hasta, dur));
    setAutoGenModal({open:false,dia:null});
  };

  const descargarImagen = async (compartir = false) => {
    setGenerando(true);
    try {
      const color = esFondo(diseno) ? FONDOS[diseno].color : diseno === 'nuevo' ? '#5FBF9B' : '#7ec8a0';
      await (compartir ? compartirNodoComoPng : descargarNodoComoPng)(
        previewRef.current,
        `horarios_paupet_${semanaInicio.getDate()}_${MESES[semanaInicio.getMonth()]}${diseno === 'clasico' ? '' : '_' + diseno}.png`,
        color,
      );
    } catch(e) {
      alert('Error al generar imagen: ' + e.message);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <section>
      <PageHeader title="Horarios para Stories" subtitle="Cargá los horarios de la semana y descargá la imagen">
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <Btn variant="ghost" onClick={semana.limpiarSemana} title="Borrar los horarios de esta semana (hasta que guardes)"><Icon name="trash" />Limpiar</Btn>
          <Btn variant={sinGuardar ? 'primary' : 'ghost'} onClick={handleGuardar} disabled={guardando}>
            <Icon name="check" strokeWidth={2} />{guardando ? 'Guardando…' : sinGuardar ? 'Guardar cambios' : 'Guardado'}
          </Btn>
          {puedeCompartirImagen() && (
            <Btn variant="ghost" onClick={() => descargarImagen(true)} disabled={generando}>
              <Icon name="chat" />{generando ? 'Generando…' : 'Compartir'}
            </Btn>
          )}
          <Btn variant="ghost" onClick={() => descargarImagen()} disabled={generando}>
            <Icon name="download" />{generando ? 'Generando…' : 'Descargar'}
          </Btn>
        </div>
      </PageHeader>

      <LinkTurnosCard />

      <SemanaNav semanaInicio={semanaInicio} onChange={semana.cambiarSemana} />
      {sinGuardar && (
        <div role="status" style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',background:C.ambarSuave,color:C.ambar,borderRadius:12,padding:'10px 14px',marginBottom:12,fontSize:14}}>
          <Icon name="alert" />
          <span style={{flex:1,minWidth:200}}><strong>Hay cambios sin guardar.</strong> La página para pedir turno sigue mostrando los horarios anteriores.</span>
          <Btn size="sm" onClick={handleGuardar} disabled={guardando}>Guardar</Btn>
        </div>
      )}
      <p style={{fontSize:13,color:C.tintaSuave,margin:'0 0 12px',display:'flex',gap:14,flexWrap:'wrap'}}>
        <span><span style={{display:'inline-block',width:10,height:10,borderRadius:3,background:C.mentaSuave,border:`1px solid ${C.mentaBorde}`,marginRight:5}}/>Libre</span>
        <span><span style={{display:'inline-block',width:10,height:10,borderRadius:3,background:C.rosaSuave,border:`1px solid ${C.rosa}`,marginRight:5}}/>Tomado (tocá la hora para cambiarlo)</span>
        <span><span style={{display:'inline-block',width:10,height:10,borderRadius:3,background:C.ambarSuave,border:`1px solid ${C.ambar}`,marginRight:5}}/>Con turno en la Agenda (automático)</span>
      </p>

      <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fill,minmax(${isMob?'150px':'200px'},1fr))`,gap:isMob?8:12,marginBottom:24,alignItems:'start'}}>
        {dias.map(d => (
          <DiaSlotsCard
            key={d.dia}
            {...d}
            nuevoSlot={nuevoSlot[d.dia]||''}
            onNuevoSlot={v=>setNuevoSlot(n=>({...n,[d.dia]:v}))}
            onToggleDia={()=>semana.toggleDia(d.dia)}
            onAgregar={()=>agregarSlot(d.dia)}
            onQuitar={h=>semana.quitarSlot(d.dia,h)}
            onToggleTomado={h=>semana.toggleTomado(d.dia,h)}
            onAutoGen={()=>setAutoGenModal({open:true,dia:d.dia})}
          />
        ))}
      </div>

      <div style={{marginBottom:8,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
        <div style={{fontFamily:serif,fontSize:16,fontWeight:600}}>Vista previa</div>
        <span style={{fontSize:11,color:'#5B6661'}}>1080×1920px · Stories</span>
        <DisenoSelector value={diseno} onChange={cambiarDiseno} />
      </div>
      <div style={{overflowX:'auto'}}>
        {esFondo(diseno)
          ? <StoryPreviewFondo ref={previewRef} fondo={diseno} dias={dias.filter(d => d.activo)} rango={rangoSemana(semanaInicio)} />
          : diseno === 'nuevo'
          ? <StoryPreviewNuevo ref={previewRef} dias={dias.filter(d => d.activo)} rango={rangoSemana(semanaInicio)} />
          : <StoryPreview ref={previewRef} dias={dias.filter(d => d.activo)} />
        }
      </div>

      {autoGenModal.open && (
        <AutoGenModal
          dia={autoGenModal.dia}
          form={autoGenForm}
          onChange={setAutoGenForm}
          onGenerar={handleAutoGen}
          onClose={()=>setAutoGenModal({open:false,dia:null})}
        />
      )}
    </section>
  );
}
