import { useState } from 'react';
import Icon from '../../../components/ui/Icon';
import PetAvatar from '../../../components/ui/PetAvatar';
import { normalizar } from '../../../lib/duenos';
import { calcFrecuencia, fmtCada } from '../../../lib/frecuencia';
import { C } from '../../../lib/styles';
import { diasDesde } from '../../../lib/utils';
import { colorEtiqueta } from '../../clientes/ficha/etiquetas';
import { ultimaVisita } from '../ayudaTurno';
import { etiquetaPaso, link, nota, paso } from './estilos';
import PerroNuevoForm from './PerroNuevoForm';

const chipAlerta = (bg, fg) => ({display:'inline-flex',alignItems:'center',fontSize:12,fontWeight:600,background:bg,color:fg,borderRadius:999,padding:'3px 10px'});
const coincide = (c, n) => normalizar(`${c.dog} ${c.owner} ${c.tel}`).includes(n);
// Primero los perros cuyo nombre empieza con lo buscado, después los que lo contienen y al final por dueño o teléfono.
const orden = (c, n) => { const d = normalizar(c.dog); return d.startsWith(n) ? 0 : d.includes(n) ? 1 : 2; };
const buscarPerros = (clientes, n) => clientes.filter(c => coincide(c, n)).sort((a, b) => orden(a, n) - orden(b, n));

function detalle(c) {
  const ultima = ultimaVisita(c);
  if (!ultima) return 'Todavía no tiene visitas';
  const dias = diasDesde(ultima.fecha);
  const frec = calcFrecuencia(c.visitas);
  return `Última vez ${dias === 0 ? 'hoy' : `hace ${dias} ${dias === 1 ? 'día' : 'días'}`}${frec ? ` · viene cada ${fmtCada(frec.cadaDias)}` : ''}`;
}

// 1 · Perro: buscador (por perro, dueño o teléfono). Al escribir queda elegido el primero que coincide y
// los otros aparecen en "También". Abajo, lo que conviene saber al darle turno: cuidados y faltas.
export default function PasoPerro({ clientes, cliente: c, onElegir, nuevo, onNuevo, form, set }) {
  const [q, setQ] = useState('');
  const n = normalizar(q);
  const hits = n ? buscarPerros(clientes, n) : [];
  const otros = hits.filter(x => x.id !== c?.id).slice(0, 3);

  const buscar = v => {
    setQ(v);
    const nv = normalizar(v);
    if (!nv) return;
    const h = buscarPerros(clientes, nv);
    onElegir(h[0]?.id ?? null);
  };

  if (nuevo) {
    return (
      <div style={paso}>
        <span style={etiquetaPaso}>1 · Perro nuevo</span>
        <PerroNuevoForm form={form} set={set} clientes={clientes} />
        <span style={nota}><button type="button" onClick={() => onNuevo(false)} style={link}>Buscar uno que ya vino</button></span>
      </div>
    );
  }

  const etiquetas = (c?.etiquetas || []).filter(e => e && e.trim() && e.trim() !== 'Alergia:');
  return (
    <div style={paso}>
      <label htmlFor="turno-buscar" style={etiquetaPaso}>1 · Perro</label>
      <div style={{display:'flex',alignItems:'center',gap:10,height:52,padding:'0 14px',borderRadius:14,border:'1px solid #D9D5CE'}}>
        <Icon name="search" size={20} style={{color:C.tintaSuave}} />
        <input id="turno-buscar" type="search" value={q} onChange={e => buscar(e.target.value)} placeholder="Nombre del perro, dueño o teléfono"
          autoComplete="off" style={{flex:1,minWidth:0,border:'none',outline:'none',fontFamily:'inherit',fontSize:16,color:C.tinta,background:'transparent'}} />
      </div>

      {c && (
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:14,background:'#E4F4EC',border:`2px solid ${C.mentaBorde}`}}>
          <PetAvatar cliente={c} size={44} />
          <span style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:1}}>
            <span style={{fontSize:16,fontWeight:600}}>{c.dog} <span style={{fontWeight:400,color:'#3E4743'}}>· {c.owner}</span></span>
            <span style={{fontSize:13,color:'#3E4743'}}>{detalle(c)}</span>
          </span>
        </div>
      )}
      {c && (etiquetas.length > 0 || c.inasistencias > 0 || c.notes) && (
        <div style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
          {c.inasistencias > 0 && <span style={chipAlerta(C.rosaSuave, C.rosa)}>Faltó {c.inasistencias} {c.inasistencias === 1 ? 'vez' : 'veces'} sin avisar</span>}
          {etiquetas.map(e => { const k = colorEtiqueta(e); return <span key={e} style={chipAlerta(k.bg, k.fg)}>{e}</span>; })}
          {c.notes && <span style={{fontSize:13,color:C.tintaSuave}}>📝 {c.notes}</span>}
        </div>
      )}

      {(n || onNuevo) && (
        <span style={{...nota,paddingLeft:2,display:'flex',flexWrap:'wrap',alignItems:'center',columnGap:4}}>
          {n && !hits.length && <span>No encontré “{q.trim()}”{onNuevo && ' ·'}</span>}
          {otros.length > 0 && <span>También:</span>}
          {otros.map((x, i) => (
            <span key={x.id}>
              <button type="button" onClick={() => onElegir(x.id)} style={{...link,fontWeight:600,textDecoration:'none',color:C.tinta}}>{x.dog} ({x.owner})</button>
              {(i < otros.length - 1 || onNuevo) && ' ·'}
            </span>
          ))}
          {onNuevo && !n && !c && <span>¿Es la primera vez?</span>}
          {onNuevo && <button type="button" onClick={() => onNuevo(true)} style={link}>perro nuevo</button>}
        </span>
      )}
    </div>
  );
}
