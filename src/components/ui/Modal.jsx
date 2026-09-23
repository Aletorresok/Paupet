import { useResp } from '../../context/resp';

export default function Modal({ open, onClose, children, width = 560 }) {
  const { isMob } = useResp();
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      display:'flex', position:'fixed', inset:0,
      background:'rgba(0,0,0,.4)', zIndex:200,
      alignItems: isMob ? 'flex-end' : 'center',
      justifyContent:'center',
      backdropFilter:'blur(4px)',
      padding: isMob ? 0 : 16,
    }}>
      <div style={{
        background:'#faf8f5', borderRadius: isMob ? '18px 18px 0 0' : 18,
        width: isMob ? '100%' : Math.min(width, '95vw'),
        maxWidth: isMob ? '100%' : width,
        maxHeight: isMob ? '92vh' : '88vh',
        overflowY:'auto',
        boxShadow:'0 12px 40px rgba(0,0,0,.15)',
      }}>
        {children}
      </div>
    </div>
  );
}
