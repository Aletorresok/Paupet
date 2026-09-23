import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import BetaBanner from '../../components/layout/BetaBanner';

// Mensajes de Supabase Auth traducidos.
const traducirError = msg =>
  /invalid login credentials/i.test(msg) ? 'Email o contraseña incorrectos 🔒'
  : /email not confirmed/i.test(msg) ? 'El email todavía no está confirmado.'
  : /fetch/i.test(msg) ? 'Sin conexión. Probá de nuevo.'
  : 'Error al ingresar: ' + msg;

// Login con usuarios de Supabase Auth. La sesión la guarda supabase-js; App escucha el cambio.
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw]       = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow]   = useState(false);

  const puedeEnviar = email.trim() && pw;

  const handleSubmit = async () => {
    if (!puedeEnviar || loading) return;
    setLoading(true); setError('');
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    if (loginError) setError(traducirError(loginError.message));
    setLoading(false);
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
      <div style={{position:'fixed',top:0,left:0,right:0,zIndex:10}}><BetaBanner /></div>
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

          <div style={{textAlign:'left', marginBottom:14}}>
            <label htmlFor="login-email" style={{fontSize:11, color:'#9a9090', textTransform:'uppercase', letterSpacing:.6, fontWeight:500, display:'block', marginBottom:6}}>Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="nombre@ejemplo.com"
              autoFocus
              style={{
                width:'100%', border:`1.5px solid ${error?'#e8809a':'#ede8e8'}`,
                borderRadius:12, padding:'12px 16px',
                fontFamily:"'Outfit',sans-serif", fontSize:15, outline:'none',
                background:'#faf8f5', color:'#2e2828', boxSizing:'border-box',
              }}
            />
          </div>

          <div style={{textAlign:'left', marginBottom:20}}>
            <label htmlFor="login-pw" style={{fontSize:11, color:'#9a9090', textTransform:'uppercase', letterSpacing:.6, fontWeight:500, display:'block', marginBottom:6}}>Contraseña</label>
            <div style={{position:'relative'}}>
              <input
                id="login-pw"
                autoComplete="current-password"
                type={show ? 'text' : 'password'}
                value={pw}
                onChange={e => { setPw(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                style={{
                  width:'100%', border:`1.5px solid ${error?'#e8809a':'#ede8e8'}`,
                  borderRadius:12, padding:'12px 44px 12px 16px',
                  fontFamily:"'Outfit',sans-serif", fontSize:15, outline:'none',
                  background:'#faf8f5', color:'#2e2828', boxSizing:'border-box',
                  transition:'border-color .2s',
                }}
              />
              <button
                type="button"
                aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShow(s => !s)}
                style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:16,color:'#9a9090',padding:0,lineHeight:1}}
              >{show ? '🙈' : '👁'}</button>
            </div>
            {error && <p style={{fontSize:12, color:'#e8809a', marginTop:8}}>{error}</p>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !puedeEnviar}
            style={{
              width:'100%', padding:'13px 20px',
              background: loading || !puedeEnviar ? '#b8ddd0' : 'linear-gradient(135deg,#4caf8e,#5fbf9b)',
              color:'white', border:'none', borderRadius:50,
              fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:15,
              cursor: loading || !puedeEnviar ? 'not-allowed' : 'pointer',
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
