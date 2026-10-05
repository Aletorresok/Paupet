import Icon from '../../components/ui/Icon';
import MenuMas from '../../components/ui/MenuMas';
import PetAvatar from '../../components/ui/PetAvatar';
import { useResp } from '../../context/resp';
import { C, cardStyle } from '../../lib/styles';
import { fmtPeso } from '../../lib/utils';
import { abrirWhatsApp, abrirWhatsAppListo } from '../../lib/whatsapp';
import { rangoTurno, ultimaVisita } from '../calendario/ayudaTurno';
import { colorEtiqueta } from '../clientes/ficha/etiquetas';

const MES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const fechaCorta = f => { const [, m, d] = f.split('-'); return `${parseInt(d)} ${MES_CORTO[parseInt(m) - 1]}`; };

const boton = {height:52,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'inherit',fontSize:16,fontWeight:600,cursor:'pointer',padding:'0 18px'};

// "AHORA · 10:00–11:30", "FALTA COBRAR · …", "EN 20 MIN · …", "PRÓXIMO · …".
function titulo({ turno: t, estado, faltan }) {
  const rango = t.hora ? rangoTurno(t) : 'sin hora';
  if (estado === 'enCurso') return `Ahora · ${rango}`;
  if (estado === 'terminado') return `Falta cobrar · ${rango}`;
  return `${faltan !== null && faltan <= 60 ? `En ${faltan} min` : 'Próximo'} · ${rango}`;
}

// El turno de ahora (o el próximo): quién es, sus cuidados y las dos acciones del momento.
// Pau no marca el inicio: es el último que empezó y no se cobró (ver `turnoActual`).
// Tocar el perro abre su ficha (después, el Modo mesa).
export default function ProximoTurnoCard({ actual, cliente: c, onAbrir, onCobrar, onEditTurno, onNoVino }) {
  const { isMob } = useResp();
  const { turno: t, estado } = actual;
  const enCurso = estado !== 'proximo';
  const etiquetas = (c.etiquetas || []).map(e => e?.trim()).filter(e => e && e !== 'Alergia:');
  const alertas = etiquetas.filter(e => colorEtiqueta(e).bg !== C.mentaSuave);
  const otras = etiquetas.filter(e => colorEtiqueta(e).bg === C.mentaSuave);
  const ultima = !isMob && ultimaVisita(c);
  const nombre = t.dogName || c.dog;
  const detalle = [c.raza, t.servicio, c.owner, !isMob && c.tel].filter(Boolean).join(' · ');
  const acciones = [
    { label: 'Editar turno', icon: 'edit', onClick: () => onEditTurno(t) },
    { label: 'No vino', icon: 'x', onClick: () => onNoVino(t.id), peligro: true },
  ];

  const botones = (
    <div style={{display:'grid',gridTemplateColumns:c.tel ? 'repeat(2,minmax(0,1fr))' : '1fr',gap:8,flex:isMob ? 'none' : '0 0 300px'}}>
      {c.tel && (enCurso ? (
        <button type="button" onClick={() => abrirWhatsAppListo(c.tel, nombre, c.owner)} title="Avisar por WhatsApp que ya está listo para retirar"
          style={{...boton,border:'1px solid #D9D5CE',background:'white',color:C.tinta}}>
          <Icon name="chat" />Está listo
        </button>
      ) : (
        <button type="button" onClick={() => abrirWhatsApp(c.tel, nombre, c.owner, t)} title="Mandar el recordatorio del turno por WhatsApp"
          style={{...boton,border:'1px solid #D9D5CE',background:'white',color:C.tinta}}>
          <Icon name="chat" />Recordar
        </button>
      ))}
      <button type="button" onClick={() => onCobrar(t.id)} style={{...boton,border:'none',background:C.menta,color:C.sobreMenta}}>
        <Icon name="check" strokeWidth={2.2} />Cobrar
      </button>
    </div>
  );

  return (
    <section aria-label="Turno en curso" style={{...cardStyle,borderRadius:20,padding:isMob ? 18 : '22px 24px',display:'flex',flexDirection:'column',gap:isMob ? 14 : 16}}>
      <div style={{display:'flex',gap:isMob ? 14 : 18,alignItems:'center',flexWrap:'wrap'}}>
        <button type="button" onClick={onAbrir} style={{flex:'1 1 220px',minWidth:0,display:'flex',gap:isMob ? 14 : 18,alignItems:'center',background:'none',border:'none',padding:0,textAlign:'left',fontFamily:'inherit',color:C.tinta,cursor:'pointer'}}>
          <PetAvatar cliente={c} size={isMob ? 64 : 96} />
          <span style={{display:'flex',flexDirection:'column',gap:2,minWidth:0}}>
            <span style={{fontSize:12,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:estado === 'terminado' ? C.ambar : C.verde}}>{titulo(actual)}</span>
            <span style={{fontSize:isMob ? 22 : 30,fontWeight:600,lineHeight:1.15}}>{nombre}</span>
            <span style={{fontSize:isMob ? 14 : 15,color:C.tintaSuave}}>{detalle}</span>
          </span>
        </button>
        {!isMob && botones}
        <div style={{alignSelf:'flex-start'}}><MenuMas acciones={acciones} label="Más acciones del turno" /></div>
      </div>

      {alertas.map(e => {
        const k = colorEtiqueta(e);
        return (
          <div key={e} style={{display:'flex',gap:8,alignItems:'center',background:k.bg,color:k.fg,borderRadius:12,padding:'10px 12px',fontSize:isMob ? 14 : 15,fontWeight:600}}>
            <Icon name="alert" size={18} strokeWidth={2} />{e}
          </div>
        );
      })}
      {otras.length > 0 && (
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {otras.map(e => <span key={e} style={{fontSize:13,fontWeight:600,background:C.mentaSuave,color:C.verde,borderRadius:999,padding:'4px 12px'}}>{e}</span>)}
        </div>
      )}
      {(c.notes || ultima) && (
        <div style={{display:'flex',flexDirection:'column',gap:4,fontSize:14,color:C.tintaSuave}}>
          {c.notes && <span>📝 {c.notes}</span>}
          {ultima && <span><strong style={{color:C.tinta,fontWeight:600}}>La última vez:</strong> {fechaCorta(ultima.fecha)} · {ultima.servicio} · {fmtPeso(ultima.precio)}</span>}
        </div>
      )}

      {isMob && botones}
    </section>
  );
}
