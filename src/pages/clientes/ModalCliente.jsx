import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import ModalHead from '../../components/ui/ModalHead';
import MenuMas from '../../components/ui/MenuMas';
import { useResp } from '../../context/resp';
import { C } from '../../lib/styles';
import { todayStr } from '../../lib/utils';
import PetAvatar from '../../components/ui/PetAvatar';
import { abrirWhatsApp } from '../../lib/whatsapp';
import DatosPerro from './ficha/DatosPerro';
import EtiquetasEditor from './ficha/EtiquetasEditor';
import FotosAntesDespues from './ficha/FotosAntesDespues';
import FrecuenciaCard from './ficha/FrecuenciaCard';
import HistorialVisitas from './ficha/HistorialVisitas';
import PreciosCard from './ficha/PreciosCard';
import Seccion from './ficha/Seccion';
import { perrosDelDueno } from './ficha/etiquetas';

// Ficha completa del perro: datos, frecuencia, etiquetas, fotos e historial.
export default function ModalCliente({ open, cliente, clientes, turnos, caps, toast, onClose, onSelectCliente, onDarTurno,
  onSaveVisit, onEditVisit, onDeleteVisit, onDelete, onEdit, onDecrementarInasistencia, onSaveEtiquetas }) {
  const { isMob } = useResp();
  if (!open || !cliente) return null;
  const c = cliente;
  const hermanos = perrosDelDueno(c, clientes);
  const hoy = todayStr();
  const proximo = turnos
    .filter(t => t.clientId === c.id && t.fecha >= hoy && t.estado !== 'completed')
    .sort((a,b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];

  return (
    <Modal open={open} onClose={onClose} width={1000}>
      <ModalHead title={c.dog} subtitle={`${c.owner || ''}${c.tel ? ' · ' + c.tel : ''}`} onClose={onClose}
        avatar={<PetAvatar cliente={c} size={64} style={{width:'100%',height:'100%'}} />}
      />
      <div style={{padding:isMob?'16px':'18px 22px',display:'flex',flexDirection:'column',gap:16,background:C.fondo}}>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <Btn onClick={() => onDarTurno(c.id, todayStr())}><Icon name="plus" strokeWidth={2}/>Dar turno</Btn>
          {c.tel && <Btn variant="ghost" onClick={() => abrirWhatsApp(c.tel, c.dog, c.owner)} style={{color:C.whatsapp}}><Icon name="chat" size={18}/>WhatsApp</Btn>}
          <div style={{marginLeft:'auto'}}>
            <MenuMas label="Más acciones del cliente" acciones={[
              { label:'Editar datos', icon:'edit', onClick:() => onEdit(c) },
              { label:'Eliminar cliente', icon:'trash', onClick:() => onDelete(c.id), peligro:true },
            ]} />
          </div>
        </div>

        {hermanos.length > 0 && (
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',fontSize:14,color:C.tintaSuave}}>
            Otros perros de {c.owner}:
            {hermanos.map(h => (
              <button key={h.id} type="button" onClick={() => onSelectCliente(h.id)} style={{display:'flex',alignItems:'center',gap:8,height:40,padding:'0 14px 0 6px',borderRadius:12,border:`1px solid ${C.linea}`,background:'white',fontFamily:'inherit',fontSize:14,fontWeight:500,cursor:'pointer',color:C.tinta}}>
                <PetAvatar cliente={h} size={28} />
                {h.dog}
              </button>
            ))}
          </div>
        )}

        <FrecuenciaCard cliente={c} proximoTurno={proximo} onAgendar={fecha => onDarTurno(c.id, fecha)} />

        <div style={{display:'grid',gridTemplateColumns:isMob?'minmax(0,1fr)':'minmax(0,1fr) minmax(0,1.15fr)',gap:16,alignItems:'start'}}>
          <div style={{display:'flex',flexDirection:'column',gap:16,minWidth:0}}>
            <Seccion titulo="Datos">
              <DatosPerro cliente={c} onRestarInasistencia={() => onDecrementarInasistencia(c.id)} />
            </Seccion>
            <Seccion titulo="A tener en cuenta">
              <EtiquetasEditor etiquetas={c.etiquetas || []} habilitado={caps.etiquetas} onChange={e => onSaveEtiquetas(c.id, e)} />
              {c.notes && <p style={{fontSize:14,lineHeight:1.5,background:C.fondo,borderRadius:10,padding:'10px 12px',margin:0}}>{c.notes}</p>}
            </Seccion>
            <Seccion titulo="Precio en el tiempo">
              <PreciosCard visitas={c.visitas} />
            </Seccion>
            <Seccion titulo="Antes y después">
              <FotosAntesDespues clienteId={c.id} habilitado={caps.fotos} toast={toast} />
            </Seccion>
          </div>
          <HistorialVisitas cliente={c} onSaveVisit={onSaveVisit} onEditVisit={onEditVisit} onDeleteVisit={onDeleteVisit} />
        </div>
      </div>
    </Modal>
  );
}
