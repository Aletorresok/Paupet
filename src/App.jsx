import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

// ══════════════════════════════════════════════
//  RESPONSIVE HOOK
// ══════════════════════════════════════════════
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

// ══════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DIAS_CONF = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const CAL_DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DIAS_CONFIG = [
  {key:'lunes',    label:'Lunes',    emoji:'🌿'},
  {key:'martes',   label:'Martes',   emoji:'🌸'},
  {key:'miercoles',label:'Miércoles',emoji:'🌿'},
  {key:'jueves',   label:'Jueves',   emoji:'🌸'},
  {key:'viernes',  label:'Viernes',  emoji:'🌿'},
  {key:'sabado',   label:'Sábado',   emoji:'🌸'},
  {key:'domingo',  label:'Domingo',  emoji:'☀️'},
];

const DEFAULT_CONFIG = {
  nombre: 'Paupet Peluquería',
  msg: '¡Hola! Reservá el turno de tu peludo. 🐾',
  anticip: 30,
  horarios: {
    lunes:    {open:true,  desde:'09:00',hasta:'18:00'},
    martes:   {open:true,  desde:'09:00',hasta:'18:00'},
    miercoles:{open:true,  desde:'09:00',hasta:'18:00'},
    jueves:   {open:true,  desde:'09:00',hasta:'18:00'},
    viernes:  {open:true,  desde:'09:00',hasta:'17:00'},
    sabado:   {open:true,  desde:'09:00',hasta:'13:00'},
    domingo:  {open:false, desde:'09:00',hasta:'13:00'},
  },
  slots: {}
};

// ══════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════
const todayStr = () => new Date().toISOString().split('T')[0];
const fmtFecha = f => {
  if (!f) return '–';
  const d = new Date(f + 'T12:00:00');
  return `${d.getDate()} de ${MESES[d.getMonth()]} ${d.getFullYear()}`;
};
const fmtPeso = n => '$' + (n || 0).toLocaleString('es-AR');

// Abre WhatsApp con mensaje predefinido
const abrirWhatsApp = (tel, dogName, ownerName, turno = null) => {
  if (!tel) return;
  // Limpiar teléfono: sacar espacios, guiones, paréntesis; agregar 549 si es ARG
  let num = tel.replace(/[\s\-()]/g, '');
  if (!num.startsWith('+') && !num.startsWith('549')) {
    // Asumir Argentina, sacar el 0 inicial si existe
    num = num.replace(/^0/, '');
    num = '549' + num;
  } else {
    num = num.replace('+', '');
  }
  let msg;
  if (turno) {
    msg = `¡Hola ${ownerName}! 🐾 Te recordamos el turno de *${dogName}* para el *${fmtFecha(turno.fecha)}* a las *${turno.hora}hs*. ¡Te esperamos! ✂️`;
  } else {
    msg = `¡Hola ${ownerName}! Te contactamos desde Paupet Peluquería Canina 🐾`;
  }
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
};
const animalIcon = (raza = '') => {
  const r = raza.toLowerCase();
  if (r.includes('caniche') || r.includes('poodle')) return '🐩';
  if (r.includes('golden')) return '🦮';
  if (r.includes('gato')) return '🐱';
  return '🐶';
};
const durLabel = min => {
  if (min < 60) return min + ' min';
  if (min === 60) return '1 hora';
  if (min === 90) return '1:30 hs';
  if (min === 120) return '2 horas';
  return min + 'min';
};

// ══════════════════════════════════════════════
//  SUPABASE DATA LAYER
//  ⚠️  RLS: En Supabase → Authentication → Policies,
//  activar RLS en cada tabla y agregar policy:
//  "Enable read/write for authenticated users only"
//  o usar anon key con policies permisivas si es uso personal.
// ══════════════════════════════════════════════
const db = {
  // FOTOS — Supabase Storage
  // Requiere crear bucket "fotos" en Supabase → Storage → New bucket (público)
  async uploadFoto(file, clienteId) {
    const ext = file.name.split('.').pop();
    const path = `clientes/${clienteId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('fotos').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('fotos').getPublicUrl(path);
    return data.publicUrl;
  },

  // CLIENTES
  async getClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*, visitas(*)')
      .order('created_at', { ascending: true });
    if (error) throw error;
    // Normalize to match app shape
    return data.map(c => ({
      ...c,
      visitas: (c.visitas || []).map(v => ({
        servicio: v.servicio,
        precio: v.precio,
        fecha: v.fecha
      }))
    }));
  },
  async insertCliente(c) {
    const { data, error } = await supabase
      .from('clientes')
      .insert({ dog:c.dog, owner:c.owner, raza:c.raza||'', size:c.size||'', pelaje:c.pelaje||'', tel:c.tel||'', notes:c.notes||'', foto:c.foto||null, inasistencias:0 })
      .select('*, visitas(*)')
      .single();
    if (error) throw error;
    return { ...data, visitas: [] };
  },
  async updateCliente(id, fields) {
    const allowed = ['dog','owner','raza','size','pelaje','tel','notes','foto','inasistencias'];
    const update = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
    const { error } = await supabase.from('clientes').update(update).eq('id', id);
    if (error) throw error;
  },
  async deleteCliente(id) {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
  },

  // VISITAS
  async insertVisita(clienteId, servicio, precio, fecha) {
    const { error } = await supabase
      .from('visitas')
      .insert({ cliente_id: clienteId, servicio, precio, fecha });
    if (error) throw error;
  },

  // TURNOS
  async getTurnos() {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .order('fecha', { ascending: true });
    if (error) throw error;
    return data.map(t => ({
      ...t,
      clientId: t.cliente_id,
      dogName: t.dog_name,
      fromPortal: t.from_portal,
    }));
  },
  async insertTurno(t) {
    const { error } = await supabase.from('turnos').insert({
      id: 't' + Date.now(),
      cliente_id: t.clientId,
      dog_name: t.dogName || '',
      servicio: t.servicio,
      fecha: t.fecha,
      hora: t.hora || '',
      precio: t.precio || 0,
      estado: t.estado || 'pending',
      from_portal: t.fromPortal || false,
    });
    if (error) throw error;
  },
  async updateTurno(id, fields) {
    const { error } = await supabase.from('turnos').update(fields).eq('id', id);
    if (error) throw error;
  },
  async deleteTurno(id) {
    const { error } = await supabase.from('turnos').delete().eq('id', id);
    if (error) throw error;
  },

  // NOTAS
  async getNotas() {
    const { data, error } = await supabase.from('notas').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(n => ({
      ...n,
      notas: n.notas_texto,
    }));
  },
  async insertNota(n) {
    const { error } = await supabase.from('notas').insert({
      tipo: n.tipo,
      item: n.item || '',
      cantidad: n.cantidad || 1,
      precio: n.precio || 0,
      notas_texto: n.notas || '',
      concepto: n.concepto || '',
      categoria: n.categoria || '',
      monto: n.monto || 0,
      fecha: n.fecha || todayStr(),
      completada: false,
    });
    if (error) throw error;
  },
  async updateNota(id, fields) {
    const { error } = await supabase.from('notas').update(fields).eq('id', id);
    if (error) throw error;
  },
  async deleteNota(id) {
    const { error } = await supabase.from('notas').delete().eq('id', id);
    if (error) throw error;
  },

  // CONFIG
  async getConfig() {
    const { data, error } = await supabase.from('config').select('*').eq('id', 1).single();
    if (error) return DEFAULT_CONFIG;
    return {
      nombre: data.nombre,
      msg: data.msg,
      anticip: data.anticip,
      horarios: data.horarios || DEFAULT_CONFIG.horarios,
      slots: data.slots || {},
    };
  },
  async saveConfig(cfg) {
    const { error } = await supabase.from('config').upsert({
      id: 1,
      nombre: cfg.nombre,
      msg: cfg.msg,
      anticip: cfg.anticip,
      horarios: cfg.horarios,
      slots: cfg.slots,
    });
    if (error) throw error;
  },
};

// ══════════════════════════════════════════════
//  UI PRIMITIVES
// ══════════════════════════════════════════════
function ToastContainer({ toasts }) {
  return (
    <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,display:'flex',flexDirection:'column',gap:8}}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background:'white',borderRadius:10,padding:'12px 18px',
          boxShadow:'0 12px 40px rgba(0,0,0,.12)',fontSize:13,fontWeight:500,
          display:'flex',alignItems:'center',gap:8,
          borderLeft:`3px solid ${t.error ? '#e8809a' : '#5fbf9b'}`,
          maxWidth:280,animation:'toastIn .3s ease'
        }}>
          <span>{t.error ? '⚠️' : '✅'}</span>{t.msg}
        </div>
      ))}
    </div>
  );
}

function Modal({ open, onClose, children, width = 560 }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      display:'flex',position:'fixed',inset:0,
      background:'rgba(0,0,0,.35)',zIndex:200,
      alignItems:'center',justifyContent:'center',
      backdropFilter:'blur(4px)'
    }}>
      <div style={{
        background:'#faf8f5',borderRadius:18,
        width,maxHeight:'88vh',overflowY:'auto',
        boxShadow:'0 12px 40px rgba(0,0,0,.12)',
        animation:'slideUp .3s ease'
      }}>
        {children}
      </div>
    </div>
  );
}

function ModalHead({ title, subtitle, onClose, avatar }) {
  return (
    <div style={{
      background:'linear-gradient(135deg,#dff5ec,#fde8ed)',
      padding:'24px 26px 18px',display:'flex',gap:16,
      position:'relative',
      flexDirection: avatar ? 'row' : 'column',
      alignItems: avatar ? 'flex-end' : 'flex-start'
    }}>
      {avatar && (
        <div style={{width:72,height:72,borderRadius:'50%',background:'white',border:'3px solid white',boxShadow:'0 4px 20px rgba(0,0,0,.08)',fontSize:34,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
          {avatar}
        </div>
      )}
      <div>
        <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22}}>{title}</h3>
        {subtitle && <p style={{color:'#9a9090',fontSize:12}}>{subtitle}</p>}
      </div>
      <button onClick={onClose} style={{position:'absolute',top:12,right:12,background:'white',border:'none',borderRadius:'50%',width:28,height:28,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,.06)',color:'#9a9090'}}>✕</button>
    </div>
  );
}

const badgeColors = {
  green:  {bg:'#dff5ec',color:'#3a9b7b'},
  pink:   {bg:'#fde8ed',color:'#e8809a'},
  orange: {bg:'#fff3e0',color:'#e6860a'},
  gray:   {bg:'#f0eeed',color:'#9a9090'},
  blue:   {bg:'#e3f0ff',color:'#3a7bd5'},
};
function Badge({ variant, children }) {
  const c = badgeColors[variant] || badgeColors.gray;
  return <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:c.bg,color:c.color}}>{children}</span>;
}

function Btn({ variant='primary', size='', onClick, children, style={}, disabled=false }) {
  const styles = { primary:{background:'#5fbf9b',color:'white'}, pink:{background:'#e8809a',color:'white'}, ghost:{background:'transparent',color:'#9a9090',border:'1.5px solid #ede8e8'} };
  const sizes  = { '':{padding:'10px 20px',fontSize:13}, sm:{padding:'7px 14px',fontSize:12}, xs:{padding:'5px 10px',fontSize:11} };
  return (
    <button onClick={onClick} disabled={disabled} style={{display:'inline-flex',alignItems:'center',gap:7,border:'none',borderRadius:50,cursor:disabled?'not-allowed':'pointer',fontFamily:"'Outfit',sans-serif",fontWeight:500,whiteSpace:'nowrap',transition:'all .2s',opacity:disabled?.6:1,...styles[variant],...sizes[size],...style}}>
      {children}
    </button>
  );
}

function FormGroup({ label, children }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      <label style={{fontSize:11,color:'#9a9090',textTransform:'uppercase',letterSpacing:.6,fontWeight:500}}>{label}</label>
      {children}
    </div>
  );
}
const inputStyle = {border:'1.5px solid #ede8e8',borderRadius:10,padding:'9px 12px',fontFamily:"'Outfit',sans-serif",fontSize:13,outline:'none',background:'white',color:'#2e2828',width:'100%',boxSizing:'border-box'};

// Loading spinner
function Spinner() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flex:1}}>
      <div style={{width:36,height:36,border:'3px solid #dff5ec',borderTop:'3px solid #5fbf9b',borderRadius:'50%',animation:'spin 1s linear infinite'}} />
    </div>
  );
}

// ══════════════════════════════════════════════
//  SIDEBAR
// ══════════════════════════════════════════════
const NAV_ITEMS = [
  {page:'dashboard', icon:'🏠', label:'Panel de Control'},
  {page:'clientes',  icon:'🐶', label:'Gestión de Clientes'},
  {page:'calendario',icon:'📅', label:'Calendario de Turnos', badge:true},
  {page:'historial', icon:'📋', label:'Historial de Visitas'},
  {page:'notas',     icon:'📝', label:'Notas & Stock'},
  {page:'horarios',  icon:'📸', label:'Horarios Semanales'},
  {page:'config',    icon:'⚙️', label:'Configuración'},
];

function Sidebar({ activePage, onNav, pendingCount, mobileOpen, onMobileClose }) {
  const w = useWindowWidth();
  const isMob = w < 768;

  const handleNav = (p) => { onNav(p); if (isMob) onMobileClose(); };

  const inner = (
    <nav style={{
      width:230, minWidth:230, height:'100%',
      background:'linear-gradient(180deg,#4caf8e 0%,#5fbf9b 40%,#c5879a 100%)',
      display:'flex', flexDirection:'column', padding:'24px 14px',
      position:'relative', zIndex:20, boxShadow:'4px 0 24px rgba(0,0,0,.08)', overflow:'hidden',
    }}>
      <div style={{position:'absolute',top:-60,right:-60,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,.07)'}}/>
      <div style={{position:'absolute',bottom:-40,left:-40,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,.05)'}}/>

      {/* Botón cerrar — solo mobile */}
      {isMob && (
        <button onClick={onMobileClose} style={{
          position:'absolute',top:14,right:14,zIndex:10,width:28,height:28,
          background:'rgba(255,255,255,.25)',border:'none',borderRadius:'50%',
          color:'white',fontSize:14,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
        }}>✕</button>
      )}

      <div style={{textAlign:'center',marginBottom:32,position:'relative',zIndex:1}}>
        <div style={{width:54,height:54,background:'white',borderRadius:'50%',margin:'0 auto 8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,boxShadow:'0 4px 16px rgba(0,0,0,.15)'}}>🐾</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'white',letterSpacing:.5}}>Paupet</h1>
        <span style={{fontSize:10,color:'rgba(255,255,255,.7)',fontWeight:300,letterSpacing:1,textTransform:'uppercase'}}>Peluquería Canina</span>
      </div>

      <div style={{flex:1,display:'flex',flexDirection:'column',gap:3,position:'relative',zIndex:1}}>
        {NAV_ITEMS.map(item => (
          <div key={item.page} onClick={() => handleNav(item.page)} style={{
            display:'flex',alignItems:'center',gap:10,padding:'11px 13px',borderRadius:10,cursor:'pointer',
            fontSize:13,fontWeight:activePage===item.page?500:400,
            background:activePage===item.page?'white':'transparent',
            color:activePage===item.page?'#2e2828':'rgba(255,255,255,.8)',
            boxShadow:activePage===item.page?'0 4px 20px rgba(0,0,0,.08)':'none',
            transition:'all .2s',
          }}>
            <span style={{fontSize:16,width:20,textAlign:'center',flexShrink:0}}>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && pendingCount > 0 && (
              <span style={{marginLeft:'auto',background:'#e8809a',color:'white',fontSize:10,fontWeight:600,borderRadius:20,padding:'2px 7px',minWidth:18,textAlign:'center'}}>{pendingCount}</span>
            )}
          </div>
        ))}
      </div>
    </nav>
  );

  // Desktop: sidebar fijo normal
  if (!isMob) return inner;

  // Mobile: drawer deslizable desde la izquierda
  return (
    <>
      {mobileOpen && (
        <div onClick={onMobileClose} style={{
          position:'fixed',inset:0,zIndex:997,
          background:'rgba(0,0,0,.5)',backdropFilter:'blur(2px)',
        }}/>
      )}
      <div style={{
        position:'fixed',top:0,left:0,bottom:0,zIndex:998,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform .28s cubic-bezier(.4,0,.2,1)',
      }}>
        {inner}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════
function Dashboard({ clientes, turnos, onNav, onCompletar, onNoVino }) {
  const hoy = new Date();
  const hoyISO = todayStr();
  const hoyTurnos = turnos.filter(t => t.fecha === hoyISO && t.estado !== 'completed');
  const pending = turnos.filter(t => t.estado === 'pending');
  const mes = hoy.getMonth(), yr = hoy.getFullYear();
  const ing = turnos.filter(t => t.estado==='completed' && new Date(t.fecha).getMonth()===mes && new Date(t.fecha).getFullYear()===yr).reduce((s,t) => s+(t.precio||0), 0);
  const conInasistencias = clientes.filter(c => c.inasistencias > 0).sort((a,b) => b.inasistencias-a.inasistencias);

  const stats = [
    {label:'Clientes Activos', val:clientes.length, sub:'mascotas registradas', emoji:'🐶'},
    {label:'Turnos Hoy', val:hoyTurnos.length, sub:'pendientes y confirmados', emoji:'📅'},
    {label:'Ingresos del Mes', val:fmtPeso(ing), sub:'visitas completadas', emoji:'💚'},
    {label:'Pendientes', val:pending.length, sub:'esperando confirmación', emoji:'⏳'},
  ];

  return (
    <section>
      <div style={{marginBottom:24,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600,lineHeight:1.1}}>Panel de Control 🌸</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>{DIAS_ES[hoy.getDay()]}, {hoy.getDate()} de {MESES[hoy.getMonth()]} de {hoy.getFullYear()}</p>
        </div>
        <Btn onClick={() => onNav('calendario')}>+ Nuevo turno</Btn>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        {stats.map(s => (
          <div key={s.label} style={{background:'white',borderRadius:18,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',right:-8,top:-4,fontSize:52,opacity:.1}}>{s.emoji}</div>
            <div style={{fontSize:11,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5}}>{s.label}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:600,lineHeight:1,margin:'4px 0'}}>{s.val}</div>
            <div style={{fontSize:11,color:'#9a9090'}}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:18}}>
        <div style={{background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,marginBottom:14}}>Turnos de hoy</div>
          {!hoyTurnos.length ? <p style={{fontSize:13,color:'#9a9090',textAlign:'center',padding:16}}>Sin turnos para hoy</p>
            : hoyTurnos.map(t => {
              const c = clientes.find(x => x.id===t.clientId)||{};
              return (
                <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #dff5ec'}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'#fde8ed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,overflow:'hidden'}}>
                    {c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : animalIcon(c.raza)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500}}>{t.dogName||c.dog} <Badge variant={t.estado==='confirmed'?'green':'orange'}>{t.estado==='confirmed'?'Confirmado':'Pendiente'}</Badge></div>
                    <div style={{fontSize:11,color:'#9a9090'}}>{t.servicio} · {t.hora}</div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    {c.tel && (
                      <Btn size="xs" onClick={() => abrirWhatsApp(c.tel, t.dogName||c.dog, c.owner, t)}
                        style={{background:'#25d366',color:'white',border:'none'}}>
                        💬
                      </Btn>
                    )}
                    <Btn size="xs" onClick={() => onCompletar(t.id)}>✓ Completar</Btn>
                    <Btn size="xs" variant="pink" onClick={() => onNoVino(t.id)}>✕ No vino</Btn>
                  </div>
                </div>
              );
            })
          }
        </div>
        <div style={{background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,marginBottom:14}}>Clientes con inasistencias</div>
          {!conInasistencias.length ? <p style={{fontSize:13,color:'#9a9090',textAlign:'center',padding:16}}>Excelente, todos vinieron 👍</p>
            : conInasistencias.map(c => (
              <div key={c.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #dff5ec'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'#fde8ed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
                  {c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : animalIcon(c.raza)}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{c.dog}</div>
                  <div style={{fontSize:11,color:'#9a9090'}}>{c.owner} · {c.tel}</div>
                </div>
                <Badge variant="orange">{c.inasistencias} inasist.</Badge>
              </div>
            ))
          }
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  CLIENTES PAGE
// ══════════════════════════════════════════════
function ClientesPage({ clientes, onOpenClient, onNuevo }) {
  const [q, setQ] = useState('');
  const filtered = clientes.filter(c => c.dog.toLowerCase().includes(q.toLowerCase()) || c.owner.toLowerCase().includes(q.toLowerCase()));
  return (
    <section>
      <div style={{marginBottom:24,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600}}>Gestión de Clientes</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Base de datos de mascotas y dueños</p>
        </div>
        <Btn onClick={onNuevo}>+ Nuevo cliente</Btn>
      </div>
      <div style={{marginBottom:16,display:'flex',gap:12,alignItems:'center'}}>
        <div style={{flex:1,maxWidth:340,display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <span>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar perrito o dueño..." style={{border:'none',outline:'none',fontFamily:"'Outfit',sans-serif",fontSize:13,width:'100%',background:'transparent'}} />
        </div>
        <span style={{fontSize:13,color:'#9a9090'}}>{filtered.length} cliente{filtered.length!==1?'s':''}</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:16}}>
        {!filtered.length ? <p style={{color:'#9a9090',fontSize:14,padding:'24px 0'}}>Sin clientes. ¡Agregá el primero!</p>
          : filtered.map(c => {
            const ultima = c.visitas?.length ? c.visitas[c.visitas.length-1] : null;
            const dias = ultima ? Math.floor((Date.now()-new Date(ultima.fecha))/86400000) : null;
            const bv = dias===null?'gray':dias>30?'pink':'green';
            const bt = dias===null?'Sin visitas':dias===0?'Hoy':`Hace ${dias}d`;
            return (
              <div key={c.id} onClick={() => onOpenClient(c.id)} style={{background:'white',borderRadius:18,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.06)',cursor:'pointer',transition:'all .22s'}}>
                <div style={{height:130,background:'linear-gradient(135deg,#dff5ec,#fde8ed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:50,overflow:'hidden'}}>
                  {c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={c.dog} /> : <span>{animalIcon(c.raza)}</span>}
                </div>
                <div style={{padding:'13px 15px'}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600}}>{c.dog}</div>
                  <div style={{fontSize:11,color:'#9a9090',marginBottom:8}}>👤 {c.owner}{c.tel?` · 📱 ${c.tel}`:''}</div>
                  {c.raza && <div style={{fontSize:11,color:'#9a9090',marginBottom:8}}>🐾 {c.raza}{c.size?' · '+c.size:''}</div>}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <Badge variant={bv}>{bt}</Badge>
                    <span style={{fontSize:11,color:'#9a9090'}}>{(c.visitas||[]).length} visita{(c.visitas||[]).length!==1?'s':''}</span>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  MODAL CLIENTE (perfil)
// ══════════════════════════════════════════════
function ModalCliente({ open, cliente, onClose, onSaveVisit, onDelete, onEdit, onDecrementarInasistencia }) {
  const [showForm, setShowForm] = useState(false);
  const [svc, setSvc] = useState('');
  const [precio, setPrecio] = useState('');
  const [fecha, setFecha] = useState(todayStr());
  useEffect(() => { if (open) { setShowForm(false); setSvc(''); setPrecio(''); setFecha(todayStr()); } }, [open]);
  if (!open || !cliente) return null;
  const c = cliente;
  return (
    <Modal open={open} onClose={onClose}>
      <ModalHead title={c.dog} subtitle={`👤 ${c.owner}${c.tel?' · 📱 '+c.tel:''}`} onClose={onClose}
        avatar={c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : <span style={{fontSize:34}}>{animalIcon(c.raza)}</span>}
      />
      <div style={{padding:'20px 26px'}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
          {[{l:'Raza',v:c.raza||'–'},{l:'Tamaño',v:c.size||'–'},{l:'Pelaje',v:c.pelaje||'–'},{l:'Visitas',v:(c.visitas||[]).length}].map(ch=>(
            <div key={ch.l} style={{background:'white',borderRadius:10,padding:'9px 13px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',minWidth:90,flex:1}}>
              <div style={{fontSize:10,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5}}>{ch.l}</div>
              <div style={{fontSize:13,fontWeight:500,marginTop:1}}>{ch.v}</div>
            </div>
          ))}
        </div>
        {(c.inasistencias||0) > 0 && (
          <div style={{marginBottom:16,padding:12,background:'#fde8ed',borderRadius:10}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'#e8809a',marginBottom:4}}>INASISTENCIAS</div>
                <div style={{fontSize:20,fontWeight:600,color:'#e8809a'}}>{c.inasistencias}</div>
              </div>
              <Btn size="sm" variant="pink" onClick={() => onDecrementarInasistencia(c.id)}>➖ Restar</Btn>
            </div>
          </div>
        )}
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:600,marginBottom:8}}>📝 Notas</div>
        <div style={{background:'#fde8ed',borderRadius:10,padding:'12px 14px',fontSize:13,lineHeight:1.6,borderLeft:'3px solid #e8809a',marginBottom:14}}>{c.notes||'Sin notas especiales.'}</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:600,margin:'14px 0 8px'}}>✂️ Historial de visitas</div>
        {!(c.visitas||[]).length ? <p style={{fontSize:13,color:'#9a9090'}}>Sin visitas aún</p>
          : [...(c.visitas||[])].reverse().map((v,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,background:'white',borderRadius:10,padding:'10px 13px',marginBottom:7,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#5fbf9b',flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500}}>{v.servicio}</div>
                <div style={{fontSize:11,color:'#9a9090'}}>{fmtFecha(v.fecha)}</div>
              </div>
              <div style={{fontSize:13,fontWeight:600,color:'#3a9b7b'}}>{fmtPeso(v.precio)}</div>
            </div>
          ))
        }
        <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
          <Btn size="sm" onClick={() => setShowForm(!showForm)}>+ Registrar visita</Btn>
          {c.tel && (
            <Btn size="sm" variant="ghost" onClick={() => abrirWhatsApp(c.tel, c.dog, c.owner)}
              style={{background:'#25d366',color:'white',border:'none'}}>
              💬 WhatsApp
            </Btn>
          )}
          <Btn size="sm" variant="ghost" onClick={() => onEdit(c)}>✏️ Editar</Btn>
          <Btn size="sm" variant="ghost" onClick={() => onDelete(c.id)}>🗑 Eliminar</Btn>
        </div>
        {showForm && (
          <div style={{background:'#dff5ec',borderRadius:10,padding:14,marginTop:10}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
              <FormGroup label="Servicio"><input value={svc} onChange={e=>setSvc(e.target.value)} placeholder="Baño y corte" style={inputStyle} /></FormGroup>
              <FormGroup label="Precio"><input type="number" value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="0" style={inputStyle} /></FormGroup>
              <FormGroup label="Fecha"><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inputStyle} /></FormGroup>
            </div>
            <Btn size="sm" onClick={() => { onSaveVisit(c.id, svc, parseFloat(precio)||0, fecha); setShowForm(false); setSvc(''); setPrecio(''); }}>Guardar visita</Btn>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════
//  MODAL NUEVO / EDITAR CLIENTE
// ══════════════════════════════════════════════
function ModalClienteForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({dog:'',raza:'',size:'',pelaje:'',owner:'',tel:'',notes:'',foto:null});
  const [saving, setSaving] = useState(false);
  const [fotoFile, setFotoFile] = useState(null); // archivo real para Storage
  useEffect(() => { if (open) { setForm(initial || {dog:'',raza:'',size:'',pelaje:'',owner:'',tel:'',notes:'',foto:null}); setSaving(false); setFotoFile(null); } }, [open, initial]);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const handleFoto = e => {
    const f = e.target.files[0]; if (!f) return;
    setFotoFile(f); // guardar archivo para subir a Storage
    const r = new FileReader();
    r.onload = ev => set('foto', ev.target.result); // preview local
    r.readAsDataURL(f);
  };
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    await onSave(form, fotoFile); // pasar archivo junto al form
    setSaving(false);
  };
  return (
    <Modal open={open} onClose={onClose}>
      <ModalHead title={initial?'Editar Cliente':'Nuevo Cliente'} subtitle={!initial?'Registrá a un nuevo perrito y su dueño':''} onClose={onClose} />
      <div style={{padding:'20px 26px'}}>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:18}}>
          <div onClick={() => document.getElementById('foto-input').click()} style={{width:72,height:72,borderRadius:'50%',background:'#dff5ec',border:'2px dashed #5fbf9b',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:28,overflow:'hidden',flexShrink:0}}>
            {form.foto ? <img src={form.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : '🐾'}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>Foto del perro</div>
            <div style={{fontSize:11,color:'#9a9090'}}>Hacé click para {initial?'cambiar':'subir'}</div>
            <input id="foto-input" type="file" accept="image/*" style={{display:'none'}} onChange={handleFoto} />
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
          <FormGroup label="Nombre del perro *"><input value={form.dog} onChange={e=>set('dog',e.target.value)} placeholder="Coco" style={inputStyle} /></FormGroup>
          <FormGroup label="Raza"><input value={form.raza} onChange={e=>set('raza',e.target.value)} placeholder="Caniche" style={inputStyle} /></FormGroup>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
          <FormGroup label="Tamaño">
            <select value={form.size} onChange={e=>set('size',e.target.value)} style={inputStyle}>
              <option value="">—</option><option>Pequeño</option><option>Mediano</option><option>Grande</option>
            </select>
          </FormGroup>
          <FormGroup label="Color / pelaje"><input value={form.pelaje} onChange={e=>set('pelaje',e.target.value)} placeholder="Blanco rizado" style={inputStyle} /></FormGroup>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
          <FormGroup label="Dueño *"><input value={form.owner} onChange={e=>set('owner',e.target.value)} placeholder="María García" style={inputStyle} /></FormGroup>
          <FormGroup label="Teléfono"><input value={form.tel} onChange={e=>set('tel',e.target.value)} placeholder="11-2345-6789" style={inputStyle} /></FormGroup>
        </div>
        <FormGroup label="Notas especiales">
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Alergias, comportamiento, cuidados especiales..." style={{...inputStyle,resize:'vertical',minHeight:72}} />
        </FormGroup>
        <div style={{display:'flex',gap:10,marginTop:16}}>
          <Btn onClick={handleSave} disabled={saving} style={{flex:1,justifyContent:'center'}}>
            {saving ? '⏳ Guardando...' : `✓ ${initial?'Guardar cambios':'Guardar cliente'}`}
          </Btn>
          {!initial && <Btn variant="ghost" onClick={() => setForm({dog:'',raza:'',size:'',pelaje:'',owner:'',tel:'',notes:'',foto:null})}>Limpiar</Btn>}
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════
//  CALENDARIO
// ══════════════════════════════════════════════
function CalendarioPage({ clientes, turnos, onAddTurno, onCompletar, onNoVino, onDelete, onConfirmar, onEditTurno }) {
  const hoy = new Date();
  const [year, setYear] = useState(hoy.getFullYear());
  const [month, setMonth] = useState(hoy.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const changeMonth = dir => {
    let m = month+dir, y = year;
    if (m<0){m=11;y--;} if (m>11){m=0;y++;}
    setMonth(m); setYear(y);
  };

  const todISO = todayStr();
  const first = new Date(year,month,1).getDay();
  const days  = new Date(year,month+1,0).getDate();
  const dayTurnos = selectedDay ? turnos.filter(t => t.fecha===selectedDay) : [];

  return (
    <section>
      <div style={{marginBottom:24,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600}}>Calendario de Turnos</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Agenda y gestión de citas</p>
        </div>
        <Btn onClick={() => onAddTurno(selectedDay)}>+ Agregar turno</Btn>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:18}}>
        <div style={{background:'white',borderRadius:18,padding:'18px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button onClick={()=>changeMonth(-1)} style={{background:'white',border:'1.5px solid #ede8e8',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,minWidth:180,textAlign:'center'}}>{MESES[month].charAt(0).toUpperCase()+MESES[month].slice(1)} {year}</span>
              <button onClick={()=>changeMonth(1)} style={{background:'white',border:'1.5px solid #ede8e8',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
            </div>
            <div style={{display:'flex',gap:10,fontSize:11,color:'#9a9090',alignItems:'center'}}>
              <span><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#5fbf9b',marginRight:3,verticalAlign:'middle'}}/>Confirmado</span>
              <span><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#e8809a',marginRight:3,verticalAlign:'middle'}}/>Pendiente</span>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
            {CAL_DAYS.map(d=><div key={d} style={{textAlign:'center',fontSize:11,fontWeight:500,color:'#9a9090',padding:'8px 0',textTransform:'uppercase',letterSpacing:.5}}>{d}</div>)}
            {Array(first).fill(null).map((_,i)=><div key={'e'+i} style={{minHeight:70,borderRadius:10,background:'#f5f3f0',opacity:.5}}/>)}
            {Array.from({length:days},(_,i)=>i+1).map(d => {
              const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              const dayT = turnos.filter(t=>t.fecha===iso);
              const isToday=iso===todISO, isSel=iso===selectedDay, hasApt=dayT.length>0;
              return (
                <div key={d} onClick={()=>setSelectedDay(iso)} style={{minHeight:70,borderRadius:10,padding:'6px 7px',background:isSel||isToday?'#dff5ec':'white',border:`1.5px solid ${isSel?'#3a9b7b':isToday?'#5fbf9b':hasApt?'#f7bfcb':'transparent'}`,cursor:'pointer',transition:'all .2s'}}>
                  <div style={{fontSize:12,fontWeight:500,marginBottom:4,...(isToday?{background:'#5fbf9b',color:'white',width:20,height:20,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}:{})}}>{d}</div>
                  <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
                    {dayT.slice(0,4).map((t,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:t.estado==='confirmed'?'#5fbf9b':t.estado==='pending'?'#e8809a':'#9a9090'}}/>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,marginBottom:14}}>
            {selectedDay ? `${DIAS_ES[new Date(selectedDay+'T12:00:00').getDay()]} ${new Date(selectedDay+'T12:00:00').getDate()} de ${MESES[new Date(selectedDay+'T12:00:00').getMonth()]}` : 'Seleccioná un día'}
          </div>
          {!selectedDay ? <p style={{fontSize:13,color:'#9a9090'}}>Hacé click en un día del calendario</p>
            : !dayTurnos.length ? <p style={{fontSize:13,color:'#9a9090'}}>Sin turnos para este día</p>
            : dayTurnos.map(t => {
              const c = clientes.find(x=>x.id===t.clientId)||{};
              return (
                <div key={t.id} style={{background:'#faf8f5',borderRadius:10,padding:'11px 13px',marginBottom:8,borderLeft:`3px solid ${t.estado==='pending'?'#e8809a':t.estado==='completed'?'#9a9090':'#5fbf9b'}`,opacity:t.estado==='completed'?.75:1}}>
                  <div style={{fontSize:11,color:'#9a9090',fontWeight:600,textTransform:'uppercase'}}>{t.hora}</div>
                  <div style={{fontSize:14,fontWeight:500}}>{t.dogName||c.dog}</div>
                  <div style={{fontSize:12,color:'#9a9090'}}>{t.servicio} · {fmtPeso(t.precio)}</div>
                  <div style={{display:'flex',gap:5,marginTop:7,flexWrap:'wrap'}}>
                    {t.estado==='pending' && <Btn size="xs" onClick={()=>onConfirmar(t.id)}>✓ Confirmar</Btn>}
                    {t.estado!=='completed' && <Btn size="xs" onClick={()=>onCompletar(t.id,selectedDay)}>✓ Completar</Btn>}
                    {t.estado!=='completed' && <Btn size="xs" variant="pink" onClick={()=>onNoVino(t.id,selectedDay)}>✕ No vino</Btn>}
                    {t.estado==='completed' && <span style={{fontSize:10,color:'#5fbf9b',padding:'3px 8px',background:'#dff5ec',borderRadius:20,fontWeight:600}}>✓ Completado</span>}
                    {c.tel && <Btn size="xs" onClick={()=>abrirWhatsApp(c.tel,t.dogName||c.dog,c.owner,t)} style={{background:'#25d366',color:'white',border:'none'}}>💬</Btn>}
                    <Btn size="xs" variant="ghost" onClick={()=>onEditTurno(t)}>✏️</Btn>
                    <Btn size="xs" variant="ghost" onClick={()=>onDelete(t.id)}>🗑</Btn>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  MODAL NUEVO / EDITAR TURNO
// ══════════════════════════════════════════════
function ModalNuevoTurno({ open, onClose, onSave, onUpdate, clientes, defaultFecha, turnoEdit }) {
  const isEdit = !!turnoEdit;
  const [mode, setMode] = useState('exist');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({clientId:'',dog:'',owner:'',raza:'',tel:'',svc:'',fecha:defaultFecha||todayStr(),hora:'10:00',precio:'',estado:'confirmed'});

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    if (isEdit) {
      // Pre-cargar datos del turno a editar
      setForm({
        clientId: String(turnoEdit.clientId || ''),
        dog: '', owner: '', raza: '', tel: '',
        svc:    turnoEdit.servicio || '',
        fecha:  turnoEdit.fecha    || todayStr(),
        hora:   turnoEdit.hora     || '10:00',
        precio: String(turnoEdit.precio || ''),
        estado: turnoEdit.estado   || 'confirmed',
      });
      setMode('exist');
    } else {
      setForm(f => ({...f, fecha:defaultFecha||todayStr(), clientId:'', dog:'', owner:'', raza:'', tel:'', svc:'', hora:'10:00', precio:'', estado:'confirmed'}));
      setMode('exist');
    }
  }, [open, isEdit, turnoEdit, defaultFecha]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleGuardar = async () => {
    if (saving) return;
    setSaving(true);
    if (isEdit) {
      await onUpdate(turnoEdit.id, {
        servicio: form.svc,
        fecha:    form.fecha,
        hora:     form.hora,
        precio:   parseFloat(form.precio) || 0,
        estado:   form.estado,
      });
    } else {
      await onSave(mode, form);
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <ModalHead title={isEdit ? `✏️ Editar Turno` : 'Agregar Turno'} subtitle={isEdit ? `${turnoEdit?.dogName || ''} — ${fmtFecha(turnoEdit?.fecha)}` : ''} onClose={onClose} />
      <div style={{padding:'20px 26px'}}>

        {/* Modo nuevo: selector cliente / crear */}
        {!isEdit && (
          <div style={{marginBottom:16,padding:14,background:'#dff5ec',borderRadius:10}}>
            <div style={{fontSize:12,fontWeight:600,color:'#3a9b7b',marginBottom:10,textTransform:'uppercase'}}>¿Cliente nuevo o existente?</div>
            <div style={{display:'flex',gap:10}}>
              <Btn size="sm" variant={mode==='exist'?'primary':'ghost'} onClick={()=>setMode('exist')} style={{flex:1,justifyContent:'center'}}>Existente</Btn>
              <Btn size="sm" variant={mode==='new'?'primary':'ghost'} onClick={()=>setMode('new')} style={{flex:1,justifyContent:'center'}}>Crear nuevo</Btn>
            </div>
          </div>
        )}

        {/* En edición: mostrar cliente (read-only) */}
        {isEdit && (
          <div style={{marginBottom:14,padding:'10px 14px',background:'#dff5ec',borderRadius:10,display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:22}}>{animalIcon('')}</span>
            <div>
              <div style={{fontSize:13,fontWeight:600}}>{turnoEdit?.dogName || '—'}</div>
              <div style={{fontSize:11,color:'#9a9090'}}>Cliente · no editable en este paso</div>
            </div>
          </div>
        )}

        {/* En modo nuevo existente: selector */}
        {!isEdit && mode==='exist' && (
          <FormGroup label="Seleccionar cliente">
            <select value={form.clientId} onChange={e=>set('clientId',e.target.value)} style={{...inputStyle,marginBottom:14}}>
              <option value="">— Seleccionar —</option>
              {clientes.map(c=><option key={c.id} value={c.id}>{c.dog} ({c.owner})</option>)}
            </select>
          </FormGroup>
        )}

        {/* En modo nuevo crear */}
        {!isEdit && mode==='new' && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
              <FormGroup label="Nombre del perro"><input value={form.dog} onChange={e=>set('dog',e.target.value)} placeholder="Ej: Coco" style={inputStyle} /></FormGroup>
              <FormGroup label="Dueño"><input value={form.owner} onChange={e=>set('owner',e.target.value)} placeholder="Ej: María García" style={inputStyle} /></FormGroup>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
              <FormGroup label="Raza"><input value={form.raza} onChange={e=>set('raza',e.target.value)} placeholder="Ej: Caniche" style={inputStyle} /></FormGroup>
              <FormGroup label="Teléfono"><input value={form.tel} onChange={e=>set('tel',e.target.value)} placeholder="11-xxxx-xxxx" style={inputStyle} /></FormGroup>
            </div>
          </>
        )}

        {/* Campos editables siempre */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
          <FormGroup label="Servicio"><input value={form.svc} onChange={e=>set('svc',e.target.value)} placeholder="Baño y corte" style={inputStyle} /></FormGroup>
          <FormGroup label="Fecha"><input type="date" value={form.fecha} onChange={e=>set('fecha',e.target.value)} style={inputStyle} /></FormGroup>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
          <FormGroup label="Hora"><input type="time" value={form.hora} onChange={e=>set('hora',e.target.value)} style={inputStyle} /></FormGroup>
          <FormGroup label="Precio ($)"><input type="number" value={form.precio} onChange={e=>set('precio',e.target.value)} placeholder="0" style={inputStyle} /></FormGroup>
        </div>
        <FormGroup label="Estado">
          <select value={form.estado} onChange={e=>set('estado',e.target.value)} style={{...inputStyle,marginBottom:16}}>
            <option value="confirmed">Confirmado</option>
            <option value="pending">Pendiente</option>
          </select>
        </FormGroup>

        <Btn onClick={handleGuardar} disabled={saving} style={{width:'100%',justifyContent:'center',marginTop:4,background:isEdit?'#5fbf9b':undefined}}>
          {saving ? '⏳ Guardando...' : isEdit ? '✓ Guardar cambios' : '✓ Guardar turno'}
        </Btn>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════
//  HISTORIAL
// ══════════════════════════════════════════════
function HistorialPage({ clientes, turnos }) {
  const [q, setQ] = useState('');
  const [mes, setMes] = useState('');
  const allVisits = clientes.flatMap(c => (c.visitas||[]).map(v=>({...v,dog:c.dog,owner:c.owner})));
  const completedT = turnos.filter(t=>t.estado==='completed').map(t=>{const c=clientes.find(x=>x.id===t.clientId)||{};return{fecha:t.fecha,servicio:t.servicio,precio:t.precio||0,dog:t.dogName||c.dog||'',owner:c.owner||''};});
  const seen=new Set();
  const all=[...completedT,...allVisits].filter(v=>{const k=v.dog+v.fecha+v.servicio;if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const months=[...new Set(all.map(v=>v.fecha.slice(0,7)))];
  const filtered=all.filter(v=>{const mq=!q||(v.dog+v.owner+v.servicio).toLowerCase().includes(q.toLowerCase());const mm=!mes||v.fecha.startsWith(mes);return mq&&mm;});
  return (
    <section>
      <div style={{marginBottom:24,display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600}}>Historial de Visitas</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Registro completo de todos los servicios realizados</p>
        </div>
      </div>
      <div style={{background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:18}}>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',minWidth:220}}>
            <span>🔍</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." style={{border:'none',outline:'none',fontFamily:"'Outfit',sans-serif",fontSize:13,background:'transparent'}}/>
          </div>
          <select value={mes} onChange={e=>setMes(e.target.value)} style={{border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 14px',fontFamily:"'Outfit',sans-serif",fontSize:13,outline:'none',background:'white'}}>
            <option value="">Todos los meses</option>
            {months.map(m=><option key={m} value={m}>{MESES[parseInt(m.split('-')[1])-1]} {m.split('-')[0]}</option>)}
          </select>
        </div>
        {!filtered.length ? <div style={{textAlign:'center',padding:32,fontSize:14,color:'#9a9090'}}>No hay registros</div>
          : <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Mascota','Dueño','Servicio','Fecha','Precio','Estado'].map(h=><th key={h} style={{textAlign:'left',fontSize:11,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5,padding:'8px 14px',borderBottom:'2px solid #ede8e8',fontWeight:500}}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map((v,i)=><tr key={i}><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><strong>{v.dog||'–'}</strong></td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}>{v.owner||'–'}</td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}>{v.servicio}</td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}>{fmtFecha(v.fecha)}</td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><strong>{fmtPeso(v.precio)}</strong></td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><Badge variant="green">Completado</Badge></td></tr>)}</tbody>
          </table></div>
        }
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  NOTAS
// ══════════════════════════════════════════════
function NotasPage({ notas, onToggleCompra, onDeleteNota, onAgregar }) {
  const [tab, setTab] = useState('compras');
  const [qC, setQC] = useState('');
  const [qE, setQE] = useState('');
  const [mes, setMes] = useState('');
  const compras = notas.filter(n=>n.tipo==='compra'&&(!qC||n.item.toLowerCase().includes(qC.toLowerCase())));
  let egresos = notas.filter(n=>n.tipo==='egreso'&&(!qE||(n.concepto+n.categoria).toLowerCase().includes(qE.toLowerCase())));
  if (mes) egresos=egresos.filter(n=>n.fecha.startsWith(mes));
  const totalEgresos = egresos.reduce((s,n)=>s+n.monto,0);
  const egresoMonths = [...new Set(notas.filter(n=>n.tipo==='egreso').map(n=>n.fecha.slice(0,7)))];
  return (
    <section>
      <div style={{marginBottom:24,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600}}>Notas & Stock 📝</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Compras pendientes y control de inventario</p>
        </div>
        <Btn onClick={()=>onAgregar(tab==='compras'?'compra':'egreso')}>+ Agregar {tab==='compras'?'item':'egreso'}</Btn>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        <Btn variant={tab==='compras'?'primary':'ghost'} onClick={()=>setTab('compras')}>🛒 A comprar</Btn>
        <Btn variant={tab==='egresos'?'primary':'ghost'} onClick={()=>setTab('egresos')}>💸 Egresos</Btn>
      </div>
      {tab==='compras' ? (
        <div style={{background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{marginBottom:16,display:'flex',gap:10,alignItems:'center'}}>
            <div style={{flex:1,maxWidth:340,display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
              <span>🔍</span><input value={qC} onChange={e=>setQC(e.target.value)} placeholder="Buscar item..." style={{border:'none',outline:'none',fontFamily:"'Outfit',sans-serif",fontSize:13,width:'100%',background:'transparent'}}/>
            </div>
            <span style={{fontSize:13,color:'#9a9090'}}>{compras.length} item{compras.length!==1?'s':''}</span>
          </div>
          {!compras.length ? <div style={{textAlign:'center',padding:32,fontSize:14,color:'#9a9090'}}>No hay items pendientes 🎉</div>
            : <div style={{display:'flex',flexDirection:'column',gap:12}}>{compras.map(n=>(
              <div key={n.id} style={{background:'white',border:'1.5px solid #ede8e8',borderRadius:10,padding:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,boxShadow:'0 2px 8px rgba(0,0,0,.06)',opacity:n.completada?.7:1}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:500,marginBottom:4,textDecoration:n.completada?'line-through':''}}>{n.item}</div>
                  <div style={{fontSize:12,color:'#9a9090'}}>Cant: {n.cantidad} {n.precio?'· $'+n.precio:''}{n.notas?' · '+n.notas:''}</div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <Btn size="sm" onClick={()=>onToggleCompra(n.id)}>{n.completada?'✓ Comp':'Marcar'}</Btn>
                  <Btn size="sm" variant="ghost" onClick={()=>onDeleteNota(n.id)}>🗑️</Btn>
                </div>
              </div>
            ))}</div>
          }
        </div>
      ) : (
        <div style={{background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{marginBottom:16,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',flex:1,maxWidth:340}}>
              <span>🔍</span><input value={qE} onChange={e=>setQE(e.target.value)} placeholder="Buscar egreso..." style={{border:'none',outline:'none',fontFamily:"'Outfit',sans-serif",fontSize:13,background:'transparent',width:'100%'}}/>
            </div>
            <select value={mes} onChange={e=>setMes(e.target.value)} style={{border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 14px',fontFamily:"'Outfit',sans-serif",fontSize:13,outline:'none',background:'white'}}>
              <option value="">Todos los meses</option>
              {egresoMonths.map(m=><option key={m} value={m}>{MESES[parseInt(m.split('-')[1])-1]} {m.split('-')[0]}</option>)}
            </select>
            <span style={{fontSize:13,color:'#3a9b7b',fontWeight:600}}>Total: {fmtPeso(totalEgresos)}</span>
          </div>
          {!egresos.length ? <div style={{textAlign:'center',padding:32,fontSize:14,color:'#9a9090'}}>No hay egresos registrados</div>
            : <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['Concepto','Categoría','Monto','Fecha',''].map(h=><th key={h} style={{textAlign:'left',fontSize:11,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5,padding:'8px 14px',borderBottom:'2px solid #ede8e8',fontWeight:500}}>{h}</th>)}</tr></thead>
              <tbody>{egresos.map(n=><tr key={n.id}><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><strong>{n.concepto}</strong></td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><Badge variant="blue">{n.categoria}</Badge></td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><strong>{fmtPeso(n.monto)}</strong></td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}>{fmtFecha(n.fecha)}</td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><Btn size="xs" variant="ghost" onClick={()=>onDeleteNota(n.id)}>🗑️</Btn></td></tr>)}</tbody>
            </table></div>
          }
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════
//  MODAL NOTA
// ══════════════════════════════════════════════
function ModalNota({ open, onClose, onSave, defaultTipo='compra' }) {
  const [tipo, setTipo] = useState(defaultTipo);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({item:'',cantidad:1,precio:'',notas:'',concepto:'',categoria:'arriendo',monto:'',fecha:todayStr()});
  useEffect(() => { if(open){setTipo(defaultTipo);setSaving(false);setForm({item:'',cantidad:1,precio:'',notas:'',concepto:'',categoria:'arriendo',monto:'',fecha:todayStr()});} },[open]);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const handleSave = async () => { if(saving) return; setSaving(true); await onSave(tipo,form); setSaving(false); };
  return (
    <Modal open={open} onClose={onClose} width={480}>
      <ModalHead title="Agregar Nota" onClose={onClose} />
      <div style={{padding:'20px 26px'}}>
        <FormGroup label="Tipo"><select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...inputStyle,marginBottom:14}}><option value="compra">🛒 Compra</option><option value="egreso">💸 Egreso</option></select></FormGroup>
        {tipo==='compra' ? (<>
          <FormGroup label="Item a comprar"><input value={form.item} onChange={e=>set('item',e.target.value)} placeholder="Ej: Champú hipoalergénico" style={{...inputStyle,marginBottom:12}}/></FormGroup>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
            <FormGroup label="Cantidad"><input type="number" value={form.cantidad} onChange={e=>set('cantidad',e.target.value)} placeholder="1" style={inputStyle}/></FormGroup>
            <FormGroup label="Precio aprox."><input type="number" value={form.precio} onChange={e=>set('precio',e.target.value)} placeholder="0" style={inputStyle}/></FormGroup>
          </div>
          <FormGroup label="Notas (opcional)"><textarea value={form.notas} onChange={e=>set('notas',e.target.value)} placeholder="Especificaciones..." style={{...inputStyle,resize:'vertical',minHeight:60,marginBottom:14}}/></FormGroup>
        </>) : (<>
          <FormGroup label="Concepto"><input value={form.concepto} onChange={e=>set('concepto',e.target.value)} placeholder="Ej: Arriendo local" style={{...inputStyle,marginBottom:12}}/></FormGroup>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
            <FormGroup label="Categoría"><select value={form.categoria} onChange={e=>set('categoria',e.target.value)} style={inputStyle}><option value="arriendo">🏠 Arriendo</option><option value="servicios">⚡ Servicios</option><option value="compras">🛒 Compras</option><option value="personal">👤 Personal</option><option value="otros">📌 Otros</option></select></FormGroup>
            <FormGroup label="Monto"><input type="number" value={form.monto} onChange={e=>set('monto',e.target.value)} placeholder="0" style={inputStyle}/></FormGroup>
          </div>
          <FormGroup label="Fecha"><input type="date" value={form.fecha} onChange={e=>set('fecha',e.target.value)} style={{...inputStyle,marginBottom:14}}/></FormGroup>
        </>)}
        <Btn onClick={handleSave} disabled={saving} style={{width:'100%',justifyContent:'center'}}>
          {saving ? '⏳ Guardando...' : '✓ Guardar'}
        </Btn>
      </div>
    </Modal>
  );
}


// ══════════════════════════════════════════════
//  HORARIOS SEMANALES — Generador de imagen
// ══════════════════════════════════════════════
const DIAS_SEMANA_HOD = ['lunes','martes','miercoles','jueves','viernes','sabado'];
const DIAS_HOD_LABELS = {lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',jueves:'Jueves',viernes:'Viernes',sabado:'Sábado'};

// Carga html2canvas dinámicamente
function loadHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) { resolve(window.html2canvas); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = () => resolve(window.html2canvas);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const STORAGE_KEY_HOD = 'paupet_horarios_data';
const PELUQUERA_IMG = 'data:image/png;base64,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';

function HorariosPage() {
  const hoy = new Date();
  const proximoLunes = () => {
    const d = new Date(hoy);
    const dia = d.getDay();
    const diff = dia === 1 ? 7 : ((8 - dia) % 7 || 7);
    d.setDate(d.getDate() + diff);
    d.setHours(0,0,0,0);
    return d;
  };

  // ── Cargar estado guardado desde localStorage ──
  const loadSaved = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HOD);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  };

  const saved = loadSaved();
  const [semanaInicio, setSemanaInicio] = useState(() => {
    if (saved?.semanaInicio) return new Date(saved.semanaInicio);
    return proximoLunes();
  });
  const [slots, setSlots] = useState(saved?.slots || {lunes:[],martes:[],miercoles:[],jueves:[],viernes:[],sabado:[]});
  const [diasActivos, setDiasActivos] = useState(saved?.diasActivos || ['lunes','martes','miercoles','jueves','viernes','sabado']);
  const [tomados, setTomados] = useState(saved?.tomados || {}); // {dia: [hora, ...]}
  const [nuevoSlot, setNuevoSlot] = useState({});
  const [generando, setGenerando] = useState(false);
  const previewRef = useRef(null);

  // ── Guardar en localStorage cada vez que cambia el estado ──
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HOD, JSON.stringify({
        semanaInicio: semanaInicio.toISOString(),
        slots,
        diasActivos,
        tomados,
      }));
    } catch {}
  }, [semanaInicio, slots, diasActivos, tomados]);

  const toggleDia = (dia) => setDiasActivos(ds =>
    ds.includes(dia) ? ds.filter(d => d !== dia) : DIAS_SEMANA_HOD.filter(d => [...ds, dia].includes(d))
  );

  const getDiaDate = (dia) => {
    const offsetMap = {lunes:0,martes:1,miercoles:2,jueves:3,viernes:4,sabado:5};
    const d = new Date(semanaInicio);
    d.setDate(d.getDate() + (offsetMap[dia]||0));
    return d;
  };

  const agregarSlot = (dia) => {
    const hora = nuevoSlot[dia]||'';
    if (!hora) return;
    setSlots(s => ({...s, [dia]: [...new Set([...(s[dia]||[]), hora])].sort()}));
    setNuevoSlot(n => ({...n, [dia]:''}));
  };

  const quitarSlot = (dia, hora) => {
    setSlots(s => ({...s, [dia]: s[dia].filter(h=>h!==hora)}));
    setTomados(t => ({...t, [dia]: (t[dia]||[]).filter(h=>h!==hora)}));
  };

  const toggleTomado = (dia, hora) => {
    setTomados(t => {
      const lista = t[dia]||[];
      return {...t, [dia]: lista.includes(hora) ? lista.filter(h=>h!==hora) : [...lista, hora]};
    });
  };

  const cambiarSemana = (dir) => setSemanaInicio(s => { const d = new Date(s); d.setDate(d.getDate() + dir*7); return d; });

  const semanaLabel = () => {
    const fin = new Date(semanaInicio);
    fin.setDate(fin.getDate() + 5);
    return `${semanaInicio.getDate()} de ${MESES[semanaInicio.getMonth()]} → ${fin.getDate()} de ${MESES[fin.getMonth()]}`;
  };

  const descargarImagen = async () => {
    setGenerando(true);
    try {
      const h2c = await loadHtml2Canvas();
      const canvas = await h2c(previewRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#7ec8a0',
        logging: false,
        allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = `horarios_paupet_${semanaInicio.getDate()}_${MESES[semanaInicio.getMonth()]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch(e) {
      alert('Error al generar imagen: ' + e.message);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <section style={{width:'100%'}}>
      {/* Controles */}
      <div style={{marginBottom:20,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600}}>📸 Horarios para publicar</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Cargá los turnos disponibles de la semana y descargá la imagen para WhatsApp</p>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button onClick={()=>{setSlots({lunes:[],martes:[],miercoles:[],jueves:[],viernes:[],sabado:[]});setDiasActivos(['lunes','martes','miercoles','jueves','viernes','sabado']);setTomados({});}} style={{background:'none',border:'1.5px solid #ede8e8',borderRadius:50,padding:'8px 16px',fontSize:12,cursor:'pointer',color:'#9a9090',fontFamily:"'Outfit',sans-serif"}}>🗑 Limpiar</button>
          <Btn onClick={descargarImagen} disabled={generando} style={{background:'#25d366',border:'none'}}>
            {generando ? '⏳ Generando...' : '📥 Descargar imagen'}
          </Btn>
        </div>
      </div>

      {/* Selector semana */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,background:'white',borderRadius:14,padding:'12px 18px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',width:'fit-content'}}>
        <button onClick={()=>cambiarSemana(-1)} style={{background:'#f0faf5',border:'1.5px solid #dff5ec',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
        <div style={{textAlign:'center',minWidth:200}}>
          <div style={{fontSize:10,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5,marginBottom:1}}>Semana a publicar</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600}}>{semanaLabel()}</div>
        </div>
        <button onClick={()=>cambiarSemana(1)} style={{background:'#f0faf5',border:'1.5px solid #dff5ec',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
      </div>

      {/* Grid editor de slots */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginBottom:24}}>
        {DIAS_SEMANA_HOD.map(dia => {
          const diaDate = getDiaDate(dia);
          const horasDelDia = slots[dia] || [];
          const tomadosDia = tomados[dia] || [];
          const activo = diasActivos.includes(dia);
          return (
            <div key={dia} style={{background:'white',borderRadius:14,padding:'14px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',opacity:activo?1:0.45,transition:'opacity .2s'}}>
              <div style={{background:activo?'linear-gradient(135deg,#dff5ec,#c8eed9)':'#f0f0f0',borderRadius:9,padding:'7px 11px',marginBottom:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontWeight:700,fontSize:13,color:activo?'#1a1a1a':'#9a9090'}}>{DIAS_HOD_LABELS[dia].toUpperCase()} {diaDate.getDate()}</span>
                <button onClick={()=>toggleDia(dia)} style={{background:activo?'rgba(255,255,255,0.8)':'#e8809a',border:'none',borderRadius:20,padding:'2px 8px',fontSize:10,fontWeight:600,cursor:'pointer',color:activo?'#4caf8e':'white'}}>
                  {activo ? `${horasDelDia.length} hs ✓` : 'No trabajo'}
                </button>
              </div>
              {activo ? (
                <>
                  <div style={{minHeight:50,marginBottom:8}}>
                    {horasDelDia.length === 0
                      ? <p style={{fontSize:11,color:'#c0b8b8',textAlign:'center',padding:'6px 0'}}>Sin horarios</p>
                      : horasDelDia.map(h => {
                          const esTomado = tomadosDia.includes(h);
                          return (
                            <div key={h} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 8px',marginBottom:3,background:esTomado?'#fff0f3':'#f8fffe',borderRadius:7,border:`1px solid ${esTomado?'#f5c6d0':'#e8f8f0'}`}}>
                              <span
                                onClick={()=>toggleTomado(dia,h)}
                                title={esTomado?'Marcar como disponible':'Marcar como tomado'}
                                style={{fontSize:12,fontWeight:600,cursor:'pointer',textDecoration:esTomado?'line-through':'none',color:esTomado?'#b0a0a8':'inherit',userSelect:'none'}}
                              >🕐 {h} hs {esTomado && <span style={{fontSize:10,color:'#e8809a'}}>tomado</span>}</span>
                              <button onClick={()=>quitarSlot(dia,h)} style={{background:'none',border:'none',color:'#e8809a',cursor:'pointer',fontSize:13,lineHeight:1,padding:0}}>✕</button>
                            </div>
                          );
                        })
                    }
                  </div>
                  <div style={{display:'flex',gap:5}}>
                    <input type="time" value={nuevoSlot[dia]||''} onChange={e=>setNuevoSlot(n=>({...n,[dia]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&agregarSlot(dia)}
                      style={{flex:1,border:'1.5px solid #ede8e8',borderRadius:7,padding:'5px 8px',fontSize:12,fontFamily:"'Outfit',sans-serif",outline:'none'}}
                    />
                    <button onClick={()=>agregarSlot(dia)} style={{background:'#4caf8e',border:'none',borderRadius:7,color:'white',width:30,cursor:'pointer',fontWeight:700,fontSize:15,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                  </div>
                </>
              ) : (
                <p style={{fontSize:12,color:'#c0b8b8',textAlign:'center',padding:'8px 0'}}>No trabajo este día</p>
              )}
            </div>
          );
        })}
      </div>

      <p style={{fontSize:11,color:'#9a9090',marginBottom:12}}>💾 Los horarios se guardan automáticamente entre sesiones.</p>

      {/* ═══ PREVIEW DESCARGABLE ═══ */}
      <div style={{marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600}}>Vista previa</div>
        <span style={{fontSize:11,color:'#9a9090'}}>← esto es lo que se descarga</span>
      </div>
      <div ref={previewRef} style={{
        width:700,
        background:'#7ec8a0',
        borderRadius:16,
        padding:'32px 28px 28px',
        position:'relative',
        overflow:'hidden',
        boxShadow:'0 4px 24px rgba(0,0,0,.15)',
        fontFamily:"'Trebuchet MS', 'Segoe UI', sans-serif",
      }}>
        {/* Huellas decorativas de fondo */}
        {[{t:30,l:10,op:.12},{t:180,l:620,op:.1},{t:460,l:40,op:.1},{t:320,l:560,op:.12}].map((h,i)=>(
          <div key={i} style={{position:'absolute',top:h.t,left:h.l,fontSize:50,opacity:h.op,transform:'rotate(15deg)',pointerEvents:'none',userSelect:'none'}}>🐾</div>
        ))}

        {/* Peluquera — fija abajo a la derecha, sobre el fondo */}
        <img src={PELUQUERA_IMG} style={{
          position:'absolute', bottom:0, right:16,
          height:200, objectFit:'contain', objectPosition:'bottom',
          pointerEvents:'none', userSelect:'none', zIndex:0,
        }} alt="" crossOrigin="anonymous" />

        {/* Contenido encima */}
        <div style={{position:'relative',zIndex:1}}>

          {/* Título */}
          <div style={{textAlign:'center',marginBottom:24,whiteSpace:'nowrap'}}>
            <span style={{
              fontSize:42,fontWeight:900,letterSpacing:14,
              color:'#1a1a1a',textTransform:'uppercase',
              fontFamily:"'Trebuchet MS', Impact, sans-serif",
              display:'inline-block',
            }}>HORARIOS</span>
          </div>

          {/* Grid dinámico — siempre 3 columnas, tarjetas llenan todo el ancho */}
          {(() => {
            const activos = DIAS_SEMANA_HOD.filter(d => diasActivos.includes(d));
            const filas = [];
            for (let i = 0; i < activos.length; i += 3) {
              const fila = activos.slice(i, i + 3);
              filas.push(
                <div key={i} style={{display:'grid',gridTemplateColumns:`repeat(3,1fr)`,gap:12,marginBottom:12,alignItems:'stretch'}}>
                  {fila.map(dia => {
                    const diaDate = getDiaDate(dia);
                    const horasDia = slots[dia]||[];
                    const tomadosDia = tomados[dia]||[];
                    return (
                      <div key={dia} style={{background:'rgba(255,255,255,0.93)',borderRadius:12,padding:'11px 13px'}}>
                        <div style={{background:'#5aba8f',borderRadius:7,padding:'6px 8px',marginBottom:9,textAlign:'center'}}>
                          <span style={{
                            fontWeight:900,fontSize:15,color:'#fff',letterSpacing:1.5,
                            fontFamily:"'Trebuchet MS', sans-serif",whiteSpace:'nowrap',
                          }}>{DIAS_HOD_LABELS[dia].toUpperCase()} {diaDate.getDate()}</span>
                        </div>
                        <div style={{
                          display:'grid',
                          gridTemplateColumns: horasDia.length > 4 ? 'repeat(3,1fr)' : 'repeat(2,1fr)',
                          gap:'4px 6px',
                        }}>
                          {horasDia.map(h=>{
                            const esTomado = tomadosDia.includes(h);
                            return (
                              <div key={h} style={{
                                fontSize:14,fontWeight:700,
                                color:esTomado?'#b0b8b0':'#1a1a1a',
                                textDecoration:esTomado?'line-through':'none',
                                fontFamily:"'Trebuchet MS', sans-serif",
                                whiteSpace:'nowrap',
                              }}>• {h} hs</div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {/* Relleno si la última fila tiene menos de 3 — celdas vacías transparentes */}
                  {fila.length < 3 && Array.from({length: 3 - fila.length}).map((_,si) => (
                    <div key={'empty'+si} style={{borderRadius:12,background:'transparent'}} />
                  ))}
                </div>
              );
            }
            return filas;
          })()}

        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  CLIENTES PAGE
// ══════════════════════════════════════════════
function ClientesPage({ clientes, onOpenClient, onNuevo }) {
  const [q, setQ] = useState('');
  const filtered = clientes.filter(c => c.dog.toLowerCase().includes(q.toLowerCase()) || c.owner.toLowerCase().includes(q.toLowerCase()));
  return (
    <section>
      <div style={{marginBottom:24,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600}}>Gestión de Clientes</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Base de datos de mascotas y dueños</p>
        </div>
        <Btn onClick={onNuevo}>+ Nuevo cliente</Btn>
      </div>
      <div style={{marginBottom:16,display:'flex',gap:12,alignItems:'center'}}>
        <div style={{flex:1,maxWidth:340,display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <span>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar perrito o dueño..." style={{border:'none',outline:'none',fontFamily:"'Outfit',sans-serif",fontSize:13,width:'100%',background:'transparent'}} />
        </div>
        <span style={{fontSize:13,color:'#9a9090'}}>{filtered.length} cliente{filtered.length!==1?'s':''}</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:16}}>
        {!filtered.length ? <p style={{color:'#9a9090',fontSize:14,padding:'24px 0'}}>Sin clientes. ¡Agregá el primero!</p>
          : filtered.map(c => {
            const ultima = c.visitas?.length ? c.visitas[c.visitas.length-1] : null;
            const dias = ultima ? Math.floor((Date.now()-new Date(ultima.fecha))/86400000) : null;
            const bv = dias===null?'gray':dias>30?'pink':'green';
            const bt = dias===null?'Sin visitas':dias===0?'Hoy':`Hace ${dias}d`;
            return (
              <div key={c.id} onClick={() => onOpenClient(c.id)} style={{background:'white',borderRadius:18,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.06)',cursor:'pointer',transition:'all .22s'}}>
                <div style={{height:130,background:'linear-gradient(135deg,#dff5ec,#fde8ed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:50,overflow:'hidden'}}>
                  {c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={c.dog} /> : <span>{animalIcon(c.raza)}</span>}
                </div>
                <div style={{padding:'13px 15px'}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600}}>{c.dog}</div>
                  <div style={{fontSize:11,color:'#9a9090',marginBottom:8}}>👤 {c.owner}{c.tel?` · 📱 ${c.tel}`:''}</div>
                  {c.raza && <div style={{fontSize:11,color:'#9a9090',marginBottom:8}}>🐾 {c.raza}{c.size?' · '+c.size:''}</div>}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <Badge variant={bv}>{bt}</Badge>
                    <span style={{fontSize:11,color:'#9a9090'}}>{(c.visitas||[]).length} visita{(c.visitas||[]).length!==1?'s':''}</span>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  MODAL CLIENTE (perfil)
// ══════════════════════════════════════════════
function ModalCliente({ open, cliente, onClose, onSaveVisit, onDelete, onEdit, onDecrementarInasistencia }) {
  const [showForm, setShowForm] = useState(false);
  const [svc, setSvc] = useState('');
  const [precio, setPrecio] = useState('');
  const [fecha, setFecha] = useState(todayStr());
  useEffect(() => { if (open) { setShowForm(false); setSvc(''); setPrecio(''); setFecha(todayStr()); } }, [open]);
  if (!open || !cliente) return null;
  const c = cliente;
  return (
    <Modal open={open} onClose={onClose}>
      <ModalHead title={c.dog} subtitle={`👤 ${c.owner}${c.tel?' · 📱 '+c.tel:''}`} onClose={onClose}
        avatar={c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : <span style={{fontSize:34}}>{animalIcon(c.raza)}</span>}
      />
      <div style={{padding:'20px 26px'}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
          {[{l:'Raza',v:c.raza||'–'},{l:'Tamaño',v:c.size||'–'},{l:'Pelaje',v:c.pelaje||'–'},{l:'Visitas',v:(c.visitas||[]).length}].map(ch=>(
            <div key={ch.l} style={{background:'white',borderRadius:10,padding:'9px 13px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',minWidth:90,flex:1}}>
              <div style={{fontSize:10,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5}}>{ch.l}</div>
              <div style={{fontSize:13,fontWeight:500,marginTop:1}}>{ch.v}</div>
            </div>
          ))}
        </div>
        {(c.inasistencias||0) > 0 && (
          <div style={{marginBottom:16,padding:12,background:'#fde8ed',borderRadius:10}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'#e8809a',marginBottom:4}}>INASISTENCIAS</div>
                <div style={{fontSize:20,fontWeight:600,color:'#e8809a'}}>{c.inasistencias}</div>
              </div>
              <Btn size="sm" variant="pink" onClick={() => onDecrementarInasistencia(c.id)}>➖ Restar</Btn>
            </div>
          </div>
        )}
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:600,marginBottom:8}}>📝 Notas</div>
        <div style={{background:'#fde8ed',borderRadius:10,padding:'12px 14px',fontSize:13,lineHeight:1.6,borderLeft:'3px solid #e8809a',marginBottom:14}}>{c.notes||'Sin notas especiales.'}</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:600,margin:'14px 0 8px'}}>✂️ Historial de visitas</div>
        {!(c.visitas||[]).length ? <p style={{fontSize:13,color:'#9a9090'}}>Sin visitas aún</p>
          : [...(c.visitas||[])].reverse().map((v,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,background:'white',borderRadius:10,padding:'10px 13px',marginBottom:7,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#5fbf9b',flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500}}>{v.servicio}</div>
                <div style={{fontSize:11,color:'#9a9090'}}>{fmtFecha(v.fecha)}</div>
              </div>
              <div style={{fontSize:13,fontWeight:600,color:'#3a9b7b'}}>{fmtPeso(v.precio)}</div>
            </div>
          ))
        }
        <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
          <Btn size="sm" onClick={() => setShowForm(!showForm)}>+ Registrar visita</Btn>
          {c.tel && (
            <Btn size="sm" variant="ghost" onClick={() => abrirWhatsApp(c.tel, c.dog, c.owner)}
              style={{background:'#25d366',color:'white',border:'none'}}>
              💬 WhatsApp
            </Btn>
          )}
          <Btn size="sm" variant="ghost" onClick={() => onEdit(c)}>✏️ Editar</Btn>
          <Btn size="sm" variant="ghost" onClick={() => onDelete(c.id)}>🗑 Eliminar</Btn>
        </div>
        {showForm && (
          <div style={{background:'#dff5ec',borderRadius:10,padding:14,marginTop:10}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
              <FormGroup label="Servicio"><input value={svc} onChange={e=>setSvc(e.target.value)} placeholder="Baño y corte" style={inputStyle} /></FormGroup>
              <FormGroup label="Precio"><input type="number" value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="0" style={inputStyle} /></FormGroup>
              <FormGroup label="Fecha"><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inputStyle} /></FormGroup>
            </div>
            <Btn size="sm" onClick={() => { onSaveVisit(c.id, svc, parseFloat(precio)||0, fecha); setShowForm(false); setSvc(''); setPrecio(''); }}>Guardar visita</Btn>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════
//  MODAL NUEVO / EDITAR CLIENTE
// ══════════════════════════════════════════════
function ModalClienteForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({dog:'',raza:'',size:'',pelaje:'',owner:'',tel:'',notes:'',foto:null});
  const [saving, setSaving] = useState(false);
  const [fotoFile, setFotoFile] = useState(null); // archivo real para Storage
  useEffect(() => { if (open) { setForm(initial || {dog:'',raza:'',size:'',pelaje:'',owner:'',tel:'',notes:'',foto:null}); setSaving(false); setFotoFile(null); } }, [open, initial]);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const handleFoto = e => {
    const f = e.target.files[0]; if (!f) return;
    setFotoFile(f); // guardar archivo para subir a Storage
    const r = new FileReader();
    r.onload = ev => set('foto', ev.target.result); // preview local
    r.readAsDataURL(f);
  };
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    await onSave(form, fotoFile); // pasar archivo junto al form
    setSaving(false);
  };
  return (
    <Modal open={open} onClose={onClose}>
      <ModalHead title={initial?'Editar Cliente':'Nuevo Cliente'} subtitle={!initial?'Registrá a un nuevo perrito y su dueño':''} onClose={onClose} />
      <div style={{padding:'20px 26px'}}>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:18}}>
          <div onClick={() => document.getElementById('foto-input').click()} style={{width:72,height:72,borderRadius:'50%',background:'#dff5ec',border:'2px dashed #5fbf9b',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:28,overflow:'hidden',flexShrink:0}}>
            {form.foto ? <img src={form.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : '🐾'}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>Foto del perro</div>
            <div style={{fontSize:11,color:'#9a9090'}}>Hacé click para {initial?'cambiar':'subir'}</div>
            <input id="foto-input" type="file" accept="image/*" style={{display:'none'}} onChange={handleFoto} />
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
          <FormGroup label="Nombre del perro *"><input value={form.dog} onChange={e=>set('dog',e.target.value)} placeholder="Coco" style={inputStyle} /></FormGroup>
          <FormGroup label="Raza"><input value={form.raza} onChange={e=>set('raza',e.target.value)} placeholder="Caniche" style={inputStyle} /></FormGroup>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
          <FormGroup label="Tamaño">
            <select value={form.size} onChange={e=>set('size',e.target.value)} style={inputStyle}>
              <option value="">—</option><option>Pequeño</option><option>Mediano</option><option>Grande</option>
            </select>
          </FormGroup>
          <FormGroup label="Color / pelaje"><input value={form.pelaje} onChange={e=>set('pelaje',e.target.value)} placeholder="Blanco rizado" style={inputStyle} /></FormGroup>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
          <FormGroup label="Dueño *"><input value={form.owner} onChange={e=>set('owner',e.target.value)} placeholder="María García" style={inputStyle} /></FormGroup>
          <FormGroup label="Teléfono"><input value={form.tel} onChange={e=>set('tel',e.target.value)} placeholder="11-2345-6789" style={inputStyle} /></FormGroup>
        </div>
        <FormGroup label="Notas especiales">
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Alergias, comportamiento, cuidados especiales..." style={{...inputStyle,resize:'vertical',minHeight:72}} />
        </FormGroup>
        <div style={{display:'flex',gap:10,marginTop:16}}>
          <Btn onClick={handleSave} disabled={saving} style={{flex:1,justifyContent:'center'}}>
            {saving ? '⏳ Guardando...' : `✓ ${initial?'Guardar cambios':'Guardar cliente'}`}
          </Btn>
          {!initial && <Btn variant="ghost" onClick={() => setForm({dog:'',raza:'',size:'',pelaje:'',owner:'',tel:'',notes:'',foto:null})}>Limpiar</Btn>}
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════
//  CALENDARIO
// ══════════════════════════════════════════════
function CalendarioPage({ clientes, turnos, onAddTurno, onCompletar, onNoVino, onDelete, onConfirmar, onEditTurno }) {
  const hoy = new Date();
  const [year, setYear] = useState(hoy.getFullYear());
  const [month, setMonth] = useState(hoy.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const changeMonth = dir => {
    let m = month+dir, y = year;
    if (m<0){m=11;y--;} if (m>11){m=0;y++;}
    setMonth(m); setYear(y);
  };

  const todISO = todayStr();
  const first = new Date(year,month,1).getDay();
  const days  = new Date(year,month+1,0).getDate();
  const dayTurnos = selectedDay ? turnos.filter(t => t.fecha===selectedDay) : [];

  return (
    <section>
      <div style={{marginBottom:24,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600}}>Calendario de Turnos</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Agenda y gestión de citas</p>
        </div>
        <Btn onClick={() => onAddTurno(selectedDay)}>+ Agregar turno</Btn>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:18}}>
        <div style={{background:'white',borderRadius:18,padding:'18px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button onClick={()=>changeMonth(-1)} style={{background:'white',border:'1.5px solid #ede8e8',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,minWidth:180,textAlign:'center'}}>{MESES[month].charAt(0).toUpperCase()+MESES[month].slice(1)} {year}</span>
              <button onClick={()=>changeMonth(1)} style={{background:'white',border:'1.5px solid #ede8e8',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
            </div>
            <div style={{display:'flex',gap:10,fontSize:11,color:'#9a9090',alignItems:'center'}}>
              <span><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#5fbf9b',marginRight:3,verticalAlign:'middle'}}/>Confirmado</span>
              <span><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#e8809a',marginRight:3,verticalAlign:'middle'}}/>Pendiente</span>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
            {CAL_DAYS.map(d=><div key={d} style={{textAlign:'center',fontSize:11,fontWeight:500,color:'#9a9090',padding:'8px 0',textTransform:'uppercase',letterSpacing:.5}}>{d}</div>)}
            {Array(first).fill(null).map((_,i)=><div key={'e'+i} style={{minHeight:70,borderRadius:10,background:'#f5f3f0',opacity:.5}}/>)}
            {Array.from({length:days},(_,i)=>i+1).map(d => {
              const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              const dayT = turnos.filter(t=>t.fecha===iso);
              const isToday=iso===todISO, isSel=iso===selectedDay, hasApt=dayT.length>0;
              return (
                <div key={d} onClick={()=>setSelectedDay(iso)} style={{minHeight:70,borderRadius:10,padding:'6px 7px',background:isSel||isToday?'#dff5ec':'white',border:`1.5px solid ${isSel?'#3a9b7b':isToday?'#5fbf9b':hasApt?'#f7bfcb':'transparent'}`,cursor:'pointer',transition:'all .2s'}}>
                  <div style={{fontSize:12,fontWeight:500,marginBottom:4,...(isToday?{background:'#5fbf9b',color:'white',width:20,height:20,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}:{})}}>{d}</div>
                  <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
                    {dayT.slice(0,4).map((t,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:t.estado==='confirmed'?'#5fbf9b':t.estado==='pending'?'#e8809a':'#9a9090'}}/>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,marginBottom:14}}>
            {selectedDay ? `${DIAS_ES[new Date(selectedDay+'T12:00:00').getDay()]} ${new Date(selectedDay+'T12:00:00').getDate()} de ${MESES[new Date(selectedDay+'T12:00:00').getMonth()]}` : 'Seleccioná un día'}
          </div>
          {!selectedDay ? <p style={{fontSize:13,color:'#9a9090'}}>Hacé click en un día del calendario</p>
            : !dayTurnos.length ? <p style={{fontSize:13,color:'#9a9090'}}>Sin turnos para este día</p>
            : dayTurnos.map(t => {
              const c = clientes.find(x=>x.id===t.clientId)||{};
              return (
                <div key={t.id} style={{background:'#faf8f5',borderRadius:10,padding:'11px 13px',marginBottom:8,borderLeft:`3px solid ${t.estado==='pending'?'#e8809a':t.estado==='completed'?'#9a9090':'#5fbf9b'}`,opacity:t.estado==='completed'?.75:1}}>
                  <div style={{fontSize:11,color:'#9a9090',fontWeight:600,textTransform:'uppercase'}}>{t.hora}</div>
                  <div style={{fontSize:14,fontWeight:500}}>{t.dogName||c.dog}</div>
                  <div style={{fontSize:12,color:'#9a9090'}}>{t.servicio} · {fmtPeso(t.precio)}</div>
                  <div style={{display:'flex',gap:5,marginTop:7,flexWrap:'wrap'}}>
                    {t.estado==='pending' && <Btn size="xs" onClick={()=>onConfirmar(t.id)}>✓ Confirmar</Btn>}
                    {t.estado!=='completed' && <Btn size="xs" onClick={()=>onCompletar(t.id,selectedDay)}>✓ Completar</Btn>}
                    {t.estado!=='completed' && <Btn size="xs" variant="pink" onClick={()=>onNoVino(t.id,selectedDay)}>✕ No vino</Btn>}
                    {t.estado==='completed' && <span style={{fontSize:10,color:'#5fbf9b',padding:'3px 8px',background:'#dff5ec',borderRadius:20,fontWeight:600}}>✓ Completado</span>}
                    {c.tel && <Btn size="xs" onClick={()=>abrirWhatsApp(c.tel,t.dogName||c.dog,c.owner,t)} style={{background:'#25d366',color:'white',border:'none'}}>💬</Btn>}
                    <Btn size="xs" variant="ghost" onClick={()=>onEditTurno(t)}>✏️</Btn>
                    <Btn size="xs" variant="ghost" onClick={()=>onDelete(t.id)}>🗑</Btn>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  MODAL NUEVO / EDITAR TURNO
// ══════════════════════════════════════════════
function ModalNuevoTurno({ open, onClose, onSave, onUpdate, clientes, defaultFecha, turnoEdit }) {
  const isEdit = !!turnoEdit;
  const [mode, setMode] = useState('exist');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({clientId:'',dog:'',owner:'',raza:'',tel:'',svc:'',fecha:defaultFecha||todayStr(),hora:'10:00',precio:'',estado:'confirmed'});

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    if (isEdit) {
      // Pre-cargar datos del turno a editar
      setForm({
        clientId: String(turnoEdit.clientId || ''),
        dog: '', owner: '', raza: '', tel: '',
        svc:    turnoEdit.servicio || '',
        fecha:  turnoEdit.fecha    || todayStr(),
        hora:   turnoEdit.hora     || '10:00',
        precio: String(turnoEdit.precio || ''),
        estado: turnoEdit.estado   || 'confirmed',
      });
      setMode('exist');
    } else {
      setForm(f => ({...f, fecha:defaultFecha||todayStr(), clientId:'', dog:'', owner:'', raza:'', tel:'', svc:'', hora:'10:00', precio:'', estado:'confirmed'}));
      setMode('exist');
    }
  }, [open, isEdit, turnoEdit, defaultFecha]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleGuardar = async () => {
    if (saving) return;
    setSaving(true);
    if (isEdit) {
      await onUpdate(turnoEdit.id, {
        servicio: form.svc,
        fecha:    form.fecha,
        hora:     form.hora,
        precio:   parseFloat(form.precio) || 0,
        estado:   form.estado,
      });
    } else {
      await onSave(mode, form);
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <ModalHead title={isEdit ? `✏️ Editar Turno` : 'Agregar Turno'} subtitle={isEdit ? `${turnoEdit?.dogName || ''} — ${fmtFecha(turnoEdit?.fecha)}` : ''} onClose={onClose} />
      <div style={{padding:'20px 26px'}}>

        {/* Modo nuevo: selector cliente / crear */}
        {!isEdit && (
          <div style={{marginBottom:16,padding:14,background:'#dff5ec',borderRadius:10}}>
            <div style={{fontSize:12,fontWeight:600,color:'#3a9b7b',marginBottom:10,textTransform:'uppercase'}}>¿Cliente nuevo o existente?</div>
            <div style={{display:'flex',gap:10}}>
              <Btn size="sm" variant={mode==='exist'?'primary':'ghost'} onClick={()=>setMode('exist')} style={{flex:1,justifyContent:'center'}}>Existente</Btn>
              <Btn size="sm" variant={mode==='new'?'primary':'ghost'} onClick={()=>setMode('new')} style={{flex:1,justifyContent:'center'}}>Crear nuevo</Btn>
            </div>
          </div>
        )}

        {/* En edición: mostrar cliente (read-only) */}
        {isEdit && (
          <div style={{marginBottom:14,padding:'10px 14px',background:'#dff5ec',borderRadius:10,display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:22}}>{animalIcon('')}</span>
            <div>
              <div style={{fontSize:13,fontWeight:600}}>{turnoEdit?.dogName || '—'}</div>
              <div style={{fontSize:11,color:'#9a9090'}}>Cliente · no editable en este paso</div>
            </div>
          </div>
        )}

        {/* En modo nuevo existente: selector */}
        {!isEdit && mode==='exist' && (
          <FormGroup label="Seleccionar cliente">
            <select value={form.clientId} onChange={e=>set('clientId',e.target.value)} style={{...inputStyle,marginBottom:14}}>
              <option value="">— Seleccionar —</option>
              {clientes.map(c=><option key={c.id} value={c.id}>{c.dog} ({c.owner})</option>)}
            </select>
          </FormGroup>
        )}

        {/* En modo nuevo crear */}
        {!isEdit && mode==='new' && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
              <FormGroup label="Nombre del perro"><input value={form.dog} onChange={e=>set('dog',e.target.value)} placeholder="Ej: Coco" style={inputStyle} /></FormGroup>
              <FormGroup label="Dueño"><input value={form.owner} onChange={e=>set('owner',e.target.value)} placeholder="Ej: María García" style={inputStyle} /></FormGroup>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
              <FormGroup label="Raza"><input value={form.raza} onChange={e=>set('raza',e.target.value)} placeholder="Ej: Caniche" style={inputStyle} /></FormGroup>
              <FormGroup label="Teléfono"><input value={form.tel} onChange={e=>set('tel',e.target.value)} placeholder="11-xxxx-xxxx" style={inputStyle} /></FormGroup>
            </div>
          </>
        )}

        {/* Campos editables siempre */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
          <FormGroup label="Servicio"><input value={form.svc} onChange={e=>set('svc',e.target.value)} placeholder="Baño y corte" style={inputStyle} /></FormGroup>
          <FormGroup label="Fecha"><input type="date" value={form.fecha} onChange={e=>set('fecha',e.target.value)} style={inputStyle} /></FormGroup>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
          <FormGroup label="Hora"><input type="time" value={form.hora} onChange={e=>set('hora',e.target.value)} style={inputStyle} /></FormGroup>
          <FormGroup label="Precio ($)"><input type="number" value={form.precio} onChange={e=>set('precio',e.target.value)} placeholder="0" style={inputStyle} /></FormGroup>
        </div>
        <FormGroup label="Estado">
          <select value={form.estado} onChange={e=>set('estado',e.target.value)} style={{...inputStyle,marginBottom:16}}>
            <option value="confirmed">Confirmado</option>
            <option value="pending">Pendiente</option>
          </select>
        </FormGroup>

        <Btn onClick={handleGuardar} disabled={saving} style={{width:'100%',justifyContent:'center',marginTop:4,background:isEdit?'#5fbf9b':undefined}}>
          {saving ? '⏳ Guardando...' : isEdit ? '✓ Guardar cambios' : '✓ Guardar turno'}
        </Btn>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════
//  HISTORIAL
// ══════════════════════════════════════════════
function HistorialPage({ clientes, turnos }) {
  const [q, setQ] = useState('');
  const [mes, setMes] = useState('');
  const allVisits = clientes.flatMap(c => (c.visitas||[]).map(v=>({...v,dog:c.dog,owner:c.owner})));
  const completedT = turnos.filter(t=>t.estado==='completed').map(t=>{const c=clientes.find(x=>x.id===t.clientId)||{};return{fecha:t.fecha,servicio:t.servicio,precio:t.precio||0,dog:t.dogName||c.dog||'',owner:c.owner||''};});
  const seen=new Set();
  const all=[...completedT,...allVisits].filter(v=>{const k=v.dog+v.fecha+v.servicio;if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const months=[...new Set(all.map(v=>v.fecha.slice(0,7)))];
  const filtered=all.filter(v=>{const mq=!q||(v.dog+v.owner+v.servicio).toLowerCase().includes(q.toLowerCase());const mm=!mes||v.fecha.startsWith(mes);return mq&&mm;});
  return (
    <section>
      <div style={{marginBottom:24,display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600}}>Historial de Visitas</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Registro completo de todos los servicios realizados</p>
        </div>
      </div>
      <div style={{background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:18}}>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',minWidth:220}}>
            <span>🔍</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." style={{border:'none',outline:'none',fontFamily:"'Outfit',sans-serif",fontSize:13,background:'transparent'}}/>
          </div>
          <select value={mes} onChange={e=>setMes(e.target.value)} style={{border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 14px',fontFamily:"'Outfit',sans-serif",fontSize:13,outline:'none',background:'white'}}>
            <option value="">Todos los meses</option>
            {months.map(m=><option key={m} value={m}>{MESES[parseInt(m.split('-')[1])-1]} {m.split('-')[0]}</option>)}
          </select>
        </div>
        {!filtered.length ? <div style={{textAlign:'center',padding:32,fontSize:14,color:'#9a9090'}}>No hay registros</div>
          : <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Mascota','Dueño','Servicio','Fecha','Precio','Estado'].map(h=><th key={h} style={{textAlign:'left',fontSize:11,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5,padding:'8px 14px',borderBottom:'2px solid #ede8e8',fontWeight:500}}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map((v,i)=><tr key={i}><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><strong>{v.dog||'–'}</strong></td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}>{v.owner||'–'}</td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}>{v.servicio}</td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}>{fmtFecha(v.fecha)}</td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><strong>{fmtPeso(v.precio)}</strong></td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><Badge variant="green">Completado</Badge></td></tr>)}</tbody>
          </table></div>
        }
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  NOTAS
// ══════════════════════════════════════════════
function NotasPage({ notas, onToggleCompra, onDeleteNota, onAgregar }) {
  const [tab, setTab] = useState('compras');
  const [qC, setQC] = useState('');
  const [qE, setQE] = useState('');
  const [mes, setMes] = useState('');
  const compras = notas.filter(n=>n.tipo==='compra'&&(!qC||n.item.toLowerCase().includes(qC.toLowerCase())));
  let egresos = notas.filter(n=>n.tipo==='egreso'&&(!qE||(n.concepto+n.categoria).toLowerCase().includes(qE.toLowerCase())));
  if (mes) egresos=egresos.filter(n=>n.fecha.startsWith(mes));
  const totalEgresos = egresos.reduce((s,n)=>s+n.monto,0);
  const egresoMonths = [...new Set(notas.filter(n=>n.tipo==='egreso').map(n=>n.fecha.slice(0,7)))];
  return (
    <section>
      <div style={{marginBottom:24,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600}}>Notas & Stock 📝</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Compras pendientes y control de inventario</p>
        </div>
        <Btn onClick={()=>onAgregar(tab==='compras'?'compra':'egreso')}>+ Agregar {tab==='compras'?'item':'egreso'}</Btn>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        <Btn variant={tab==='compras'?'primary':'ghost'} onClick={()=>setTab('compras')}>🛒 A comprar</Btn>
        <Btn variant={tab==='egresos'?'primary':'ghost'} onClick={()=>setTab('egresos')}>💸 Egresos</Btn>
      </div>
      {tab==='compras' ? (
        <div style={{background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{marginBottom:16,display:'flex',gap:10,alignItems:'center'}}>
            <div style={{flex:1,maxWidth:340,display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
              <span>🔍</span><input value={qC} onChange={e=>setQC(e.target.value)} placeholder="Buscar item..." style={{border:'none',outline:'none',fontFamily:"'Outfit',sans-serif",fontSize:13,width:'100%',background:'transparent'}}/>
            </div>
            <span style={{fontSize:13,color:'#9a9090'}}>{compras.length} item{compras.length!==1?'s':''}</span>
          </div>
          {!compras.length ? <div style={{textAlign:'center',padding:32,fontSize:14,color:'#9a9090'}}>No hay items pendientes 🎉</div>
            : <div style={{display:'flex',flexDirection:'column',gap:12}}>{compras.map(n=>(
              <div key={n.id} style={{background:'white',border:'1.5px solid #ede8e8',borderRadius:10,padding:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,boxShadow:'0 2px 8px rgba(0,0,0,.06)',opacity:n.completada?.7:1}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:500,marginBottom:4,textDecoration:n.completada?'line-through':''}}>{n.item}</div>
                  <div style={{fontSize:12,color:'#9a9090'}}>Cant: {n.cantidad} {n.precio?'· $'+n.precio:''}{n.notas?' · '+n.notas:''}</div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <Btn size="sm" onClick={()=>onToggleCompra(n.id)}>{n.completada?'✓ Comp':'Marcar'}</Btn>
                  <Btn size="sm" variant="ghost" onClick={()=>onDeleteNota(n.id)}>🗑️</Btn>
                </div>
              </div>
            ))}</div>
          }
        </div>
      ) : (
        <div style={{background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{marginBottom:16,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',flex:1,maxWidth:340}}>
              <span>🔍</span><input value={qE} onChange={e=>setQE(e.target.value)} placeholder="Buscar egreso..." style={{border:'none',outline:'none',fontFamily:"'Outfit',sans-serif",fontSize:13,background:'transparent',width:'100%'}}/>
            </div>
            <select value={mes} onChange={e=>setMes(e.target.value)} style={{border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 14px',fontFamily:"'Outfit',sans-serif",fontSize:13,outline:'none',background:'white'}}>
              <option value="">Todos los meses</option>
              {egresoMonths.map(m=><option key={m} value={m}>{MESES[parseInt(m.split('-')[1])-1]} {m.split('-')[0]}</option>)}
            </select>
            <span style={{fontSize:13,color:'#3a9b7b',fontWeight:600}}>Total: {fmtPeso(totalEgresos)}</span>
          </div>
          {!egresos.length ? <div style={{textAlign:'center',padding:32,fontSize:14,color:'#9a9090'}}>No hay egresos registrados</div>
            : <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['Concepto','Categoría','Monto','Fecha',''].map(h=><th key={h} style={{textAlign:'left',fontSize:11,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5,padding:'8px 14px',borderBottom:'2px solid #ede8e8',fontWeight:500}}>{h}</th>)}</tr></thead>
              <tbody>{egresos.map(n=><tr key={n.id}><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><strong>{n.concepto}</strong></td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><Badge variant="blue">{n.categoria}</Badge></td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><strong>{fmtPeso(n.monto)}</strong></td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}>{fmtFecha(n.fecha)}</td><td style={{padding:'11px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><Btn size="xs" variant="ghost" onClick={()=>onDeleteNota(n.id)}>🗑️</Btn></td></tr>)}</tbody>
            </table></div>
          }
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════
//  MODAL NOTA
// ══════════════════════════════════════════════
function ModalNota({ open, onClose, onSave, defaultTipo='compra' }) {
  const [tipo, setTipo] = useState(defaultTipo);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({item:'',cantidad:1,precio:'',notas:'',concepto:'',categoria:'arriendo',monto:'',fecha:todayStr()});
  useEffect(() => { if(open){setTipo(defaultTipo);setSaving(false);setForm({item:'',cantidad:1,precio:'',notas:'',concepto:'',categoria:'arriendo',monto:'',fecha:todayStr()});} },[open]);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const handleSave = async () => { if(saving) return; setSaving(true); await onSave(tipo,form); setSaving(false); };
  return (
    <Modal open={open} onClose={onClose} width={480}>
      <ModalHead title="Agregar Nota" onClose={onClose} />
      <div style={{padding:'20px 26px'}}>
        <FormGroup label="Tipo"><select value={tipo} onChange={e=>setTipo(e.target.value)} style={{...inputStyle,marginBottom:14}}><option value="compra">🛒 Compra</option><option value="egreso">💸 Egreso</option></select></FormGroup>
        {tipo==='compra' ? (<>
          <FormGroup label="Item a comprar"><input value={form.item} onChange={e=>set('item',e.target.value)} placeholder="Ej: Champú hipoalergénico" style={{...inputStyle,marginBottom:12}}/></FormGroup>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
            <FormGroup label="Cantidad"><input type="number" value={form.cantidad} onChange={e=>set('cantidad',e.target.value)} placeholder="1" style={inputStyle}/></FormGroup>
            <FormGroup label="Precio aprox."><input type="number" value={form.precio} onChange={e=>set('precio',e.target.value)} placeholder="0" style={inputStyle}/></FormGroup>
          </div>
          <FormGroup label="Notas (opcional)"><textarea value={form.notas} onChange={e=>set('notas',e.target.value)} placeholder="Especificaciones..." style={{...inputStyle,resize:'vertical',minHeight:60,marginBottom:14}}/></FormGroup>
        </>) : (<>
          <FormGroup label="Concepto"><input value={form.concepto} onChange={e=>set('concepto',e.target.value)} placeholder="Ej: Arriendo local" style={{...inputStyle,marginBottom:12}}/></FormGroup>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
            <FormGroup label="Categoría"><select value={form.categoria} onChange={e=>set('categoria',e.target.value)} style={inputStyle}><option value="arriendo">🏠 Arriendo</option><option value="servicios">⚡ Servicios</option><option value="compras">🛒 Compras</option><option value="personal">👤 Personal</option><option value="otros">📌 Otros</option></select></FormGroup>
            <FormGroup label="Monto"><input type="number" value={form.monto} onChange={e=>set('monto',e.target.value)} placeholder="0" style={inputStyle}/></FormGroup>
          </div>
          <FormGroup label="Fecha"><input type="date" value={form.fecha} onChange={e=>set('fecha',e.target.value)} style={{...inputStyle,marginBottom:14}}/></FormGroup>
        </>)}
        <Btn onClick={handleSave} disabled={saving} style={{width:'100%',justifyContent:'center'}}>
          {saving ? '⏳ Guardando...' : '✓ Guardar'}
        </Btn>
      </div>
    </Modal>
  );
}


// ══════════════════════════════════════════════
//  HORARIOS SEMANALES — Generador de imagen
// ══════════════════════════════════════════════
const DIAS_SEMANA_HOD = ['lunes','martes','miercoles','jueves','viernes','sabado'];
const DIAS_HOD_LABELS = {lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',jueves:'Jueves',viernes:'Viernes',sabado:'Sábado'};

// Carga html2canvas dinámicamente
function loadHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) { resolve(window.html2canvas); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = () => resolve(window.html2canvas);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const STORAGE_KEY_HOD = 'paupet_horarios_data';
const PELUQUERA_IMG = 'data:image/png;base64,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';

function HorariosPage() {
  const hoy = new Date();
  const proximoLunes = () => {
    const d = new Date(hoy);
    const dia = d.getDay();
    const diff = dia === 1 ? 7 : ((8 - dia) % 7 || 7);
    d.setDate(d.getDate() + diff);
    d.setHours(0,0,0,0);
    return d;
  };

  // ── Cargar estado guardado desde localStorage ──
  const loadSaved = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HOD);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  };

  const saved = loadSaved();
  const [semanaInicio, setSemanaInicio] = useState(() => {
    if (saved?.semanaInicio) return new Date(saved.semanaInicio);
    return proximoLunes();
  });
  const [slots, setSlots] = useState(saved?.slots || {lunes:[],martes:[],miercoles:[],jueves:[],viernes:[],sabado:[]});
  const [diasActivos, setDiasActivos] = useState(saved?.diasActivos || ['lunes','martes','miercoles','jueves','viernes','sabado']);
  const [tomados, setTomados] = useState(saved?.tomados || {}); // {dia: [hora, ...]}
  const [nuevoSlot, setNuevoSlot] = useState({});
  const [generando, setGenerando] = useState(false);
  const previewRef = useRef(null);

  // ── Guardar en localStorage cada vez que cambia el estado ──
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HOD, JSON.stringify({
        semanaInicio: semanaInicio.toISOString(),
        slots,
        diasActivos,
        tomados,
      }));
    } catch {}
  }, [semanaInicio, slots, diasActivos, tomados]);

  const toggleDia = (dia) => setDiasActivos(ds =>
    ds.includes(dia) ? ds.filter(d => d !== dia) : DIAS_SEMANA_HOD.filter(d => [...ds, dia].includes(d))
  );

  const getDiaDate = (dia) => {
    const offsetMap = {lunes:0,martes:1,miercoles:2,jueves:3,viernes:4,sabado:5};
    const d = new Date(semanaInicio);
    d.setDate(d.getDate() + (offsetMap[dia]||0));
    return d;
  };

  const agregarSlot = (dia) => {
    const hora = nuevoSlot[dia]||'';
    if (!hora) return;
    setSlots(s => ({...s, [dia]: [...new Set([...(s[dia]||[]), hora])].sort()}));
    setNuevoSlot(n => ({...n, [dia]:''}));
  };

  const quitarSlot = (dia, hora) => {
    setSlots(s => ({...s, [dia]: s[dia].filter(h=>h!==hora)}));
    setTomados(t => ({...t, [dia]: (t[dia]||[]).filter(h=>h!==hora)}));
  };

  const toggleTomado = (dia, hora) => {
    setTomados(t => {
      const lista = t[dia]||[];
      return {...t, [dia]: lista.includes(hora) ? lista.filter(h=>h!==hora) : [...lista, hora]};
    });
  };

  const cambiarSemana = (dir) => setSemanaInicio(s => { const d = new Date(s); d.setDate(d.getDate() + dir*7); return d; });

  const semanaLabel = () => {
    const fin = new Date(semanaInicio);
    fin.setDate(fin.getDate() + 5);
    return `${semanaInicio.getDate()} de ${MESES[semanaInicio.getMonth()]} → ${fin.getDate()} de ${MESES[fin.getMonth()]}`;
  };

  const descargarImagen = async () => {
    setGenerando(true);
    try {
      const h2c = await loadHtml2Canvas();
      const canvas = await h2c(previewRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#7ec8a0',
        logging: false,
        allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = `horarios_paupet_${semanaInicio.getDate()}_${MESES[semanaInicio.getMonth()]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch(e) {
      alert('Error al generar imagen: ' + e.message);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <section style={{width:'100%'}}>
      {/* Controles */}
      <div style={{marginBottom:20,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600}}>📸 Horarios para publicar</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Cargá los turnos disponibles de la semana y descargá la imagen para WhatsApp</p>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button onClick={()=>{setSlots({lunes:[],martes:[],miercoles:[],jueves:[],viernes:[],sabado:[]});setDiasActivos(['lunes','martes','miercoles','jueves','viernes','sabado']);setTomados({});}} style={{background:'none',border:'1.5px solid #ede8e8',borderRadius:50,padding:'8px 16px',fontSize:12,cursor:'pointer',color:'#9a9090',fontFamily:"'Outfit',sans-serif"}}>🗑 Limpiar</button>
          <Btn onClick={descargarImagen} disabled={generando} style={{background:'#25d366',border:'none'}}>
            {generando ? '⏳ Generando...' : '📥 Descargar imagen'}
          </Btn>
        </div>
      </div>

      {/* Selector semana */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,background:'white',borderRadius:14,padding:'12px 18px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',width:'fit-content'}}>
        <button onClick={()=>cambiarSemana(-1)} style={{background:'#f0faf5',border:'1.5px solid #dff5ec',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
        <div style={{textAlign:'center',minWidth:200}}>
          <div style={{fontSize:10,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5,marginBottom:1}}>Semana a publicar</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600}}>{semanaLabel()}</div>
        </div>
        <button onClick={()=>cambiarSemana(1)} style={{background:'#f0faf5',border:'1.5px solid #dff5ec',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
      </div>

      {/* Grid editor de slots */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginBottom:24}}>
        {DIAS_SEMANA_HOD.map(dia => {
          const diaDate = getDiaDate(dia);
          const horasDelDia = slots[dia] || [];
          const tomadosDia = tomados[dia] || [];
          const activo = diasActivos.includes(dia);
          return (
            <div key={dia} style={{background:'white',borderRadius:14,padding:'14px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',opacity:activo?1:0.45,transition:'opacity .2s'}}>
              <div style={{background:activo?'linear-gradient(135deg,#dff5ec,#c8eed9)':'#f0f0f0',borderRadius:9,padding:'7px 11px',marginBottom:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontWeight:700,fontSize:13,color:activo?'#1a1a1a':'#9a9090'}}>{DIAS_HOD_LABELS[dia].toUpperCase()} {diaDate.getDate()}</span>
                <button onClick={()=>toggleDia(dia)} style={{background:activo?'rgba(255,255,255,0.8)':'#e8809a',border:'none',borderRadius:20,padding:'2px 8px',fontSize:10,fontWeight:600,cursor:'pointer',color:activo?'#4caf8e':'white'}}>
                  {activo ? `${horasDelDia.length} hs ✓` : 'No trabajo'}
                </button>
              </div>
              {activo ? (
                <>
                  <div style={{minHeight:50,marginBottom:8}}>
                    {horasDelDia.length === 0
                      ? <p style={{fontSize:11,color:'#c0b8b8',textAlign:'center',padding:'6px 0'}}>Sin horarios</p>
                      : horasDelDia.map(h => {
                          const esTomado = tomadosDia.includes(h);
                          return (
                            <div key={h} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 8px',marginBottom:3,background:esTomado?'#fff0f3':'#f8fffe',borderRadius:7,border:`1px solid ${esTomado?'#f5c6d0':'#e8f8f0'}`}}>
                              <span
                                onClick={()=>toggleTomado(dia,h)}
                                title={esTomado?'Marcar como disponible':'Marcar como tomado'}
                                style={{fontSize:12,fontWeight:600,cursor:'pointer',textDecoration:esTomado?'line-through':'none',color:esTomado?'#b0a0a8':'inherit',userSelect:'none'}}
                              >🕐 {h} hs {esTomado && <span style={{fontSize:10,color:'#e8809a'}}>tomado</span>}</span>
                              <button onClick={()=>quitarSlot(dia,h)} style={{background:'none',border:'none',color:'#e8809a',cursor:'pointer',fontSize:13,lineHeight:1,padding:0}}>✕</button>
                            </div>
                          );
                        })
                    }
                  </div>
                  <div style={{display:'flex',gap:5}}>
                    <input type="time" value={nuevoSlot[dia]||''} onChange={e=>setNuevoSlot(n=>({...n,[dia]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&agregarSlot(dia)}
                      style={{flex:1,border:'1.5px solid #ede8e8',borderRadius:7,padding:'5px 8px',fontSize:12,fontFamily:"'Outfit',sans-serif",outline:'none'}}
                    />
                    <button onClick={()=>agregarSlot(dia)} style={{background:'#4caf8e',border:'none',borderRadius:7,color:'white',width:30,cursor:'pointer',fontWeight:700,fontSize:15,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                  </div>
                </>
              ) : (
                <p style={{fontSize:12,color:'#c0b8b8',textAlign:'center',padding:'8px 0'}}>No trabajo este día</p>
              )}
            </div>
          );
        })}
      </div>

      <p style={{fontSize:11,color:'#9a9090',marginBottom:12}}>💾 Los horarios se guardan automáticamente entre sesiones.</p>

      {/* ═══ PREVIEW DESCARGABLE ═══ */}
      <div style={{marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600}}>Vista previa</div>
        <span style={{fontSize:11,color:'#9a9090'}}>← esto es lo que se descarga</span>
      </div>
      <div ref={previewRef} style={{
        width:700, minHeight:600,
        background:'#7ec8a0',
        borderRadius:16,
        padding:'32px 28px 20px',
        position:'relative',
        overflow:'hidden',
        boxShadow:'0 4px 24px rgba(0,0,0,.15)',
        fontFamily:"'Trebuchet MS', 'Segoe UI', sans-serif",
      }}>
        {/* Huellas decorativas de fondo */}
        {[{t:30,l:10,op:.12},{t:180,l:620,op:.1},{t:460,l:40,op:.1},{t:320,l:560,op:.12}].map((h,i)=>(
          <div key={i} style={{position:'absolute',top:h.t,left:h.l,fontSize:50,opacity:h.op,transform:'rotate(15deg)',pointerEvents:'none',userSelect:'none'}}>🐾</div>
        ))}

        {/* Título — una sola línea, letra espaciada */}
        <div style={{textAlign:'center',marginBottom:24,whiteSpace:'nowrap'}}>
          <span style={{
            fontSize:42,fontWeight:900,letterSpacing:14,
            color:'#1a1a1a',textTransform:'uppercase',
            fontFamily:"'Trebuchet MS', Impact, sans-serif",
            display:'inline-block',
          }}>HORARIOS</span>
        </div>

        {/* Grid dinámico */}
        {(() => {
          const activos = DIAS_SEMANA_HOD.filter(d => diasActivos.includes(d));
          const filas = [];
          for (let i = 0; i < activos.length; i += 3) {
            const fila = activos.slice(i, i + 3);
            const esUltima = i + 3 >= activos.length;
            const espacioLibre = esUltima && fila.length < 3;
            filas.push(
              <div key={i} style={{display:'grid',gridTemplateColumns:`repeat(3,1fr)`,gap:12,marginBottom:12}}>
                {fila.map(dia => {
                  const diaDate = getDiaDate(dia);
                  const horasDia = slots[dia]||[];
                  const tomadosDia = tomados[dia]||[];
                  return (
                    <div key={dia} style={{background:'rgba(255,255,255,0.93)',borderRadius:12,padding:'11px 13px',minHeight:120}}>
                      <div style={{background:'#5aba8f',borderRadius:7,padding:'6px 8px',marginBottom:9,textAlign:'center'}}>
                        <span style={{
                          fontWeight:900,fontSize:15,color:'#fff',letterSpacing:1.5,
                          fontFamily:"'Trebuchet MS', sans-serif",whiteSpace:'nowrap',
                        }}>{DIAS_HOD_LABELS[dia].toUpperCase()} {diaDate.getDate()}</span>
                      </div>
                      {/* Horarios: cada uno en su propio div, sin cortes, en grilla */}
                      <div style={{
                        display:'grid',
                        gridTemplateColumns: horasDia.length > 4 ? 'repeat(3,1fr)' : 'repeat(2,1fr)',
                        gap:'4px 6px',
                      }}>
                        {horasDia.map(h=>{
                          const esTomado = tomadosDia.includes(h);
                          return (
                            <div key={h} style={{
                              fontSize:14,fontWeight:700,
                              color:esTomado?'#b0b8b0':'#1a1a1a',
                              textDecoration:esTomado?'line-through':'none',
                              fontFamily:"'Trebuchet MS', sans-serif",
                              whiteSpace:'nowrap',
                            }}>• {h} hs</div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {/* Espacio con imagen de la peluquera */}
                {espacioLibre && (
                  <div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',minHeight:120,gridColumn: fila.length === 1 ? 'span 2' : 'auto'}}>
                    <img src={PELUQUERA_IMG} style={{height:185,objectFit:'contain',objectPosition:'bottom'}} alt="" crossOrigin="anonymous" />
                  </div>
                )}
              </div>
            );
          }
          // Si todos los días llenaron filas completas, imagen abajo a la derecha
          if (activos.length % 3 === 0) {
            filas.push(
              <div key="img-row" style={{display:'flex',justifyContent:'flex-end',marginTop:-4}}>
                <img src={PELUQUERA_IMG} style={{height:175,objectFit:'contain',objectPosition:'bottom'}} alt="" crossOrigin="anonymous" />
              </div>
            );
          }
          return filas;
        })()}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  CONFIG
// ══════════════════════════════════════════════
function ConfigPage({ config, onSave }) {
  const [nombre, setNombre] = useState(config.nombre);
  const [msg, setMsg] = useState(config.msg||'');
  const [anticip, setAnticip] = useState(config.anticip||30);
  const [slots, setSlots] = useState(config.slots||{});
  const [horarios, setHorarios] = useState(config.horarios||{});
  const [openDays, setOpenDays] = useState({});
  const [newSlot, setNewSlot] = useState({});
  useEffect(() => { setNombre(config.nombre);setMsg(config.msg||'');setAnticip(config.anticip||30);setSlots({...config.slots});setHorarios({...config.horarios}); },[config]);

  const toggleDayOpen=(key,checked)=>setHorarios(h=>({...h,[key]:{...(h[key]||{open:true,desde:'09:00',hasta:'18:00'}),open:checked}}));
  const addSlot=key=>{const hora=newSlot[key+'_hora']||'09:00';const dur=parseInt(newSlot[key+'_dur']||60);const cur=slots[key]||[];if(cur.some(s=>s.hora===hora))return;setSlots(s=>({...s,[key]:[...cur,{hora,duracion:dur}]}));};
  const removeSlot=(key,hora)=>setSlots(s=>({...s,[key]:(s[key]||[]).filter(sl=>sl.hora!==hora)}));
  const autoGen=key=>{const desde=prompt(`Hora de inicio (ej: 09:00):`)?.trim();const hasta=prompt('Hora de fin (ej: 17:00):')?.trim();const durStr=prompt('Duración en minutos:')?.trim();if(!desde||!hasta||!durStr)return;const dur=parseInt(durStr)||60;let[hh,mm]=desde.split(':').map(Number);const[eh,em]=hasta.split(':').map(Number);const gen=[];while(hh*60+mm+dur<=eh*60+em){const hora=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;gen.push({hora,duracion:dur});mm+=dur;if(mm>=60){hh+=Math.floor(mm/60);mm=mm%60;}}setSlots(s=>{const cur=s[key]||[];const merged=[...cur];gen.forEach(g=>{if(!merged.some(x=>x.hora===g.hora))merged.push(g);});return{...s,[key]:merged};});};

  return (
    <section>
      <div style={{marginBottom:24,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600}}>Configuración de Agenda</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Definí tus turnos disponibles por día</p>
        </div>
        <Btn onClick={()=>onSave({nombre,msg,anticip:parseInt(anticip),slots,horarios})}>💾 Guardar todo</Btn>
      </div>
      <div style={{background:'white',borderRadius:18,padding:'20px 22px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',marginBottom:18}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
          <FormGroup label="Nombre de tu peluquería"><input value={nombre} onChange={e=>setNombre(e.target.value)} style={inputStyle}/></FormGroup>
          <FormGroup label="Días de anticipación máx."><select value={anticip} onChange={e=>setAnticip(e.target.value)} style={inputStyle}><option value="7">1 semana</option><option value="14">2 semanas</option><option value="30">1 mes</option><option value="60">2 meses</option></select></FormGroup>
          <FormGroup label="Mensaje de bienvenida"><input value={msg} onChange={e=>setMsg(e.target.value)} style={inputStyle}/></FormGroup>
        </div>
      </div>
      {DIAS_CONFIG.map(d=>{
        const daySlots=(slots[d.key]||[]).slice().sort((a,b)=>a.hora.localeCompare(b.hora));
        const isOpen=horarios[d.key]?.open!==false;
        const isExp=openDays[d.key]!==undefined?openDays[d.key]:isOpen;
        return (
          <div key={d.key} style={{background:'white',borderRadius:18,boxShadow:'0 2px 8px rgba(0,0,0,.06)',marginBottom:14,overflow:'hidden'}}>
            <div onClick={()=>setOpenDays(o=>({...o,[d.key]:!isExp}))} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',cursor:'pointer',borderBottom:isExp?'1.5px solid #ede8e8':'1.5px solid transparent'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span onClick={e=>{e.stopPropagation();toggleDayOpen(d.key,!isOpen);}} style={{position:'relative',display:'inline-block',width:40,height:22,cursor:'pointer'}}>
                  <span style={{position:'absolute',inset:0,background:isOpen?'#5fbf9b':'#d0cece',borderRadius:20,transition:'.3s',display:'block'}}/>
                  <span style={{position:'absolute',height:16,width:16,left:isOpen?21:3,top:3,background:'white',borderRadius:'50%',transition:'.3s',boxShadow:'0 1px 4px rgba(0,0,0,.2)',display:'block'}}/>
                </span>
                <span style={{fontSize:15,fontWeight:600}}>{d.emoji} {d.label}</span>
                <span style={{fontSize:11,color:'#9a9090'}}>{daySlots.length} turno{daySlots.length!==1?'s':''}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:12,color:'#9a9090'}}>{isOpen?'Abierto':'Cerrado'}</span>
                <span style={{color:'#9a9090',fontSize:16}}>{isExp?'▲':'▼'}</span>
              </div>
            </div>
            {isExp && <div style={{padding:'16px 20px'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8,marginBottom:12}}>
                {!daySlots.length ? <div style={{fontSize:13,color:'#9a9090',padding:'4px 0'}}>Sin turnos cargados ↓</div>
                  : daySlots.map(s=><div key={s.hora} style={{background:'#dff5ec',borderRadius:10,padding:'9px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',border:'1.5px solid #a8dfc8'}}>
                    <div><span style={{fontSize:13,fontWeight:500,color:'#3a9b7b'}}>🕐 {s.hora}</span><span style={{fontSize:10,color:'#9a9090',display:'block'}}>{durLabel(s.duracion)}</span></div>
                    <button onClick={()=>removeSlot(d.key,s.hora)} style={{background:'none',border:'none',cursor:'pointer',color:'#9a9090',fontSize:14,padding:'0 0 0 4px'}}>✕</button>
                  </div>)
                }
              </div>
              <div style={{display:'flex',alignItems:'flex-end',gap:10,background:'#faf8f5',borderRadius:10,padding:'12px 14px',flexWrap:'wrap'}}>
                <FormGroup label="Hora"><input type="time" value={newSlot[d.key+'_hora']||'09:00'} onChange={e=>setNewSlot(s=>({...s,[d.key+'_hora']:e.target.value}))} style={{border:'1.5px solid #ede8e8',borderRadius:10,padding:'7px 10px',fontFamily:"'Outfit',sans-serif",fontSize:12,outline:'none',background:'white'}}/></FormGroup>
                <FormGroup label="Duración"><select value={newSlot[d.key+'_dur']||60} onChange={e=>setNewSlot(s=>({...s,[d.key+'_dur']:e.target.value}))} style={{border:'1.5px solid #ede8e8',borderRadius:10,padding:'7px 10px',fontFamily:"'Outfit',sans-serif",fontSize:12,outline:'none',background:'white'}}><option value="30">30 min</option><option value="45">45 min</option><option value="60">1 hora</option><option value="90">1:30 hs</option><option value="120">2 horas</option></select></FormGroup>
                <Btn size="sm" onClick={()=>addSlot(d.key)}>+ Agregar</Btn>
                <Btn size="sm" variant="ghost" onClick={()=>autoGen(d.key)}>⚡ Auto</Btn>
              </div>
            </div>}
          </div>
        );
      })}
    </section>
  );
}

// ══════════════════════════════════════════════
//  MAIN APP — todo el estado viene de Supabase
// ══════════════════════════════════════════════
export default function App() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [turnos, setTurnos]   = useState([]);
  const [notas, setNotas]     = useState([]);
  const [config, setConfig]   = useState(DEFAULT_CONFIG);
  const [page, setPage]       = useState('dashboard');
  const [toasts, setToasts]   = useState([]);

  // Modals
  const [modalCliente,     setModalCliente]     = useState({open:false,id:null});
  const [modalNuevoCliente,setModalNuevoCliente] = useState({open:false,initial:null});
  const [modalTurno,       setModalTurno]       = useState({open:false,fecha:null,turnoEdit:null});
  const [modalNota,        setModalNota]        = useState({open:false,tipo:'compra'});

  const toast = useCallback((msg, error=false) => {
    const id = Date.now();
    setToasts(ts => [...ts,{id,msg,error}]);
    setTimeout(()=>setToasts(ts=>ts.filter(t=>t.id!==id)), 3500);
  }, []);

  // ── LOAD ALL DATA ──────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [c, t, n, cfg] = await Promise.all([db.getClientes(), db.getTurnos(), db.getNotas(), db.getConfig()]);
      setClientes(c); setTurnos(t); setNotas(n); setConfig(cfg);
    } catch(e) {
      toast('Error cargando datos: ' + e.message, true);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── CLIENTE ACTIONS ────────────────────────
  const handleOpenClient = id => setModalCliente({open:true,id});

  const handleSaveVisit = async (clienteId, svc, precio, fecha) => {
    if (!svc) { toast('Ingresá el servicio', true); return; }
    try {
      await db.insertVisita(clienteId, svc, precio, fecha);
      await loadAll();
      toast('Visita registrada ✂️');
    } catch(e) { toast(e.message, true); }
  };

  const handleDeleteClient = async id => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await db.deleteCliente(id);
      setModalCliente({open:false,id:null});
      await loadAll();
      toast('Cliente eliminado');
    } catch(e) { toast(e.message, true); }
  };

  const handleSaveNewClient = async (form, fotoFile) => {
    if (!form.dog || !form.owner) { toast('Completá nombre del perro y dueño', true); return; }
    const isEdit = !!modalNuevoCliente.initial;
    try {
      let fotoUrl = form.foto; // puede ser URL de Storage ya existente o base64 viejo
      if (fotoFile) {
        // Si hay archivo nuevo, subir a Storage
        const tempId = modalNuevoCliente.initial?.id || 'new_' + Date.now();
        fotoUrl = await db.uploadFoto(fotoFile, tempId);
      }
      const formConFoto = { ...form, foto: fotoUrl };
      if (isEdit) {
        await db.updateCliente(modalNuevoCliente.initial.id, formConFoto);
      } else {
        await db.insertCliente(formConFoto);
      }
      setModalNuevoCliente({open:false,initial:null});
      await loadAll();
      toast(isEdit ? 'Cliente actualizado ✅' : `¡${form.dog} fue agregado! 🐶`);
    } catch(e) { toast(e.message, true); }
  };

  const handleDecrementarInasistencia = async id => {
    if (!confirm('¿Restar una inasistencia?')) return;
    const c = clientes.find(x=>x.id===id);
    if (!c || (c.inasistencias||0) <= 0) return;
    try {
      await db.updateCliente(id, {inasistencias: c.inasistencias - 1});
      await loadAll();
      toast('Inasistencia eliminada');
    } catch(e) { toast(e.message, true); }
  };

  // ── TURNO ACTIONS ──────────────────────────
  const handleCompletar = async (id) => {
    const t = turnos.find(x=>x.id===id); if (!t) return;
    try {
      await db.updateTurno(id, {estado:'completed'});
      await db.insertVisita(t.clientId, t.servicio, t.precio||0, t.fecha);
      await loadAll();
      toast('Turno completado y guardado en el historial 🎉');
    } catch(e) { toast(e.message, true); }
  };

  const handleNoVino = async (id) => {
    if (!confirm('¿Marcar este turno como inasistencia?')) return;
    const t = turnos.find(x=>x.id===id); if (!t) return;
    const c = clientes.find(x=>x.id===t.clientId);
    try {
      await db.deleteTurno(id);
      if (c) await db.updateCliente(c.id, {inasistencias:(c.inasistencias||0)+1});
      await loadAll();
      toast(`Inasistencia registrada 📍`);
    } catch(e) { toast(e.message, true); }
  };

  const handleConfirmar = async id => {
    try {
      await db.updateTurno(id, {estado:'confirmed'});
      await loadAll();
      toast('Turno confirmado ✅');
    } catch(e) { toast(e.message, true); }
  };

  const handleEditTurno = (turno) => {
    setModalTurno({open:true, fecha:turno.fecha, turnoEdit:turno});
  };

  const handleUpdateTurno = async (id, fields) => {
    try {
      await db.updateTurno(id, fields);
      setModalTurno({open:false, fecha:null, turnoEdit:null});
      await loadAll();
      toast('Turno actualizado ✅');
    } catch(e) { toast(e.message, true); }
  };

  const handleDeleteTurno = async id => {
    if (!confirm('¿Eliminar este turno?')) return;
    try {
      await db.deleteTurno(id);
      await loadAll();
    } catch(e) { toast(e.message, true); }
  };

  const handleSaveNewTurno = async (mode, form) => {
    let clientId = null, dogName = '';
    try {
      if (mode === 'new') {
        if (!form.dog || !form.owner) { toast('Completá nombre del perro y dueño', true); return; }
        const newC = await db.insertCliente({dog:form.dog,owner:form.owner,raza:form.raza,tel:form.tel,size:'',pelaje:'',notes:'',foto:null});
        clientId = newC.id; dogName = form.dog;
      } else {
        clientId = parseInt(form.clientId);
        if (!clientId) { toast('Seleccioná un cliente', true); return; }
      }
      if (!form.fecha || !form.svc) { toast('Completá al menos fecha y servicio', true); return; }
      const c = clientes.find(x=>x.id===clientId)||{};
      await db.insertTurno({clientId, dogName:dogName||c.dog||'', servicio:form.svc, fecha:form.fecha, hora:form.hora, precio:parseFloat(form.precio)||0, estado:form.estado});
      setModalTurno({open:false,fecha:null});
      await loadAll();
      toast(mode==='new'?'Cliente y turno agregado 🎉':'Turno agregado 📅');
    } catch(e) { toast(e.message, true); }
  };

  // ── NOTAS ACTIONS ──────────────────────────
  const handleSaveNota = async (tipo, form) => {
    if (tipo==='compra' && !form.item) { toast('Completá el item a comprar', true); return; }
    if (tipo==='egreso' && (!form.concepto || !form.monto)) { toast('Completá concepto y monto', true); return; }
    try {
      await db.insertNota({tipo, ...form, monto:parseFloat(form.monto)||0, precio:parseFloat(form.precio)||0, cantidad:parseInt(form.cantidad)||1});
      setModalNota({open:false,tipo:'compra'});
      await loadAll();
      toast(tipo==='compra'?'Item agregado 🛒':'Egreso registrado 💸');
    } catch(e) { toast(e.message, true); }
  };

  const handleToggleCompra = async id => {
    const n = notas.find(x=>x.id===id); if (!n) return;
    try {
      await db.updateNota(id, {completada:!n.completada});
      await loadAll();
    } catch(e) { toast(e.message, true); }
  };

  const handleDeleteNota = async id => {
    if (!confirm('¿Eliminar esta nota?')) return;
    try {
      await db.deleteNota(id);
      await loadAll();
    } catch(e) { toast(e.message, true); }
  };

  // ── CONFIG ACTIONS ─────────────────────────
  const handleSaveConfig = async cfg => {
    try {
      await db.saveConfig(cfg);
      setConfig(cfg);
      toast('Configuración guardada ✅');
    } catch(e) { toast(e.message, true); }
  };

  const pendingCount = turnos.filter(t=>t.estado==='pending').length;
  const activeCliente = clientes.find(c=>c.id===modalCliente.id);
  const w = useWindowWidth();
  const isMob = w < 768;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        html,body,#root{height:100%;font-family:'Outfit',sans-serif;background:#faf8f5;color:#2e2828;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{opacity:1}}
        @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
        <Sidebar
          activePage={page} onNav={setPage} pendingCount={pendingCount}
          mobileOpen={menuOpen} onMobileClose={() => setMenuOpen(false)}
        />

        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>

          {/* Top bar mobile con hamburguesa */}
          {isMob && (
            <div style={{
              display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'12px 16px',
              background:'white',borderBottom:'1px solid #ede8e8',
              boxShadow:'0 2px 8px rgba(0,0,0,.05)',flexShrink:0,
            }}>
              <button onClick={() => setMenuOpen(true)} style={{
                background:'none',border:'none',cursor:'pointer',padding:6,borderRadius:8,
                display:'flex',flexDirection:'column',gap:5,
              }}>
                <span style={{display:'block',width:22,height:2,background:'#4caf8e',borderRadius:2}}/>
                <span style={{display:'block',width:16,height:2,background:'#4caf8e',borderRadius:2}}/>
                <span style={{display:'block',width:22,height:2,background:'#4caf8e',borderRadius:2}}/>
              </button>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>🐾</span>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600}}>Paupet</span>
              </div>
              <div style={{width:34}}/>{/* spacer para centrar el logo */}
            </div>
          )}

          <main style={{flex:1,overflowY:'auto',padding:isMob?'20px 16px':'28px 32px',minWidth:0}}>
            {loading ? <Spinner /> : (
              <>
                {page==='dashboard'  && <Dashboard clientes={clientes} turnos={turnos} onNav={setPage} onCompletar={handleCompletar} onNoVino={handleNoVino}/>}
                {page==='clientes'   && <ClientesPage clientes={clientes} onOpenClient={handleOpenClient} onNuevo={()=>setModalNuevoCliente({open:true,initial:null})}/>}
                {page==='calendario' && <CalendarioPage clientes={clientes} turnos={turnos} onAddTurno={fecha=>setModalTurno({open:true,fecha,turnoEdit:null})} onCompletar={handleCompletar} onNoVino={handleNoVino} onDelete={handleDeleteTurno} onConfirmar={handleConfirmar} onEditTurno={handleEditTurno}/>}
                {page==='historial'  && <HistorialPage clientes={clientes} turnos={turnos}/>}
                {page==='notas'      && <NotasPage notas={notas} onToggleCompra={handleToggleCompra} onDeleteNota={handleDeleteNota} onAgregar={tipo=>setModalNota({open:true,tipo})}/>}
                {page==='horarios'   && <HorariosPage />}
              {page==='config'     && <ConfigPage config={config} onSave={handleSaveConfig}/>}
              </>
            )}
          </main>
        </div>
      </div>

      <ModalCliente open={modalCliente.open} cliente={activeCliente} onClose={()=>setModalCliente({open:false,id:null})} onSaveVisit={handleSaveVisit} onDelete={handleDeleteClient} onEdit={c=>{setModalCliente({open:false,id:null});setModalNuevoCliente({open:true,initial:c});}} onDecrementarInasistencia={handleDecrementarInasistencia}/>
      <ModalClienteForm open={modalNuevoCliente.open} initial={modalNuevoCliente.initial} onClose={()=>setModalNuevoCliente({open:false,initial:null})} onSave={handleSaveNewClient}/>
      <ModalNuevoTurno open={modalTurno.open} onClose={()=>setModalTurno({open:false,fecha:null,turnoEdit:null})} onSave={handleSaveNewTurno} onUpdate={handleUpdateTurno} clientes={clientes} defaultFecha={modalTurno.fecha} turnoEdit={modalTurno.turnoEdit}/>
      <ModalNota open={modalNota.open} defaultTipo={modalNota.tipo} onClose={()=>setModalNota({open:false,tipo:'compra'})} onSave={handleSaveNota}/>
      <ToastContainer toasts={toasts}/>
    </>
  );
}
