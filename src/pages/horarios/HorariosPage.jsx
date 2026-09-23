import { useState, useRef } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import PageHeader from '../../components/ui/PageHeader';
import { MESES } from '../../lib/constants';
import { sans, serif } from '../../lib/styles';
import { generarSlots, descargarNodoComoPng, rangoSemana } from './horariosUtils';
import { useHorariosSemana } from './useHorariosSemana';
import SemanaNav from './SemanaNav';
import DiaSlotsCard from './DiaSlotsCard';
import StoryPreview from './StoryPreview';
import StoryPreviewNuevo from './StoryPreviewNuevo';
import DisenoSelector from './DisenoSelector';
import { leerDiseno, guardarDiseno } from './disenoStorage';
import AutoGenModal from './AutoGenModal';
import LinkTurnosCard from './LinkTurnosCard';

export default function HorariosPage({ horariosData, onSaveHorarios }) {
  const { isMob } = useResp();
  const semana = useHorariosSemana(horariosData);
  const { semanaInicio, dias } = semana;

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

  const descargarImagen = async () => {
    setGenerando(true);
    try {
      const nuevo = diseno === 'nuevo';
      await descargarNodoComoPng(
        previewRef.current,
        `horarios_paupet_${semanaInicio.getDate()}_${MESES[semanaInicio.getMonth()]}${nuevo ? '_nuevo' : ''}.png`,
        nuevo ? '#5FBF9B' : '#7ec8a0',
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
          <Btn size="sm" onClick={descargarImagen} disabled={generando} style={{background:'#25d366',border:'none'}}>
            {generando ? '⏳...' : '📥 Descargar'}
          </Btn>
        </div>
      </PageHeader>

      <LinkTurnosCard />

      <SemanaNav semanaInicio={semanaInicio} onChange={semana.cambiarSemana} />

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
        {diseno === 'nuevo'
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
