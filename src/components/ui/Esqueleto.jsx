import { useResp } from '../../context/resp';
import { C } from '../../lib/styles';

const bloque = (h, extra = {}) => ({ height: h, borderRadius: 16, background: '#EDE7DF', animation: 'pulso 1.4s ease-in-out infinite', ...extra });

// Silueta de la pantalla mientras cargan los datos (en vez de un círculo girando).
export default function Esqueleto() {
  const { isMob } = useResp();
  return (
    <div aria-busy="true" aria-label="Cargando" style={{display:'flex',flexDirection:'column',gap:16}}>
      <style>{'@keyframes pulso{0%,100%{opacity:1}50%{opacity:.45}}'}</style>
      <div style={bloque(14, {width:140, borderRadius:6})} />
      <div style={bloque(34, {width:isMob?'80%':420, borderRadius:8})} />
      <div style={{display:'grid',gridTemplateColumns:`repeat(${isMob?2:4},minmax(0,1fr))`,gap:isMob?10:16}}>
        {[0,1,2,3].map(i => <div key={i} style={bloque(96, i === 1 ? {background:'#D5E3DC'} : {border:`1px solid ${C.linea}`})} />)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1.55fr 1fr',gap:20}}>
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={bloque(140, {background:'#D5E3DC'})} />
          <div style={bloque(220)} />
        </div>
        {!isMob && <div style={bloque(380)} />}
      </div>
    </div>
  );
}
