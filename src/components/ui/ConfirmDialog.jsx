import Btn from './Btn';
import { useEscape } from '../../hooks/useEscape';

export default function ConfirmDialog({ open, msg, onConfirm, onCancel }) {
  useEscape(open, onCancel);
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onCancel?.()} style={{position:'fixed',inset:0,zIndex:9000,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,backdropFilter:'blur(4px)'}}>
      <div role="alertdialog" aria-modal="true" style={{background:'white',borderRadius:18,padding:28,maxWidth:340,width:'100%',boxShadow:'0 12px 40px rgba(0,0,0,.15)',textAlign:'center'}}>
        <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
        <p style={{fontSize:14,marginBottom:20,lineHeight:1.6,color:'#1F2A26'}}>{msg}</p>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
          <Btn variant="pink" onClick={onConfirm}>Confirmar</Btn>
        </div>
      </div>
    </div>
  );
}
