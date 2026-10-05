import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/ui/Icon';
import MenuMas from '../../components/ui/MenuMas';
import PetAvatar from '../../components/ui/PetAvatar';
import { useEscape } from '../../hooks/useEscape';
import { db } from '../../lib/db';
import { C, cardStyle } from '../../lib/styles';
import { fmtFecha, fmtPeso } from '../../lib/utils';
import { abrirWhatsApp, abrirWhatsAppListo } from '../../lib/whatsapp';
import { aMinutos } from '../../lib/duracion';
import { ultimaVisita } from '../calendario/ayudaTurno';
import { colorEtiqueta } from '../clientes/ficha/etiquetas';

const sinAnio = f => fmtFecha(f).replace(/ \d{4}$/, '');
const boton = {height:56,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'inherit',fontSize:16,fontWeight:600,cursor:'pointer'};

// Foto más reciente de un tipo, o un botón para sacarla ahí mismo.
function Foto({ foto, tipo, subiendo, onSubir }) {
  const input = useRef(null);
  const titulo = tipo === 'antes' ? 'Antes' : 'Después';
  const fondo = tipo === 'antes' ? '#EFECE7' : '#E4F4EC';
  if (foto) {
    return (
      <figure style={{margin:0,position:'relative',height:140,borderRadius:14,overflow:'hidden',background:fondo}}>
        <img src={foto.url} alt={`${titulo} · ${sinAnio(foto.fecha)}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
        <figcaption style={{position:'absolute',left:0,right:0,bottom:0,padding:'4px 10px',fontSize:12,fontWeight:600,color:'white',background:'linear-gradient(transparent,rgba(0,0,0,.6))'}}>{titulo} · {sinAnio(foto.fecha)}</figcaption>
      </figure>
    );
  }
  const vacio = {height:140,borderRadius:14,background:fondo,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,color:tipo === 'antes' ? C.tintaSuave : '#1F5A44',fontSize:14,border:'none',fontFamily:'inherit',width:'100%'};
  return (
    <>
      <button type="button" disabled={subiendo} onClick={() => input.current.click()} style={{...vacio,cursor:'pointer'}}>
        <Icon name="camera" />{subiendo ? 'Subiendo…' : `Sacar foto de ${titulo.toLowerCase()}`}
      </button>
      <input ref={input} type="file" accept="image/*" capture="environment" style={{display:'none'}}
        onChange={e => { onSubir(tipo, e.target.files[0]); e.target.value = ''; }} />
    </>
  );
}

// Modo mesa: lo que Pau necesita ver con el perro en la mesa. Alertas en grande, cómo lo dejamos la
// última vez (fotos, servicio, notas) y abajo, fijos, Está listo y Cobrar.
// La receta de corte (cuchilla, largo, estilo) llega en la Fase 2; por ahora se muestran las notas.
export default function ModoMesa({ turno: t, cliente: c, fotosHabilitadas, toast, onClose, onCobrar, onEditTurno, onNoVino, onVerFicha }) {
  const [fotos, setFotos] = useState([]);
  const [subiendo, setSubiendo] = useState(null);
  useEscape(true, onClose);

  useEffect(() => {
    if (!fotosHabilitadas || !c.id) return;
    let vivo = true;
    db.getFotos(c.id).then(f => { if (vivo) setFotos(f); }).catch(e => toast(e.message, true));
    return () => { vivo = false; };
  }, [c.id, fotosHabilitadas, toast]);

  const subir = async (tipo, file) => {
    if (!file) return;
    setSubiendo(tipo);
    try { await db.insertFoto(c.id, file, tipo); setFotos(await db.getFotos(c.id)); toast('Foto guardada en la ficha'); }
    catch (e) { toast(e.message, true); }
    setSubiendo(null);
  };

  const nombre = t.dogName || c.dog;
  const ahora = new Date();
  const empezo = t.hora && aMinutos(t.hora) <= ahora.getHours() * 60 + ahora.getMinutes();
  const etiquetas = (c.etiquetas || []).map(e => e?.trim()).filter(e => e && e !== 'Alergia:');
  const alertas = etiquetas.filter(e => colorEtiqueta(e).bg !== C.mentaSuave);
  const otras = etiquetas.filter(e => colorEtiqueta(e).bg === C.mentaSuave);
  const ultima = ultimaVisita(c);
  const foto = tipo => fotos.find(f => f.tipo === tipo);
  const conFotos = fotosHabilitadas && !!c.id;
  const acciones = [
    ...(c.id ? [{ label: 'Ver ficha completa', icon: 'paw', onClick: onVerFicha }] : []),
    { label: 'Editar turno', icon: 'edit', onClick: onEditTurno },
    { label: 'No vino', icon: 'x', onClick: onNoVino, peligro: true },
  ];

  return (
    <div role="dialog" aria-modal="true" aria-label={`Modo mesa: ${nombre}`} style={{position:'fixed',inset:0,zIndex:150,background:'#F6F5F2',display:'flex',flexDirection:'column'}}>
      <div style={{flex:1,overflowY:'auto'}}>
        <div style={{maxWidth:640,margin:'0 auto',padding:'14px 16px 24px',display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <button type="button" onClick={onClose} style={{display:'flex',alignItems:'center',gap:4,height:44,padding:'0 4px',background:'none',border:'none',fontFamily:'inherit',fontSize:16,fontWeight:500,color:C.tinta,cursor:'pointer'}}>
              <Icon name="left" />Hoy
            </button>
            <MenuMas acciones={acciones} label="Más acciones del turno" />
          </div>

          <header style={{display:'flex',gap:16,alignItems:'center'}}>
            <PetAvatar cliente={c} size={80} />
            <div style={{display:'flex',flexDirection:'column',gap:2,minWidth:0}}>
              <span style={{fontSize:12,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:C.verde}}>
                {!t.hora ? 'Hoy · sin hora' : empezo ? `En la mesa · desde las ${t.hora}` : `Viene a las ${t.hora}`}
              </span>
              <h1 style={{margin:0,fontSize:30,fontWeight:600,lineHeight:1.1}}>{nombre}</h1>
              <span style={{fontSize:15,color:C.tintaSuave}}>{[c.raza, t.servicio, c.owner].filter(Boolean).join(' · ')}</span>
            </div>
          </header>

          {(alertas.length > 0 || otras.length > 0) && (
            <section aria-label="Cuidado con" style={{display:'flex',flexDirection:'column',gap:8}}>
              {alertas.map(e => {
                const k = colorEtiqueta(e);
                return (
                  <div key={e} style={{display:'flex',gap:10,alignItems:'center',background:k.bg,color:k.fg,borderRadius:14,padding:14,fontSize:16,fontWeight:600}}>
                    <Icon name="alert" size={20} strokeWidth={2} />{e}
                  </div>
                );
              })}
              {otras.length > 0 && (
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {otras.map(e => <span key={e} style={{fontSize:14,fontWeight:600,background:C.mentaSuave,color:C.verde,borderRadius:999,padding:'6px 12px'}}>{e}</span>)}
                </div>
              )}
            </section>
          )}

          <section aria-label="Cómo lo dejamos" style={{...cardStyle,borderRadius:20,padding:'16px 18px'}}>
            <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:12,marginBottom:10}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:600}}>Cómo lo dejamos</h2>
              {ultima && <span style={{fontSize:13,color:C.tintaSuave}}>{sinAnio(ultima.fecha)}</span>}
            </div>
            {conFotos && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,marginBottom:8}}>
                {['antes', 'despues'].map(tipo => (
                  <Foto key={tipo} tipo={tipo} foto={foto(tipo)}
                    subiendo={subiendo === tipo} onSubir={subir} />
                ))}
              </div>
            )}
            {ultima ? (
              <>
                <div style={{display:'flex',justifyContent:'space-between',gap:12,padding:'11px 0',fontSize:15}}>
                  <span style={{color:C.tintaSuave}}>La última vez</span><span style={{fontWeight:600,textAlign:'right'}}>{ultima.servicio}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',gap:12,padding:'11px 0',borderTop:'1px solid #EFECE7',fontSize:15}}>
                  <span style={{color:C.tintaSuave}}>Se cobró</span><span style={{fontWeight:600}}>{fmtPeso(ultima.precio)}</span>
                </div>
              </>
            ) : <p style={{fontSize:15,color:C.tintaSuave,padding:'6px 0'}}>Es la primera vez que viene 🐾</p>}
            {c.notes && <div style={{marginTop:8,background:'#F6F5F2',borderRadius:12,padding:'10px 12px',fontSize:14,lineHeight:1.45}}>📝 {c.notes}</div>}
          </section>
        </div>
      </div>

      <div style={{background:'white',borderTop:`1px solid ${C.linea}`,padding:'12px 16px 22px'}}>
        <div style={{maxWidth:640,margin:'0 auto',display:'grid',gridTemplateColumns:c.tel ? 'repeat(2,minmax(0,1fr))' : '1fr',gap:8}}>
          {c.tel && (empezo ? (
            <button type="button" onClick={() => abrirWhatsAppListo(c.tel, nombre, c.owner)} title="Avisar por WhatsApp que ya está listo para retirar" style={{...boton,border:'1px solid #D9D5CE',background:'white',color:C.tinta}}>
              <Icon name="chat" />Está listo 🐾
            </button>
          ) : (
            <button type="button" onClick={() => abrirWhatsApp(c.tel, nombre, c.owner, t)} title="Mandar el recordatorio del turno por WhatsApp" style={{...boton,border:'1px solid #D9D5CE',background:'white',color:C.tinta}}>
              <Icon name="chat" />Recordar
            </button>
          ))}
          <button type="button" onClick={onCobrar} style={{...boton,border:'none',background:C.menta,color:C.sobreMenta}}>
            Cobrar{t.precio > 0 ? ` ${fmtPeso(t.precio)}` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
