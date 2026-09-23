import { useState, useEffect } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import FormGroup from '../../components/ui/FormGroup';
import Modal from '../../components/ui/Modal';
import ModalHead from '../../components/ui/ModalHead';
import { inputStyle } from '../../lib/styles';
import { todayStr } from '../../lib/utils';

const emptyForm = () => ({item:'',cantidad:1,precio:'',notas:'',concepto:'',categoria:'',monto:'',fecha:todayStr()});

export default function ModalNota({ open, onClose, onSave, defaultTipo='compra', initial=null }) {
  const { isMob } = useResp();
  const isEdit = !!initial;
  const [tipo, setTipo] = useState(defaultTipo);
  const [form, setForm] = useState(emptyForm);
  useEffect(() => {
    if (open) {
      setTipo(initial?.tipo || defaultTipo);
      setForm(initial ? {
        item: initial.item||'',
        cantidad: initial.cantidad||1,
        precio: initial.precio||'',
        notas: initial.notas||'',
        concepto: initial.concepto||'',
        categoria: initial.categoria||'',
        monto: initial.monto||'',
        fecha: initial.fecha||todayStr(),
      } : emptyForm());
    }
  }, [open, initial, defaultTipo]);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const grid = {display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:10,marginBottom:10};

  return (
    <Modal open={open} onClose={onClose} width={440}>
      <ModalHead title={isEdit ? `✏️ Editar ${tipo==='compra'?'Item':'Egreso'}` : 'Nueva Nota'} onClose={onClose} />
      <div style={{padding:'18px 22px'}}>
        {!isEdit && (
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            <Btn variant={tipo==='compra'?'primary':'ghost'} size="sm" onClick={()=>setTipo('compra')} style={{flex:1,justifyContent:'center'}}>🛒 A comprar</Btn>
            <Btn variant={tipo==='egreso'?'primary':'ghost'} size="sm" onClick={()=>setTipo('egreso')} style={{flex:1,justifyContent:'center'}}>💸 Egreso</Btn>
          </div>
        )}
        {tipo==='compra' ? (
          <>
            <FormGroup label="Item *"><input value={form.item} onChange={e=>set('item',e.target.value)} placeholder="Ej: Shampoo canino" style={{...inputStyle,marginBottom:10}} /></FormGroup>
            <div style={grid}>
              <FormGroup label="Cantidad"><input type="number" value={form.cantidad} onChange={e=>set('cantidad',e.target.value)} min="1" style={inputStyle}/></FormGroup>
              <FormGroup label="Precio ref."><input type="number" value={form.precio} onChange={e=>set('precio',e.target.value)} placeholder="0" style={inputStyle}/></FormGroup>
            </div>
            <FormGroup label="Notas"><input value={form.notas} onChange={e=>set('notas',e.target.value)} placeholder="Marca, dónde comprarlo..." style={{...inputStyle,marginBottom:14}}/></FormGroup>
          </>
        ) : (
          <>
            <FormGroup label="Concepto *"><input value={form.concepto} onChange={e=>set('concepto',e.target.value)} placeholder="Ej: Electricidad" style={{...inputStyle,marginBottom:10}} /></FormGroup>
            <div style={grid}>
              <FormGroup label="Categoría"><input value={form.categoria} onChange={e=>set('categoria',e.target.value)} placeholder="Servicios" style={inputStyle}/></FormGroup>
              <FormGroup label="Monto *"><input type="number" value={form.monto} onChange={e=>set('monto',e.target.value)} placeholder="0" style={inputStyle}/></FormGroup>
            </div>
            <FormGroup label="Fecha"><input type="date" value={form.fecha} onChange={e=>set('fecha',e.target.value)} style={{...inputStyle,marginBottom:14}}/></FormGroup>
          </>
        )}
        <Btn onClick={()=>onSave(tipo,form,isEdit?initial.id:null)} style={{width:'100%',justifyContent:'center'}}>
          💾 {isEdit ? 'Guardar cambios' : 'Guardar'}
        </Btn>
      </div>
    </Modal>
  );
}
