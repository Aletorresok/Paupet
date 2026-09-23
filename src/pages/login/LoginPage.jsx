import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { SESSION_KEY } from '../../lib/constants';

export default function LoginPage({ onLogin }) {
  const [pw, setPw]       = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow]   = useState(false);

  const handleSubmit = async () => {
    if (!pw.trim()) return;
    setLoading(true); setError('');
    try {
      const { data, error: loginError } = await supabase
        .from('config').select('password_hash').eq('id', 1).single();
      if (loginError) throw loginError;
      const stored = data?.password_hash || '';
      const expected = stored.startsWith('pw:') ? stored.slice(3) : stored;
      if (!expected) {
        setError('No hay contraseña configurada.');
      } else if (pw === expected) {
        sessionStorage.setItem(SESSION_KEY, '1');
        onLogin();
      } else {
        setError('Contraseña incorrecta 🔒');
      }
    } catch(e) {
      setError('Error al verificar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        html,body,#root{height:100%;font-family:'Outfit',sans-serif;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <div style={{
        minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        background:'linear-gradient(135deg, #dff5ec 0%, #fde8ed 50%, #e8f4ff 100%)',
        padding:16,
      }}>
        <div style={{position:'fixed',top:40,left:30,fontSize:80,opacity:.06,userSelect:'none',transform:'rotate(-20deg)'}}>🐾</div>
        <div style={{position:'fixed',bottom:60,right:40,fontSize:120,opacity:.05,userSelect:'none',transform:'rotate(15deg)'}}>🐾</div>
        <div style={{position:'fixed',top:'40%',right:60,fontSize:50,opacity:.06,userSelect:'none',transform:'rotate(10deg)'}}>✂️</div>

        <div style={{
          background:'white', borderRadius:24, padding:'40px 36px',
          width:'100%', maxWidth:380,
          boxShadow:'0 20px 60px rgba(0,0,0,.10)',
          animation:'fadeUp .4s ease',
          textAlign:'center',
        }}>
          <div style={{
            width:72, height:72, background:'linear-gradient(135deg,#4caf8e,#5fbf9b)',
            borderRadius:'50%', margin:'0 auto 16px',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:32, boxShadow:'0 8px 24px rgba(95,191,155,.35)',
          }}>🐾</div>

          <h1 style={{fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:600, marginBottom:4}}>Paupet</h1>
          <p style={{fontSize:13, color:'#9a9090', marginBottom:32}}>Peluquería Canina · Panel de gestión</p>

          <div style={{textAlign:'left', marginBottom:20}}>
            <label style={{fontSize:11, color:'#9a9090', textTransform:'uppercase', letterSpacing:.6, fontWeight:500, display:'block', marginBottom:6}}>Contraseña</label>
            <div style={{position:'relative'}}>
              <input
                type={show ? 'text' : 'password'}
                value={pw}
                onChange={e => { setPw(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                autoFocus
                style={{
                  width:'100%', border:`1.5px solid ${error?'#e8809a':'#ede8e8'}`,
                  borderRadius:12, padding:'12px 44px 12px 16px',
                  fontFamily:"'Outfit',sans-serif", fontSize:15, outline:'none',
                  background:'#faf8f5', color:'#2e2828', boxSizing:'border-box',
                  transition:'border-color .2s',
                }}
              />
              <button
                onClick={() => setShow(s => !s)}
                style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:16,color:'#9a9090',padding:0,lineHeight:1}}
              >{show ? '🙈' : '👁'}</button>
            </div>
            {error && <p style={{fontSize:12, color:'#e8809a', marginTop:8}}>{error}</p>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !pw.trim()}
            style={{
              width:'100%', padding:'13px 20px',
              background: loading || !pw.trim() ? '#b8ddd0' : 'linear-gradient(135deg,#4caf8e,#5fbf9b)',
              color:'white', border:'none', borderRadius:50,
              fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:15,
              cursor: loading || !pw.trim() ? 'not-allowed' : 'pointer',
              transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}
          >
            {loading
              ? <><div style={{width:16,height:16,border:'2px solid rgba(255,255,255,.4)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>Verificando...</>
              : '🔓 Ingresar'
            }
          </button>

          <p style={{fontSize:11, color:'#c0b8b8', marginTop:20, lineHeight:1.5}}>
            Acceso restringido al equipo de Paupet
          </p>
        </div>
      </div>
    </>
  );
}
