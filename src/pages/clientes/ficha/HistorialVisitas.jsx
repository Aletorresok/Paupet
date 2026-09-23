import { useState } from 'react';
import Btn from '../../../components/ui/Btn';
import { todayStr } from '../../../lib/utils';
import VisitaItem from '../VisitaItem';
import VisitaForm from '../VisitaForm';
import Seccion from './Seccion';

const vacia = () => ({ svc:'', precio:'', fecha:todayStr(), formaPago:'efectivo' });

// Historial de visitas del perro, con alta y edición manual.
export default function HistorialVisitas({ cliente: c, onSaveVisit, onEditVisit, onDeleteVisit }) {
  const [form, setForm] = useState(null);       // null = cerrado
  const [editando, setEditando] = useState(null);
  const visitas = [...(c.visitas || [])].sort((a,b) => (b.fecha||'').localeCompare(a.fecha||''));

  const guardar = () => {
    const { svc, precio, fecha, formaPago } = form;
    if (editando) onEditVisit(editando.id, svc, parseFloat(precio)||0, fecha, formaPago);
    else onSaveVisit(c.id, svc, parseFloat(precio)||0, fecha, formaPago);
    setForm(null); setEditando(null);
  };
  const editar = v => {
    setEditando(v);
    setForm({ svc:v.servicio, precio:String(v.precio), fecha:v.fecha, formaPago:v.forma_pago || 'efectivo' });
  };

  return (
    <Seccion titulo="Historial" extra={!form && <Btn size="sm" variant="ghost" onClick={() => { setEditando(null); setForm(vacia()); }}>+ Registrar visita</Btn>}>
      {form && (
        <VisitaForm values={form} onChange={setForm} isEdit={!!editando} onSave={guardar} onCancel={() => { setForm(null); setEditando(null); }} />
      )}
      {!visitas.length ? <p style={{fontSize:14,color:'#5B6661'}}>Sin visitas todavía.</p>
        : <div>{visitas.map((v,i) => <VisitaItem key={v.id||i} visita={v} onEdit={() => editar(v)} onDelete={() => onDeleteVisit(v.id)} />)}</div>}
    </Seccion>
  );
}
