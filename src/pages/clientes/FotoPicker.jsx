import { useRef } from 'react';

export default function FotoPicker({ foto, isEdit, onFile }) {
  const inputRef = useRef(null);
  return (
    <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
      <div onClick={() => inputRef.current.click()} style={{width:66,height:66,borderRadius:'50%',background:'#dff5ec',border:'2px dashed #5fbf9b',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:26,overflow:'hidden',flexShrink:0}}>
        {foto ? <img src={foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : '🐾'}
      </div>
      <div>
        <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>Foto del perro</div>
        <div style={{fontSize:11,color:'#9a9090'}}>Hacé click para {isEdit?'cambiar':'subir'}</div>
        <input ref={inputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => { const f = e.target.files[0]; if (f) onFile(f); }} />
      </div>
    </div>
  );
}
