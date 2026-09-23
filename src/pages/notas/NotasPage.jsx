import { useState } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import PageHeader from '../../components/ui/PageHeader';
import ComprasTab from './ComprasTab';
import EgresosTab from './EgresosTab';

export default function NotasPage({ notas, onToggleCompra, onDeleteNota, onEditNota, onAgregar }) {
  const { isMob } = useResp();
  const [tab, setTab] = useState('compras');

  return (
    <section>
      <PageHeader title="Notas & Stock 📝" subtitle="Compras pendientes y control de egresos">
        <Btn onClick={()=>onAgregar(tab==='compras'?'compra':'egreso')} size={isMob?'sm':''}>+ Agregar {tab==='compras'?'item':'egreso'}</Btn>
      </PageHeader>
      <div style={{display:'flex',gap:8,marginBottom:18}}>
        <Btn variant={tab==='compras'?'primary':'ghost'} size="sm" onClick={()=>setTab('compras')}>🛒 A comprar</Btn>
        <Btn variant={tab==='egresos'?'primary':'ghost'} size="sm" onClick={()=>setTab('egresos')}>💸 Egresos</Btn>
      </div>

      {tab==='compras'
        ? <ComprasTab notas={notas} onToggleCompra={onToggleCompra} onEditNota={onEditNota} onDeleteNota={onDeleteNota} />
        : <EgresosTab notas={notas} onEditNota={onEditNota} onDeleteNota={onDeleteNota} />
      }
    </section>
  );
}
