import { useState, useRef } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import PageHeader from '../../components/ui/PageHeader';
import { MESES } from '../../lib/constants';
import { sans, serif } from '../../lib/styles';
import { toKey, generarSlots, descargarNodoComoPng, compartirNodoComoPng, puedeCompartirImagen, rangoSemana, ocupadosPorAgenda } from './horariosUtils';
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
          <button onClick={semana.limpiarSemana} style={{background:'none',border:'1.5px solid #E6E0D8',borderRadius:50,padding:'7px 14px',fontSize:12,cursor:'pointer',color:'#5B6661',fontFamily:sans}}>🗑 Limpiar</button>
          <Btn size="sm" onClick={handleGuardar} disabled={guardando} variant="ghost">
            {guardando ? '⏳...' : '💾 Guardar'}
          </Btn>
          {puedeCompartirImagen() && (
            <Btn size="sm" onClick={() => descargarImagen(true)} disabled={generando}>
              {generando ? '⏳...' : '📤 Compartir'}
            </Btn>
          )}
          <Btn size="sm" onClick={() => descargarImagen()} disabled={generando} style={{background:'#25d366',border:'none'}}>
            {generando ? '⏳...' : '📥 Descargar'}
          </Btn>
        </div>
      </PageHeader>

      <LinkTurnosCard />

      <SemanaNav semanaInicio={semanaInicio} onChange={semana.cambiarSemana} />
      {dias.some(d => Object.keys(d.agenda).length) && (
        <p style={{fontSize:13,color:'#5B6661',margin:'-6px 0 12px'}}>
          📅 Los horarios con turno en la Agenda se marcan solos como tomados (también en la imagen).
        </p>
      )}

      <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fill,minmax(${isMob?'160px':'190px'},1fr))`,gap:10,marginBottom:24}}>
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
