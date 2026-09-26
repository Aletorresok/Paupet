import { useResp } from '../../context/resp';
import { useEscape } from '../../hooks/useEscape';

export default function Modal({ open, onClose, children, width = 560 }) {
  const { isMob } = useResp();
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      display:'flex', position:'fixed', inset:0,
      background:'rgba(31,42,38,.5)', zIndex:200,
      alignItems: isMob ? 'flex-end' : 'center',
      justifyContent:'center',
      backdropFilter:'blur(4px)',
      padding: isMob ? 0 : 16,
    }}>
      <div role="dialog" aria-modal="true" style={{
        background:'white', borderRadius: isMob ? '20px 20px 0 0' : 20,
        width: isMob ? '100%' : `min(${width}px, 95vw)`,
        maxWidth: isMob ? '100%' : width,
        maxHeight: isMob ? '92vh' : '88vh',
        overflowY:'auto',
        boxShadow:'0 24px 60px rgba(31,42,38,.25)',
      }}>
        {children}
      </div>
    </div>
  );
}
