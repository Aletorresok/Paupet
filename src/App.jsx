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
        scale: 2,
        useCORS: true,
        backgroundColor: '#7ec8a0',
        logging: false,
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
        width:900, minHeight:580,
        background:'#7ec8a0',
        borderRadius:16,
        padding:'28px 24px 24px',
        position:'relative',
        overflow:'hidden',
        boxShadow:'0 4px 24px rgba(0,0,0,.15)',
        fontFamily:'Arial, sans-serif',
      }}>
        {/* Huellas decorativas de fondo */}
        {[{t:40,l:20,op:.12},{t:200,l:800,op:.1},{t:480,l:60,op:.1},{t:350,l:680,op:.12}].map((h,i)=>(
          <div key={i} style={{position:'absolute',top:h.t,left:h.l,fontSize:60,opacity:h.op,transform:'rotate(15deg)',pointerEvents:'none',userSelect:'none'}}>🐾</div>
        ))}

        {/* Título */}
        <div style={{textAlign:'center',marginBottom:22}}>
          <div style={{fontSize:38,fontWeight:900,letterSpacing:10,color:'#1a1a1a',textTransform:'uppercase'}}>H O R A R I O S</div>
        </div>

        {/* Grid dinámico: 3 columnas fijas, horarios en 2-3 cols dentro de cada card */}
        {(() => {
          const activos = DIAS_SEMANA_HOD.filter(d => diasActivos.includes(d));
          const filas = [];
          const totalFilas = Math.ceil(activos.length / 3);
          for (let i = 0; i < activos.length; i += 3) {
            const fila = activos.slice(i, i + 3);
            const esUltima = i + 3 >= activos.length;
            const espacioLibre = esUltima && fila.length < 3;
            filas.push(
              <div key={i} style={{display:'grid',gridTemplateColumns:`repeat(3,1fr)`,gap:14,marginBottom:14}}>
                {fila.map(dia => {
                  const diaDate = getDiaDate(dia);
                  const horasDia = slots[dia]||[];
                  const tomadosDia = tomados[dia]||[];
                  // Distribuir horarios en 2 o 3 columnas según cantidad
                  const usarDosCols = horasDia.length <= 6;
                  return (
                    <div key={dia} style={{background:'rgba(255,255,255,0.92)',borderRadius:14,padding:'14px 16px',minHeight:140}}>
                      <div style={{background:'#7ec8a0',borderRadius:8,padding:'6px 10px',marginBottom:10,textAlign:'center'}}>
                        <span style={{fontWeight:900,fontSize:14,color:'#1a1a1a',letterSpacing:1}}>{DIAS_HOD_LABELS[dia].toUpperCase()} {diaDate.getDate()}</span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:horasDia.length > 4 ? 'repeat(3,1fr)' : 'repeat(2,1fr)',gap:'2px 6px'}}>
                        {horasDia.map(h=>{
                          const esTomado = tomadosDia.includes(h);
                          return (
                            <div key={h} style={{fontSize:13,fontWeight:700,color:esTomado?'#b0b8b0':'#1a1a1a',padding:'2px 0',textDecoration:esTomado?'line-through':'none'}}>• {h} HS</div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {/* Espacio con imagen de la peluquera o perrito */}
                {espacioLibre && (
                  <div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',minHeight:140,gridColumn: fila.length === 1 ? 'span 2' : 'auto'}}>
                    <img src={PELUQUERA_IMG} style={{height:200,objectFit:'contain',objectPosition:'bottom'}} alt="" crossOrigin="anonymous" />
                  </div>
                )}
                {/* Si todos los días activos llenan exactamente 3 cols en la última fila, imagen extra aparte no aplica */}
              </div>
            );
          }
          // Si todos los días llenaron filas completas, poner imagen flotante abajo a la derecha
          if (activos.length % 3 === 0) {
            filas.push(
              <div key="img-row" style={{display:'flex',justifyContent:'flex-end',marginTop:-8}}>
                <img src={PELUQUERA_IMG} style={{height:190,objectFit:'contain',objectPosition:'bottom'}} alt="" crossOrigin="anonymous" />
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
