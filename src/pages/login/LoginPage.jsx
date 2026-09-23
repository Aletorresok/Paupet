import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { C, serif } from '../../lib/styles';
import BetaBanner from '../../components/layout/BetaBanner';
import GlobalStyles from '../../components/layout/GlobalStyles';
import Icon from '../../components/ui/Icon';

// Mensajes de Supabase Auth traducidos.
const traducirError = msg =>
  /invalid login credentials/i.test(msg) ? 'Email o contraseña incorrectos'
  : /email not confirmed/i.test(msg) ? 'El email todavía no está confirmado.'
  : /fetch/i.test(msg) ? 'Sin conexión. Probá de nuevo.'
  : 'Error al ingresar: ' + msg;

const input = error => ({
  width:'100%',height:50,boxSizing:'border-box',padding:'0 14px',borderRadius:12,
  border:`1px solid ${error ? C.rosa : C.lineaFuerte}`,background:'white',fontFamily:'inherit',fontSize:16,color:C.tinta,outline:'none',
});
const label = {fontSize:14,fontWeight:500,display:'block',marginBottom:6};

// Login con usuarios de Supabase Auth. La sesión la guarda supabase-js; App escucha el cambio.
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw]       = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow]   = useState(false);

  const puedeEnviar = email.trim() && pw;

  const handleSubmit = async e => {
    e?.preventDefault();
    if (!puedeEnviar || loading) return;
    setLoading(true); setError('');
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    if (loginError) setError(traducirError(loginError.message));
    setLoading(false);
  };

  return (
    <>
      <GlobalStyles />
      <style>{`
        .login-lado{display:flex}
        .login-logo-movil{display:none}
        @media (max-width: 900px){ .login-lado{display:none} .login-logo-movil{display:flex} }
      `}</style>
      <div style={{position:'fixed',top:0,left:0,right:0,zIndex:10}}><BetaBanner /></div>
      <div style={{minHeight:'100vh',display:'flex',background:C.fondo}}>
        <aside className="login-lado" style={{width:'43%',maxWidth:620,background:C.verdeProfundo,color:'white',padding:56,flexDirection:'column',gap:20,boxSizing:'border-box'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginTop:24}}>
            <div style={{width:44,height:44,borderRadius:12,background:C.menta,color:C.sobreMenta,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="paw" size={24}/></div>
            <span style={{fontFamily:serif,fontSize:24,fontWeight:600}}>Paupet</span>
          </div>
          <div style={{flex:1}}/>
          <h1 style={{margin:0,fontFamily:serif,fontSize:48,fontWeight:500,lineHeight:1.08}}>Tu agenda, tus clientes y tu caja, en un solo lugar.</h1>
          <p style={{margin:0,fontSize:17,color:'#CFE3DA',lineHeight:1.5,maxWidth:440}}>Turnos, recordatorios por WhatsApp, cobros y la imagen de horarios para Stories.</p>
        </aside>

        <main style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'72px 20px 32px'}}>
          <form onSubmit={handleSubmit} style={{width:'100%',maxWidth:400,display:'flex',flexDirection:'column',gap:18}}>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div className="login-logo-movil" style={{width:52,height:52,borderRadius:14,background:C.menta,color:C.sobreMenta,alignItems:'center',justifyContent:'center',marginBottom:8}}><Icon name="paw" size={28}/></div>
              <h2 style={{margin:0,fontFamily:serif,fontSize:32,fontWeight:600}}>Ingresar</h2>
              <span style={{fontSize:15,color:C.tintaSuave}}>Con tu email y contraseña.</span>
            </div>
            <div>
              <label htmlFor="login-email" style={label}>Email</label>
              <input id="login-email" type="email" autoComplete="email" autoFocus value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="nombre@ejemplo.com" style={input(error)} />
            </div>
            <div>
              <label htmlFor="login-pw" style={label}>Contraseña</label>
              <div style={{position:'relative'}}>
                <input id="login-pw" type={show ? 'text' : 'password'} autoComplete="current-password" value={pw}
                  onChange={e => { setPw(e.target.value); setError(''); }} style={{...input(error),paddingRight:88}} />
                <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{position:'absolute',right:6,top:6,height:38,padding:'0 12px',borderRadius:9,border:'none',background:'transparent',color:C.verde,fontFamily:'inherit',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                  {show ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            {error && <p role="alert" style={{margin:0,fontSize:14,color:C.rosa}}>{error}</p>}
            <button type="submit" disabled={loading || !puedeEnviar} style={{
              height:52,borderRadius:12,border:'none',fontFamily:'inherit',fontSize:16,fontWeight:600,
              background:C.menta,color:C.sobreMenta,cursor:loading||!puedeEnviar?'not-allowed':'pointer',opacity:loading||!puedeEnviar?.6:1,
            }}>{loading ? 'Ingresando…' : 'Ingresar'}</button>
            <span style={{fontSize:13,color:C.tintaSuave,textAlign:'center'}}>Acceso sólo para el equipo de Paupet.</span>
          </form>
        </main>
      </div>
    </>
  );
}
