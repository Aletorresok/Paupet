import Icon from '../../components/ui/Icon';
import { useState, useEffect } from 'react';
import Btn from '../../components/ui/Btn';
import Modal from '../../components/ui/Modal';
import ModalHead from '../../components/ui/ModalHead';
import WhatsAppBtn from '../../components/ui/WhatsAppBtn';
import { serif } from '../../lib/styles';
import { animalIcon, todayStr } from '../../lib/utils';
import { abrirWhatsApp } from '../../lib/whatsapp';
import ClienteDatos from './ClienteDatos';
import FrecuenciaBanner from './FrecuenciaBanner';
import InasistenciasBanner from './InasistenciasBanner';
import VisitaItem from './VisitaItem';
import VisitaForm from './VisitaForm';

const emptyVisita = () => ({ svc:'', precio:'', fecha:todayStr(), formaPago:'efectivo' });
const subtitleStyle = {fontFamily:serif,fontSize:14,fontWeight:600};

export default function ModalCliente({ open, cliente, onClose, onSaveVisit, onEditVisit, onDeleteVisit, onDelete, onEdit, onDecrementarInasistencia }) {
  const [showForm, setShowForm] = useState(false);
  const [visitaForm, setVisitaForm] = useState(emptyVisita);
  const [editingVisita, setEditingVisita] = useState(null);

  useEffect(() => {
    if (open) { setShowForm(false); setVisitaForm(emptyVisita()); setEditingVisita(null); }
  }, [open]);

  if (!open || !cliente) return null;
  const c = cliente;

  const handleSaveVisita = () => {
    const { svc, precio, fecha, formaPago } = visitaForm;
    if (editingVisita) {
      onEditVisit(editingVisita.id, svc, parseFloat(precio)||0, fecha, formaPago);
      setEditingVisita(null);
    } else {
      onSaveVisit(c.id, svc, parseFloat(precio)||0, fecha, formaPago);
    }
    setShowForm(false); setVisitaForm(emptyVisita());
  };

  const startEditVisita = (v) => {
    setEditingVisita(v);
    setVisitaForm({ svc:v.servicio, precio:String(v.precio), fecha:v.fecha, formaPago:v.forma_pago || 'efectivo' });
    setShowForm(true);
  };

  const toggleNuevaVisita = () => {
    setShowForm(!showForm); setEditingVisita(null); setVisitaForm(emptyVisita());
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHead title={c.dog} subtitle={`👤 ${c.owner}${c.tel?' · 📱 '+c.tel:''}`} onClose={onClose}
        avatar={c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : <span style={{fontSize:34}}>{animalIcon(c.raza)}</span>}
      />
      <div style={{padding:'18px 22px'}}>
        <ClienteDatos cliente={c} />
        <FrecuenciaBanner visitas={c.visitas} />

        {(c.inasistencias||0) > 0 && (
          <InasistenciasBanner cantidad={c.inasistencias} onRestar={() => onDecrementarInasistencia(c.id)} />
        )}

        <div style={{...subtitleStyle,marginBottom:6}}>Notas</div>
        <div style={{background:'#FBE7EC',borderRadius:10,padding:'10px 13px',fontSize:13,lineHeight:1.6,borderLeft:'3px solid #B83D62',marginBottom:14}}>{c.notes||'Sin notas especiales.'}</div>

        <div style={{...subtitleStyle,margin:'14px 0 8px'}}>Historial de visitas</div>
        {!(c.visitas||[]).length ? <p style={{fontSize:13,color:'#5B6661'}}>Sin visitas aún</p>
          : [...(c.visitas||[])].sort((a,b) => (b.fecha||'').localeCompare(a.fecha||'')).map((v,i) => (
            <VisitaItem key={v.id||i} visita={v} onEdit={() => startEditVisita(v)} onDelete={() => onDeleteVisit(v.id)} />
          ))
        }

        <div style={{display:'flex',gap:8,marginTop:14,flexWrap:'wrap'}}>
          <Btn size="sm" onClick={toggleNuevaVisita}>
            {showForm && !editingVisita ? 'Cancelar' : '+ Registrar visita'}
          </Btn>
          {c.tel && <WhatsAppBtn size="sm" onClick={() => abrirWhatsApp(c.tel, c.dog, c.owner)}>WhatsApp</WhatsAppBtn>}
          <Btn size="sm" variant="ghost" onClick={() => onEdit(c)}><Icon name="edit" size={16}/>Editar</Btn>
          <Btn size="sm" variant="danger" onClick={() => onDelete(c.id)}><Icon name="trash" size={16}/>Eliminar</Btn>
        </div>

        {showForm && (
          <VisitaForm
            values={visitaForm}
            onChange={setVisitaForm}
            isEdit={!!editingVisita}
            onSave={handleSaveVisita}
            onCancel={() => { setEditingVisita(null); setShowForm(false); }}
          />
        )}
      </div>
    </Modal>
  );
}
