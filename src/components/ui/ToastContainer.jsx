import { useResp } from '../../context/resp';

export default function ToastContainer({ toasts }) {
  const { isMob } = useResp();
  return (
    <div style={{
      position:'fixed', bottom: isMob ? 16 : 24,
      right: isMob ? 16 : 24, left: isMob ? 16 : 'auto',
      zIndex:9999, display:'flex', flexDirection:'column', gap:8,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background:'white', borderRadius:10, padding:'12px 18px',
          boxShadow:'0 12px 40px rgba(0,0,0,.12)', fontSize:13, fontWeight:500,
          display:'flex', alignItems:'center', gap:8,
          borderLeft:`3px solid ${t.error ? '#e8809a' : '#5fbf9b'}`,
          animation:'toastIn .3s ease',
        }}>
          <span>{t.error ? '⚠️' : '✅'}</span>{t.msg}
        </div>
      ))}
    </div>
  );
}
