import { useEffect, useRef, useState } from 'react';
import Icon from '../../../components/ui/Icon';
import { db } from '../../../lib/db';
import { C, sans } from '../../../lib/styles';
import EstadoVacio from '../../../components/ui/EstadoVacio';
import { fmtFecha } from '../../../lib/utils';

// Galería de fotos de antes y después del perro.
export default function FotosAntesDespues({ clienteId, habilitado, toast }) {
  const [fotos, setFotos] = useState([]);
  const [subiendo, setSubiendo] = useState(null);
  const inputs = { antes: useRef(null), despues: useRef(null) };

  useEffect(() => {
    if (!habilitado) return;
    let vivo = true;
    db.getFotos(clienteId).then(f => { if (vivo) setFotos(f); }).catch(e => toast(e.message, true));
    return () => { vivo = false; };
  }, [clienteId, habilitado, toast]);

  if (!habilitado) {
    return <p style={{fontSize:13,color:C.tintaSuave}}>Las fotos de antes y después se activan cuando se actualice la base de datos (migración 2).</p>;
  }

  const subir = async (tipo, file) => {
    if (!file) return;
    setSubiendo(tipo);
    try {
      await db.insertFoto(clienteId, file, tipo);
      setFotos(await db.getFotos(clienteId));
    } catch (e) { toast(e.message, true); }
    setSubiendo(null);
  };
  const borrar = async id => {
    try { await db.deleteFoto(id); setFotos(f => f.filter(x => x.id !== id)); } catch (e) { toast(e.message, true); }
  };

  const boton = (tipo, label) => (
    <>
      <button type="button" disabled={!!subiendo} onClick={() => inputs[tipo].current.click()} style={{height:36,padding:'0 12px',borderRadius:10,border:`1px solid ${C.linea}`,background:'white',fontFamily:sans,fontSize:14,cursor:'pointer',color:C.tinta}}>
        {subiendo === tipo ? 'Subiendo…' : label}
      </button>
      <input ref={inputs[tipo]} type="file" accept="image/*" style={{display:'none'}} onChange={e => { subir(tipo, e.target.files[0]); e.target.value = ''; }} />
    </>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'flex',gap:8}}>{boton('antes', '+ Foto de antes')}{boton('despues', '+ Foto de después')}</div>
      {!fotos.length ? <EstadoVacio ilustracion="banio" texto="Todavía no hay fotos. Sacá una antes y otra después del baño para ver el cambio." tamanio={110} /> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:8}}>
          {fotos.map(f => (
            <figure key={f.id} style={{margin:0,position:'relative',aspectRatio:'1',borderRadius:12,overflow:'hidden',background:'#EFEAE3'}}>
              <img src={f.url} alt={`${f.tipo === 'antes' ? 'Antes' : 'Después'} · ${fmtFecha(f.fecha)}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
              <figcaption style={{position:'absolute',left:0,right:0,bottom:0,padding:'4px 8px',fontSize:11,fontWeight:600,color:'white',background:'linear-gradient(transparent,rgba(0,0,0,.6))'}}>
                {f.tipo === 'antes' ? 'Antes' : 'Después'} · {fmtFecha(f.fecha).replace(/ \d{4}$/, '')}
              </figcaption>
              <button type="button" aria-label="Borrar foto" onClick={() => borrar(f.id)} style={{position:'absolute',top:4,right:4,width:28,height:28,borderRadius:8,border:'none',background:'rgba(255,255,255,.9)',color:C.rosa,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Icon name="trash" size={14}/>
              </button>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
