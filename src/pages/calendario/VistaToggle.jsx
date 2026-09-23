import { C } from '../../lib/styles';

// Selector de vista de la agenda (Día / Semana / Mes).
export default function VistaToggle({ opciones, value, onChange }) {
  return (
    <div role="group" aria-label="Vista" style={{display:'inline-flex',background:'#EDE8E1',borderRadius:12,padding:4,gap:4}}>
      {opciones.map(o => {
        const sel = value === o.id;
        return (
          <button key={o.id} type="button" aria-pressed={sel} onClick={() => onChange(o.id)} style={{
            height:36,padding:'0 16px',border:'none',borderRadius:9,fontFamily:'inherit',fontSize:14,cursor:'pointer',
            background:sel?'white':'transparent',fontWeight:sel?600:400,color:C.tinta,boxShadow:sel?'0 1px 2px rgba(31,42,38,.12)':'none',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}
