import React, { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from "react";
import { supabase } from "./supabase";

// ══════════════════════════════════════════════
//  RESPONSIVE CONTEXT — un solo listener para toda la app
// ══════════════════════════════════════════════
const RespCtx = createContext({ isMob: false, isTab: false, w: 1200 });
function RespProvider({ children }) {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return (
    <RespCtx.Provider value={{ w, isMob: w < 768, isTab: w >= 768 && w < 1024 }}>
      {children}
    </RespCtx.Provider>
  );
}
const useResp = () => useContext(RespCtx);

// ══════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
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
const DIAS_SEMANA_HOD = ['lunes','martes','miercoles','jueves','viernes','sabado'];
const DIAS_HOD_LABELS = {lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',jueves:'Jueves',viernes:'Viernes',sabado:'Sábado'};
const PELUQUERA_IMG = 'https://i.imgur.com/6QqBwOP.png';
const STORAGE_KEY_HOD = 'paupet_horarios_v2';

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

const abrirWhatsApp = (tel, dogName, ownerName, turno = null) => {
  if (!tel) return;
  let num = tel.replace(/[\s\-()]/g, '');
  if (!num.startsWith('+') && !num.startsWith('549')) {
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

const getSlotsDelDia = (slots, fechaKey, dia) => {
  if (slots[fechaKey] && slots[fechaKey].length > 0) return slots[fechaKey];
  return [];
};

// ══════════════════════════════════════════════
//  SUPABASE DATA LAYER
// ══════════════════════════════════════════════
const db = {
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
      .order('dog', { ascending: true });
    if (error) throw error;
    // Deduplicar por dog+owner
    const seen = new Set();
    return data
      .filter(c => {
        const key = `${c.dog?.toLowerCase().trim()}|${c.owner?.toLowerCase().trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(c => ({
        ...c,
        visitas: (c.visitas || []).map(v => ({
          id: v.id,
          servicio: v.servicio,
          precio: v.precio,
          fecha: v.fecha,
          cliente_id: v.cliente_id,
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
  async updateVisita(id, fields) {
    const { error } = await supabase.from('visitas').update(fields).eq('id', id);
    if (error) throw error;
  },
  async deleteVisita(id) {
    const { error } = await supabase.from('visitas').delete().eq('id', id);
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
    // Map camelCase clientId → cliente_id if present
    const mapped = { ...fields };
    if ('clientId' in mapped) { mapped.cliente_id = mapped.clientId; delete mapped.clientId; }
    if ('dogName' in mapped) { mapped.dog_name = mapped.dogName; delete mapped.dogName; }
    const { error } = await supabase.from('turnos').update(mapped).eq('id', id);
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
    return data.map(n => ({ ...n, notas: n.notas_texto }));
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

  // CONFIG (incluye horarios semanales)
  async getConfig() {
    const { data, error } = await supabase.from('config').select('*').eq('id', 1).single();
    if (error) return DEFAULT_CONFIG;
    return {
      nombre: data.nombre,
      msg: data.msg,
      anticip: data.anticip,
      horarios: data.horarios || DEFAULT_CONFIG.horarios,
      slots: data.slots || {},
      horariosSemanales: data.horarios_semanales || null,
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
      horarios_semanales: cfg.horariosSemanales || null,
    });
    if (error) throw error;
  },
};

// ══════════════════════════════════════════════
//  UI PRIMITIVES
// ══════════════════════════════════════════════
function ToastContainer({ toasts }) {
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

function Modal({ open, onClose, children, width = 560 }) {
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
        animation: isMob ? 'slideUp .3s ease' : 'slideUp .3s ease',
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
      padding:'24px 26px 18px', display:'flex', gap:16,
      position:'relative',
      flexDirection: avatar ? 'row' : 'column',
      alignItems: avatar ? 'flex-end' : 'flex-start',
    }}>
      {avatar && (
        <div style={{width:72,height:72,borderRadius:'50%',background:'white',border:'3px solid white',boxShadow:'0 4px 20px rgba(0,0,0,.08)',fontSize:34,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
          {avatar}
        </div>
      )}
      <div style={{flex:1,minWidth:0}}>
        <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,paddingRight:32}}>{title}</h3>
        {subtitle && <p style={{color:'#9a9090',fontSize:12,marginTop:2}}>{subtitle}</p>}
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
  return <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:c.bg,color:c.color,whiteSpace:'nowrap'}}>{children}</span>;
}

function Btn({ variant='primary', size='', onClick, children, style={}, disabled=false }) {
  const styles = {
    primary: {background:'#5fbf9b',color:'white'},
    pink:    {background:'#e8809a',color:'white'},
    ghost:   {background:'transparent',color:'#9a9090',border:'1.5px solid #ede8e8'},
    danger:  {background:'#fde8ed',color:'#e8809a',border:'1.5px solid #f5c6d0'},
  };
  const sizes = {
    '':  {padding:'10px 20px',fontSize:13},
    sm:  {padding:'7px 14px', fontSize:12},
    xs:  {padding:'5px 10px', fontSize:11},
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:'inline-flex',alignItems:'center',gap:7,border:'none',borderRadius:50,
      cursor:disabled?'not-allowed':'pointer',fontFamily:"'Outfit',sans-serif",
      fontWeight:500,whiteSpace:'nowrap',transition:'all .2s',
      opacity:disabled?.6:1,
      ...styles[variant],...sizes[size],...style,
    }}>
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

function Spinner() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flex:1,minHeight:200}}>
      <div style={{width:36,height:36,border:'3px solid #dff5ec',borderTop:'3px solid #5fbf9b',borderRadius:'50%',animation:'spin 1s linear infinite'}} />
    </div>
  );
}

// Confirm dialog (reemplaza window.confirm)
function ConfirmDialog({ open, msg, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onCancel?.()} style={{position:'fixed',inset:0,zIndex:9000,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,backdropFilter:'blur(4px)'}}>
      <div style={{background:'white',borderRadius:18,padding:28,maxWidth:340,width:'100%',boxShadow:'0 12px 40px rgba(0,0,0,.15)',textAlign:'center'}}>
        <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
        <p style={{fontSize:14,marginBottom:20,lineHeight:1.6,color:'#2e2828'}}>{msg}</p>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
          <Btn variant="pink" onClick={onConfirm}>Confirmar</Btn>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  SIDEBAR
// ══════════════════════════════════════════════
const NAV_ITEMS = [
  {page:'dashboard', icon:'🏠', label:'Panel de Control'},
  {page:'clientes',  icon:'🐶', label:'Clientes'},
  {page:'calendario',icon:'📅', label:'Calendario', badge:true},
  {page:'historial', icon:'📋', label:'Historial'},
  {page:'notas',     icon:'📝', label:'Notas & Stock'},
  {page:'horarios',  icon:'📸', label:'Horarios'},
  {page:'config',    icon:'⚙️', label:'Configuración'},
];

function Sidebar({ activePage, onNav, pendingCount, mobileOpen, onMobileClose }) {
  const { isMob } = useResp();
  const handleNav = (p) => { onNav(p); if (isMob) onMobileClose(); };

  const inner = (
    <nav style={{
      width: isMob ? 240 : 220, minWidth: isMob ? 240 : 220, height:'100%',
      background:'linear-gradient(180deg,#4caf8e 0%,#5fbf9b 40%,#c5879a 100%)',
      display:'flex', flexDirection:'column', padding:'20px 12px',
      position:'relative', zIndex:20, boxShadow:'4px 0 24px rgba(0,0,0,.08)', overflow:'hidden',
    }}>
      <div style={{position:'absolute',top:-60,right:-60,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,.07)'}}/>
      <div style={{position:'absolute',bottom:-40,left:-40,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,.05)'}}/>

      {isMob && (
        <button onClick={onMobileClose} style={{
          position:'absolute',top:14,right:14,zIndex:10,width:28,height:28,
          background:'rgba(255,255,255,.25)',border:'none',borderRadius:'50%',
          color:'white',fontSize:14,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
        }}>✕</button>
      )}

      <div style={{textAlign:'center',marginBottom:24,position:'relative',zIndex:1}}>
        <div style={{width:50,height:50,background:'white',borderRadius:'50%',margin:'0 auto 8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:'0 4px 16px rgba(0,0,0,.15)'}}>🐾</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,color:'white',letterSpacing:.5}}>Paupet</h1>
        <span style={{fontSize:10,color:'rgba(255,255,255,.7)',fontWeight:300,letterSpacing:1,textTransform:'uppercase'}}>Peluquería Canina</span>
      </div>

      <div style={{flex:1,display:'flex',flexDirection:'column',gap:2,position:'relative',zIndex:1,overflowY:'auto'}}>
        {NAV_ITEMS.map(item => (
          <div key={item.page} onClick={() => handleNav(item.page)} style={{
            display:'flex',alignItems:'center',gap:9,padding:'10px 12px',borderRadius:10,cursor:'pointer',
            fontSize:13,fontWeight:activePage===item.page?500:400,
            background:activePage===item.page?'white':'transparent',
            color:activePage===item.page?'#2e2828':'rgba(255,255,255,.85)',
            boxShadow:activePage===item.page?'0 4px 20px rgba(0,0,0,.08)':'none',
            transition:'all .2s',
          }}>
            <span style={{fontSize:15,width:20,textAlign:'center',flexShrink:0}}>{item.icon}</span>
            <span style={{flex:1}}>{item.label}</span>
            {item.badge && pendingCount > 0 && (
              <span style={{background:'#e8809a',color:'white',fontSize:10,fontWeight:600,borderRadius:20,padding:'2px 6px',minWidth:18,textAlign:'center'}}>{pendingCount}</span>
            )}
          </div>
        ))}
      </div>
    </nav>
  );

  if (!isMob) return inner;
  return (
    <>
      {mobileOpen && (
        <div onClick={onMobileClose} style={{position:'fixed',inset:0,zIndex:997,background:'rgba(0,0,0,.5)',backdropFilter:'blur(2px)'}}/>
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
function Dashboard({ clientes, turnos, onNav, onCompletar, onNoVino, onEditTurno }) {
  const { isMob, isTab } = useResp();
  const hoy = new Date();
  const hoyISO = todayStr();
  const hoyTurnos = turnos.filter(t => t.fecha === hoyISO && t.estado !== 'completed');
  const pending = turnos.filter(t => t.estado === 'pending');
  const mes = hoy.getMonth(), yr = hoy.getFullYear();
  const ing = turnos.filter(t => t.estado==='completed' && new Date(t.fecha).getMonth()===mes && new Date(t.fecha).getFullYear()===yr).reduce((s,t) => s+(t.precio||0), 0);
  const conInasistencias = clientes.filter(c => c.inasistencias > 0).sort((a,b) => b.inasistencias-a.inasistencias);

  const cols = isMob ? 2 : 4;
  const stats = [
    {label:'Clientes', val:clientes.length, sub:'registrados', emoji:'🐶'},
    {label:'Turnos Hoy', val:hoyTurnos.length, sub:'pendientes', emoji:'📅'},
    {label:'Ingresos', val:fmtPeso(ing), sub:'este mes', emoji:'💚'},
    {label:'Pendientes', val:pending.length, sub:'sin confirmar', emoji:'⏳'},
  ];

  return (
    <section>
      <div style={{marginBottom:20,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMob?24:30,fontWeight:600,lineHeight:1.1}}>Panel de Control 🌸</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>{DIAS_ES[hoy.getDay()]}, {hoy.getDate()} de {MESES[hoy.getMonth()]} de {hoy.getFullYear()}</p>
        </div>
        <Btn onClick={() => onNav('calendario')} size={isMob?'sm':''}>+ Nuevo turno</Btn>
      </div>

      <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:12,marginBottom:20}}>
        {stats.map(s => (
          <div key={s.label} style={{background:'white',borderRadius:16,padding:'16px 18px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',right:-6,top:-2,fontSize:44,opacity:.1}}>{s.emoji}</div>
            <div style={{fontSize:10,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5}}>{s.label}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMob?26:32,fontWeight:600,lineHeight:1,margin:'3px 0'}}>{s.val}</div>
            <div style={{fontSize:10,color:'#9a9090'}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':(isTab?'1fr':'1.4fr 1fr'),gap:16}}>
        <div style={{background:'white',borderRadius:16,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,marginBottom:12}}>Turnos de hoy</div>
          {!hoyTurnos.length ? <p style={{fontSize:13,color:'#9a9090',textAlign:'center',padding:16}}>Sin turnos para hoy</p>
            : hoyTurnos.map(t => {
              const c = clientes.find(x => x.id===t.clientId)||{};
              return (
                <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid #dff5ec',flexWrap:'wrap'}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:'#fde8ed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0,overflow:'hidden'}}>
                    {c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : animalIcon(c.raza)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                      {t.dogName||c.dog}
                      <Badge variant={t.estado==='confirmed'?'green':'orange'}>{t.estado==='confirmed'?'Confirmado':'Pendiente'}</Badge>
                    </div>
                    <div style={{fontSize:11,color:'#9a9090'}}>{t.servicio} · {t.hora}</div>
                  </div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                    {c.tel && (
                      <Btn size="xs" onClick={() => abrirWhatsApp(c.tel, t.dogName||c.dog, c.owner, t)} style={{background:'#25d366',color:'white',border:'none'}}>💬</Btn>
                    )}
                    <Btn size="xs" onClick={() => onEditTurno(t)}>✏️</Btn>
                    <Btn size="xs" onClick={() => onCompletar(t.id)}>✓</Btn>
                    <Btn size="xs" variant="pink" onClick={() => onNoVino(t.id)}>✕</Btn>
                  </div>
                </div>
              );
            })
          }
        </div>
        <div style={{background:'white',borderRadius:16,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,marginBottom:12}}>Clientes con inasistencias</div>
          {!conInasistencias.length ? <p style={{fontSize:13,color:'#9a9090',textAlign:'center',padding:16}}>Todos vinieron 👍</p>
            : conInasistencias.map(c => (
              <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid #dff5ec'}}>
                <div style={{width:34,height:34,borderRadius:'50%',background:'#fde8ed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>
                  {c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : animalIcon(c.raza)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500}}>{c.dog}</div>
                  <div style={{fontSize:11,color:'#9a9090',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.owner}</div>
                </div>
                <Badge variant="orange">{c.inasistencias}</Badge>
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
  const { isMob } = useResp();
  const [q, setQ] = useState('');
  const filtered = useMemo(() =>
    clientes.filter(c =>
      c.dog.toLowerCase().includes(q.toLowerCase()) ||
      c.owner.toLowerCase().includes(q.toLowerCase())
    ), [clientes, q]);

  return (
    <section>
      <div style={{marginBottom:20,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMob?24:30,fontWeight:600}}>Gestión de Clientes</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Base de datos de mascotas y dueños</p>
        </div>
        <Btn onClick={onNuevo} size={isMob?'sm':''}>+ Nuevo cliente</Btn>
      </div>
      <div style={{marginBottom:16,display:'flex',gap:12,alignItems:'center'}}>
        <div style={{flex:1,display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <span>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar perrito o dueño..." style={{border:'none',outline:'none',fontFamily:"'Outfit',sans-serif",fontSize:13,width:'100%',background:'transparent'}} />
        </div>
        <span style={{fontSize:13,color:'#9a9090',whiteSpace:'nowrap'}}>{filtered.length} cliente{filtered.length!==1?'s':''}</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fill,minmax(${isMob?'150px':'200px'},1fr))`,gap:14}}>
        {!filtered.length ? <p style={{color:'#9a9090',fontSize:14,padding:'24px 0'}}>Sin clientes. ¡Agregá el primero!</p>
          : filtered.map(c => {
            const ultima = c.visitas?.length ? [...c.visitas].sort((a,b) => b.fecha.localeCompare(a.fecha))[0] : null;
            const dias = ultima ? Math.floor((Date.now()-new Date(ultima.fecha))/86400000) : null;
            const bv = dias===null?'gray':dias>30?'pink':'green';
            const bt = dias===null?'Sin visitas':dias===0?'Hoy':`Hace ${dias}d`;
            return (
              <div key={c.id} onClick={() => onOpenClient(c.id)} style={{background:'white',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.06)',cursor:'pointer',transition:'transform .15s',}}>
                <div style={{height:110,background:'linear-gradient(135deg,#dff5ec,#fde8ed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:44,overflow:'hidden'}}>
                  {c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={c.dog} /> : <span>{animalIcon(c.raza)}</span>}
                </div>
                <div style={{padding:'11px 13px'}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.dog}</div>
                  <div style={{fontSize:11,color:'#9a9090',marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>👤 {c.owner}</div>
                  {c.raza && <div style={{fontSize:11,color:'#9a9090',marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>🐾 {c.raza}</div>}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:4}}>
                    <Badge variant={bv}>{bt}</Badge>
                    <span style={{fontSize:11,color:'#9a9090'}}>{(c.visitas||[]).length}v</span>
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
function ModalCliente({ open, cliente, onClose, onSaveVisit, onEditVisit, onDeleteVisit, onDelete, onEdit, onDecrementarInasistencia }) {
  const { isMob } = useResp();
  const [showForm, setShowForm] = useState(false);
  const [svc, setSvc] = useState('');
  const [precio, setPrecio] = useState('');
  const [fecha, setFecha] = useState(todayStr());
  const [editingVisita, setEditingVisita] = useState(null); // {id, servicio, precio, fecha}

  useEffect(() => {
    if (open) { setShowForm(false); setSvc(''); setPrecio(''); setFecha(todayStr()); setEditingVisita(null); }
  }, [open]);

  if (!open || !cliente) return null;
  const c = cliente;

  const handleSaveVisita = () => {
    if (editingVisita) {
      onEditVisit(editingVisita.id, svc, parseFloat(precio)||0, fecha);
      setEditingVisita(null);
    } else {
      onSaveVisit(c.id, svc, parseFloat(precio)||0, fecha);
    }
    setShowForm(false); setSvc(''); setPrecio(''); setFecha(todayStr());
  };

  const startEditVisita = (v) => {
    setEditingVisita(v);
    setSvc(v.servicio); setPrecio(String(v.precio)); setFecha(v.fecha);
    setShowForm(true);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHead title={c.dog} subtitle={`👤 ${c.owner}${c.tel?' · 📱 '+c.tel:''}`} onClose={onClose}
        avatar={c.foto ? <img src={c.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : <span style={{fontSize:34}}>{animalIcon(c.raza)}</span>}
      />
      <div style={{padding:'18px 22px'}}>
        <div style={{display:'grid',gridTemplateColumns:isMob?'1fr 1fr':'repeat(4,1fr)',gap:8,marginBottom:14}}>
          {[{l:'Raza',v:c.raza||'–'},{l:'Tamaño',v:c.size||'–'},{l:'Pelaje',v:c.pelaje||'–'},{l:'Visitas',v:(c.visitas||[]).length}].map(ch=>(
            <div key={ch.l} style={{background:'white',borderRadius:10,padding:'8px 12px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
              <div style={{fontSize:10,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5}}>{ch.l}</div>
              <div style={{fontSize:13,fontWeight:500,marginTop:1}}>{ch.v}</div>
            </div>
          ))}
        </div>

        {(c.inasistencias||0) > 0 && (
          <div style={{marginBottom:14,padding:'10px 14px',background:'#fde8ed',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:'#e8809a'}}>INASISTENCIAS</div>
              <div style={{fontSize:20,fontWeight:600,color:'#e8809a'}}>{c.inasistencias}</div>
            </div>
            <Btn size="sm" variant="pink" onClick={() => onDecrementarInasistencia(c.id)}>➖ Restar</Btn>
          </div>
        )}

        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontWeight:600,marginBottom:6}}>📝 Notas</div>
        <div style={{background:'#fde8ed',borderRadius:10,padding:'10px 13px',fontSize:13,lineHeight:1.6,borderLeft:'3px solid #e8809a',marginBottom:14}}>{c.notes||'Sin notas especiales.'}</div>

        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontWeight:600,margin:'14px 0 8px'}}>✂️ Historial de visitas</div>
        {!(c.visitas||[]).length ? <p style={{fontSize:13,color:'#9a9090'}}>Sin visitas aún</p>
          : [...(c.visitas||[])].reverse().map((v,i) => (
            <div key={v.id||i} style={{display:'flex',alignItems:'center',gap:10,background:'white',borderRadius:10,padding:'9px 12px',marginBottom:6,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:'#5fbf9b',flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500}}>{v.servicio}</div>
                <div style={{fontSize:11,color:'#9a9090'}}>{fmtFecha(v.fecha)}</div>
              </div>
              <div style={{fontSize:13,fontWeight:600,color:'#3a9b7b'}}>{fmtPeso(v.precio)}</div>
              {v.id && (
                <div style={{display:'flex',gap:4}}>
                  <button onClick={() => startEditVisita(v)} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#9a9090',padding:'2px 4px'}}>✏️</button>
                  <button onClick={() => onDeleteVisit(v.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#e8809a',padding:'2px 4px'}}>🗑</button>
                </div>
              )}
            </div>
          ))
        }

        <div style={{display:'flex',gap:8,marginTop:14,flexWrap:'wrap'}}>
          <Btn size="sm" onClick={() => { setShowForm(!showForm); setEditingVisita(null); setSvc(''); setPrecio(''); setFecha(todayStr()); }}>
            {showForm && !editingVisita ? '✕ Cancelar' : '+ Registrar visita'}
          </Btn>
          {c.tel && (
            <Btn size="sm" onClick={() => abrirWhatsApp(c.tel, c.dog, c.owner)} style={{background:'#25d366',color:'white',border:'none'}}>💬 WhatsApp</Btn>
          )}
          <Btn size="sm" variant="ghost" onClick={() => onEdit(c)}>✏️ Editar</Btn>
          <Btn size="sm" variant="danger" onClick={() => onDelete(c.id)}>🗑 Eliminar</Btn>
        </div>

        {showForm && (
          <div style={{background:'#dff5ec',borderRadius:10,padding:14,marginTop:10}}>
            <div style={{fontSize:12,fontWeight:600,color:'#3a9b7b',marginBottom:10}}>
              {editingVisita ? '✏️ Editar visita' : '+ Nueva visita'}
            </div>
            <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr 1fr',gap:10,marginBottom:10}}>
              <FormGroup label="Servicio"><input value={svc} onChange={e=>setSvc(e.target.value)} placeholder="Baño y corte" style={inputStyle} /></FormGroup>
              <FormGroup label="Precio"><input type="number" value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="0" style={inputStyle} /></FormGroup>
              <FormGroup label="Fecha"><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inputStyle} /></FormGroup>
            </div>
            <div style={{display:'flex',gap:8}}>
              <Btn size="sm" onClick={handleSaveVisita}>💾 Guardar</Btn>
              {editingVisita && <Btn size="sm" variant="ghost" onClick={() => { setEditingVisita(null); setShowForm(false); }}>Cancelar</Btn>}
            </div>
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
  const { isMob } = useResp();
  const [form, setForm] = useState({dog:'',raza:'',size:'',pelaje:'',owner:'',tel:'',notes:'',foto:null});
  const [saving, setSaving] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(initial || {dog:'',raza:'',size:'',pelaje:'',owner:'',tel:'',notes:'',foto:null});
      setSaving(false); setFotoFile(null);
    }
  }, [open, initial]);

  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const handleFoto = e => {
    const f = e.target.files[0]; if (!f) return;
    setFotoFile(f);
    const r = new FileReader();
    r.onload = ev => set('foto', ev.target.result);
    r.readAsDataURL(f);
  };
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    await onSave(form, fotoFile);
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHead title={initial?'Editar Cliente':'Nuevo Cliente'} subtitle={!initial?'Registrá a un nuevo perrito y su dueño':''} onClose={onClose} />
      <div style={{padding:'18px 22px'}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
          <div onClick={() => document.getElementById('foto-input').click()} style={{width:66,height:66,borderRadius:'50%',background:'#dff5ec',border:'2px dashed #5fbf9b',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:26,overflow:'hidden',flexShrink:0}}>
            {form.foto ? <img src={form.foto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" /> : '🐾'}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>Foto del perro</div>
            <div style={{fontSize:11,color:'#9a9090'}}>Hacé click para {initial?'cambiar':'subir'}</div>
            <input id="foto-input" type="file" accept="image/*" style={{display:'none'}} onChange={handleFoto} />
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:12,marginBottom:10}}>
          <FormGroup label="Nombre del perro *"><input value={form.dog} onChange={e=>set('dog',e.target.value)} placeholder="Coco" style={inputStyle} /></FormGroup>
          <FormGroup label="Raza"><input value={form.raza} onChange={e=>set('raza',e.target.value)} placeholder="Caniche" style={inputStyle} /></FormGroup>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:12,marginBottom:10}}>
          <FormGroup label="Tamaño">
            <select value={form.size} onChange={e=>set('size',e.target.value)} style={inputStyle}>
              <option value="">—</option><option>Pequeño</option><option>Mediano</option><option>Grande</option>
            </select>
          </FormGroup>
          <FormGroup label="Color / pelaje"><input value={form.pelaje} onChange={e=>set('pelaje',e.target.value)} placeholder="Blanco rizado" style={inputStyle} /></FormGroup>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:12,marginBottom:10}}>
          <FormGroup label="Dueño *"><input value={form.owner} onChange={e=>set('owner',e.target.value)} placeholder="María García" style={inputStyle} /></FormGroup>
          <FormGroup label="Teléfono"><input value={form.tel} onChange={e=>set('tel',e.target.value)} placeholder="11-2345-6789" style={inputStyle} /></FormGroup>
        </div>
        <FormGroup label="Notas especiales">
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Alergias, comportamiento, cuidados especiales..." style={{...inputStyle,resize:'vertical',minHeight:68}} />
        </FormGroup>
        <div style={{display:'flex',gap:10,marginTop:14}}>
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
  const { isMob, isTab } = useResp();
  const hoy = new Date();
  const [year, setYear] = useState(hoy.getFullYear());
  const [month, setMonth] = useState(hoy.getMonth());
  const [selectedDay, setSelectedDay] = useState(todayStr());

  const changeMonth = dir => {
    let m = month+dir, y = year;
    if (m<0){m=11;y--;} if (m>11){m=0;y++;}
    setMonth(m); setYear(y);
  };

  const todISO = todayStr();
  const first = new Date(year,month,1).getDay();
  const days  = new Date(year,month+1,0).getDate();
  const dayTurnos = selectedDay ? turnos.filter(t => t.fecha===selectedDay) : [];
  const sidebarWidth = isMob ? '100%' : '300px';

  return (
    <section>
      <div style={{marginBottom:20,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMob?24:30,fontWeight:600}}>Calendario de Turnos</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Agenda y gestión de citas</p>
        </div>
        <Btn onClick={() => onAddTurno(selectedDay)} size={isMob?'sm':''}>+ Agregar turno</Btn>
      </div>

      <div style={{display:'flex',flexDirection:isMob?'column':'row',gap:16}}>
        {/* Calendario */}
        <div style={{flex:1,background:'white',borderRadius:16,padding:isMob?'14px 10px':'18px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button onClick={()=>changeMonth(-1)} style={{background:'white',border:'1.5px solid #ede8e8',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMob?18:20,fontWeight:600,minWidth:150,textAlign:'center'}}>
                {MESES[month].charAt(0).toUpperCase()+MESES[month].slice(1)} {year}
              </span>
              <button onClick={()=>changeMonth(1)} style={{background:'white',border:'1.5px solid #ede8e8',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
            </div>
            {!isMob && (
              <div style={{display:'flex',gap:10,fontSize:11,color:'#9a9090',alignItems:'center'}}>
                <span><span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:'#5fbf9b',marginRight:3,verticalAlign:'middle'}}/>Confirmado</span>
                <span><span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:'#e8809a',marginRight:3,verticalAlign:'middle'}}/>Pendiente</span>
              </div>
            )}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:isMob?2:4}}>
            {CAL_DAYS.map(d=><div key={d} style={{textAlign:'center',fontSize:10,fontWeight:500,color:'#9a9090',padding:'6px 0',textTransform:'uppercase',letterSpacing:.4}}>{d}</div>)}
            {Array(first).fill(null).map((_,i)=><div key={'e'+i} style={{minHeight:isMob?44:60,borderRadius:8,background:'#f5f3f0',opacity:.4}}/>)}
            {Array.from({length:days},(_,i)=>i+1).map(d => {
              const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              const dayT = turnos.filter(t=>t.fecha===iso);
              const isToday=iso===todISO, isSel=iso===selectedDay, hasApt=dayT.length>0;
              return (
                <div key={d} onClick={()=>setSelectedDay(iso)} style={{
                  minHeight:isMob?44:60,borderRadius:8,padding:isMob?'4px 3px':'6px 7px',
                  background:isSel?'#dff5ec':isToday?'#f0faf7':'white',
                  border:`1.5px solid ${isSel?'#3a9b7b':isToday?'#5fbf9b':hasApt?'#f7bfcb':'transparent'}`,
                  cursor:'pointer',transition:'all .15s',
                }}>
                  <div style={{fontSize:11,fontWeight:500,marginBottom:2,...(isToday?{background:'#5fbf9b',color:'white',width:18,height:18,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}:{})}}>{d}</div>
                  <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
                    {dayT.slice(0,isMob?2:4).map((t,i)=><div key={i} style={{width:5,height:5,borderRadius:'50%',background:t.estado==='confirmed'?'#5fbf9b':t.estado==='pending'?'#e8809a':'#9a9090'}}/>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel del día */}
        <div style={{width:sidebarWidth,flexShrink:0,background:'white',borderRadius:16,padding:'18px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,marginBottom:12}}>
            {selectedDay
              ? `${DIAS_ES[new Date(selectedDay+'T12:00:00').getDay()]} ${new Date(selectedDay+'T12:00:00').getDate()} de ${MESES[new Date(selectedDay+'T12:00:00').getMonth()]}`
              : 'Seleccioná un día'}
          </div>
          {!selectedDay ? <p style={{fontSize:13,color:'#9a9090'}}>Hacé click en un día del calendario</p>
            : !dayTurnos.length ? <p style={{fontSize:13,color:'#9a9090'}}>Sin turnos para este día</p>
            : dayTurnos.map(t => {
              const c = clientes.find(x=>x.id===t.clientId)||{};
              return (
                <div key={t.id} style={{background:'#faf8f5',borderRadius:10,padding:'10px 12px',marginBottom:8,borderLeft:`3px solid ${t.estado==='pending'?'#e8809a':t.estado==='completed'?'#9a9090':'#5fbf9b'}`,opacity:t.estado==='completed'?.75:1}}>
                  <div style={{fontSize:11,color:'#9a9090',fontWeight:600,textTransform:'uppercase'}}>{t.hora}</div>
                  <div style={{fontSize:14,fontWeight:500}}>{t.dogName||c.dog}</div>
                  <div style={{fontSize:12,color:'#9a9090'}}>{t.servicio} · {fmtPeso(t.precio)}</div>
                  <div style={{display:'flex',gap:4,marginTop:7,flexWrap:'wrap'}}>
                    {t.estado==='pending' && <Btn size="xs" onClick={()=>onConfirmar(t.id)}>✓ Confirmar</Btn>}
                    {t.estado!=='completed' && <Btn size="xs" onClick={()=>onCompletar(t.id)}>✓ Completar</Btn>}
                    {t.estado!=='completed' && <Btn size="xs" variant="pink" onClick={()=>onNoVino(t.id)}>✕ No vino</Btn>}
                    {t.estado==='completed' && <span style={{fontSize:10,color:'#5fbf9b',padding:'3px 8px',background:'#dff5ec',borderRadius:20,fontWeight:600}}>✓ Completado</span>}
                    {c.tel && <Btn size="xs" onClick={()=>abrirWhatsApp(c.tel,t.dogName||c.dog,c.owner,t)} style={{background:'#25d366',color:'white',border:'none'}}>💬</Btn>}
                    <Btn size="xs" variant="ghost" onClick={()=>onEditTurno(t)}>✏️</Btn>
                    <Btn size="xs" variant="danger" onClick={()=>onDelete(t.id)}>🗑</Btn>
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
//  Permite reasignar cliente sin borrar el turno
// ══════════════════════════════════════════════
function ModalNuevoTurno({ open, onClose, onSave, onUpdate, clientes, defaultFecha, turnoEdit }) {
  const { isMob } = useResp();
  const isEdit = !!turnoEdit;
  const [mode, setMode] = useState('exist');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({clientId:'',dog:'',owner:'',raza:'',tel:'',svc:'',fecha:defaultFecha||todayStr(),hora:'10:00',precio:'',estado:'confirmed'});

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    if (isEdit) {
      setForm({
        clientId: String(turnoEdit.clientId || ''),
        dog:'',owner:'',raza:'',tel:'',
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
      // En edición: si cambiaron el cliente, también actualizar clientId y dogName
      const clienteSeleccionado = clientes.find(x => x.id === parseInt(form.clientId));
      await onUpdate(turnoEdit.id, {
        servicio: form.svc,
        fecha:    form.fecha,
        hora:     form.hora,
        precio:   parseFloat(form.precio) || 0,
        estado:   form.estado,
        clientId: form.clientId ? parseInt(form.clientId) : turnoEdit.clientId,
        dogName:  clienteSeleccionado ? clienteSeleccionado.dog : turnoEdit.dogName,
      });
    } else {
      await onSave(mode, form);
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <ModalHead
        title={isEdit ? '✏️ Editar Turno' : 'Agregar Turno'}
        subtitle={isEdit ? `${turnoEdit?.dogName || ''} — ${fmtFecha(turnoEdit?.fecha)}` : ''}
        onClose={onClose}
      />
      <div style={{padding:'18px 22px'}}>
        {/* Selector de cliente — tanto en nuevo como en edición */}
        <div style={{marginBottom:14,padding:12,background:'#dff5ec',borderRadius:10}}>
          <div style={{fontSize:11,fontWeight:600,color:'#3a9b7b',marginBottom:8,textTransform:'uppercase'}}>
            {isEdit ? '🔄 Reasignar cliente (opcional)' : '¿Cliente nuevo o existente?'}
          </div>
          {!isEdit && (
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <Btn size="sm" variant={mode==='exist'?'primary':'ghost'} onClick={()=>setMode('exist')} style={{flex:1,justifyContent:'center'}}>Existente</Btn>
              <Btn size="sm" variant={mode==='new'?'primary':'ghost'} onClick={()=>setMode('new')} style={{flex:1,justifyContent:'center'}}>Crear nuevo</Btn>
            </div>
          )}
          {(mode==='exist' || isEdit) && (
            <FormGroup label="Seleccionar cliente">
              <select value={form.clientId} onChange={e=>set('clientId',e.target.value)} style={inputStyle}>
                <option value="">{isEdit ? '— Sin cambios —' : '— Seleccionar —'}</option>
                {clientes.map(c=><option key={c.id} value={c.id}>{c.dog} ({c.owner})</option>)}
              </select>
            </FormGroup>
          )}
          {!isEdit && mode==='new' && (
            <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:10,marginTop:8}}>
              <FormGroup label="Nombre del perro"><input value={form.dog} onChange={e=>set('dog',e.target.value)} placeholder="Ej: Coco" style={inputStyle} /></FormGroup>
              <FormGroup label="Dueño"><input value={form.owner} onChange={e=>set('owner',e.target.value)} placeholder="Ej: María García" style={inputStyle} /></FormGroup>
              <FormGroup label="Raza"><input value={form.raza} onChange={e=>set('raza',e.target.value)} placeholder="Caniche" style={inputStyle} /></FormGroup>
              <FormGroup label="Teléfono"><input value={form.tel} onChange={e=>set('tel',e.target.value)} placeholder="11-xxxx-xxxx" style={inputStyle} /></FormGroup>
            </div>
          )}
        </div>

        <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:12,marginBottom:10}}>
          <FormGroup label="Servicio"><input value={form.svc} onChange={e=>set('svc',e.target.value)} placeholder="Baño y corte" style={inputStyle} /></FormGroup>
          <FormGroup label="Fecha"><input type="date" value={form.fecha} onChange={e=>set('fecha',e.target.value)} style={inputStyle} /></FormGroup>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:12,marginBottom:10}}>
          <FormGroup label="Hora"><input type="time" value={form.hora} onChange={e=>set('hora',e.target.value)} style={inputStyle} /></FormGroup>
          <FormGroup label="Precio ($)"><input type="number" value={form.precio} onChange={e=>set('precio',e.target.value)} placeholder="0" style={inputStyle} /></FormGroup>
        </div>
        <FormGroup label="Estado">
          <select value={form.estado} onChange={e=>set('estado',e.target.value)} style={{...inputStyle,marginBottom:14}}>
            <option value="confirmed">Confirmado</option>
            <option value="pending">Pendiente</option>
          </select>
        </FormGroup>

        <Btn onClick={handleGuardar} disabled={saving} style={{width:'100%',justifyContent:'center'}}>
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
  const { isMob } = useResp();
  const [q, setQ] = useState('');
  const [mes, setMes] = useState('');

  const { all, months } = useMemo(() => {
    const allVisits = clientes.flatMap(c =>
      (c.visitas||[]).map(v => ({...v, dog:c.dog, owner:c.owner, source:'visita'}))
    );
    const completedT = turnos
      .filter(t => t.estado==='completed')
      .map(t => {
        const c = clientes.find(x=>x.id===t.clientId)||{};
        return {id:t.id, fecha:t.fecha, servicio:t.servicio, precio:t.precio||0, dog:t.dogName||c.dog||'', owner:c.owner||'', source:'turno'};
      });
    // Deduplicar por dog+fecha+servicio
    const seen = new Set();
    const merged = [...completedT, ...allVisits]
      .filter(v => {
        const k = `${v.dog}|${v.fecha}|${v.servicio}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a,b) => b.fecha.localeCompare(a.fecha));
    const months = [...new Set(merged.map(v => v.fecha.slice(0,7)))];
    return { all: merged, months };
  }, [clientes, turnos]);

  const filtered = useMemo(() =>
    all.filter(v => {
      const mq = !q || (v.dog+v.owner+v.servicio).toLowerCase().includes(q.toLowerCase());
      const mm = !mes || v.fecha.startsWith(mes);
      return mq && mm;
    }), [all, q, mes]);

  const totalFiltered = filtered.reduce((s,v) => s+(v.precio||0), 0);

  return (
    <section>
      <div style={{marginBottom:20,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMob?24:30,fontWeight:600}}>Historial de Visitas</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Registro completo de todos los servicios</p>
        </div>
        {totalFiltered > 0 && <div style={{background:'#dff5ec',borderRadius:50,padding:'8px 16px',fontSize:13,fontWeight:600,color:'#3a9b7b'}}>Total: {fmtPeso(totalFiltered)}</div>}
      </div>
      <div style={{background:'white',borderRadius:16,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',flex:1,minWidth:180}}>
            <span>🔍</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." style={{border:'none',outline:'none',fontFamily:"'Outfit',sans-serif",fontSize:13,background:'transparent',width:'100%'}}/>
          </div>
          <select value={mes} onChange={e=>setMes(e.target.value)} style={{border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 14px',fontFamily:"'Outfit',sans-serif",fontSize:13,outline:'none',background:'white'}}>
            <option value="">Todos los meses</option>
            {months.map(m=><option key={m} value={m}>{MESES[parseInt(m.split('-')[1])-1]} {m.split('-')[0]}</option>)}
          </select>
        </div>
        {!filtered.length ? <div style={{textAlign:'center',padding:32,fontSize:14,color:'#9a9090'}}>No hay registros</div>
          : isMob ? (
            // Mobile: cards en lugar de tabla
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {filtered.map((v,i) => (
                <div key={v.id||i} style={{background:'#faf8f5',borderRadius:10,padding:'12px 14px',borderLeft:'3px solid #5fbf9b'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                    <div>
                      <span style={{fontSize:14,fontWeight:600}}>{v.dog||'–'}</span>
                      <span style={{fontSize:12,color:'#9a9090',marginLeft:8}}>{v.owner||'–'}</span>
                    </div>
                    <strong style={{fontSize:13,color:'#3a9b7b'}}>{fmtPeso(v.precio)}</strong>
                  </div>
                  <div style={{fontSize:12,color:'#9a9090'}}>{v.servicio} · {fmtFecha(v.fecha)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>{['Mascota','Dueño','Servicio','Fecha','Precio'].map(h=>(
                    <th key={h} style={{textAlign:'left',fontSize:11,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5,padding:'8px 14px',borderBottom:'2px solid #ede8e8',fontWeight:500}}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filtered.map((v,i)=>(
                    <tr key={v.id||i} style={{transition:'background .15s'}}>
                      <td style={{padding:'10px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><strong>{v.dog||'–'}</strong></td>
                      <td style={{padding:'10px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}>{v.owner||'–'}</td>
                      <td style={{padding:'10px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}>{v.servicio}</td>
                      <td style={{padding:'10px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}>{fmtFecha(v.fecha)}</td>
                      <td style={{padding:'10px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><strong style={{color:'#3a9b7b'}}>{fmtPeso(v.precio)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  NOTAS
// ══════════════════════════════════════════════
function NotasPage({ notas, onToggleCompra, onDeleteNota, onEditNota, onAgregar }) {
  const { isMob } = useResp();
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
      <div style={{marginBottom:20,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMob?24:30,fontWeight:600}}>Notas & Stock 📝</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Compras pendientes y control de egresos</p>
        </div>
        <Btn onClick={()=>onAgregar(tab==='compras'?'compra':'egreso')} size={isMob?'sm':''}>+ Agregar {tab==='compras'?'item':'egreso'}</Btn>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:18}}>
        <Btn variant={tab==='compras'?'primary':'ghost'} size="sm" onClick={()=>setTab('compras')}>🛒 A comprar</Btn>
        <Btn variant={tab==='egresos'?'primary':'ghost'} size="sm" onClick={()=>setTab('egresos')}>💸 Egresos</Btn>
      </div>

      {tab==='compras' ? (
        <div style={{background:'white',borderRadius:16,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{marginBottom:14,display:'flex',gap:10,alignItems:'center'}}>
            <div style={{flex:1,display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
              <span>🔍</span><input value={qC} onChange={e=>setQC(e.target.value)} placeholder="Buscar item..." style={{border:'none',outline:'none',fontFamily:"'Outfit',sans-serif",fontSize:13,width:'100%',background:'transparent'}}/>
            </div>
            <span style={{fontSize:13,color:'#9a9090',whiteSpace:'nowrap'}}>{compras.length} item{compras.length!==1?'s':''}</span>
          </div>
          {!compras.length ? <div style={{textAlign:'center',padding:32,fontSize:14,color:'#9a9090'}}>No hay items pendientes 🎉</div>
            : <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {compras.map(n=>(
                <div key={n.id} style={{background:'white',border:'1.5px solid #ede8e8',borderRadius:10,padding:'13px 15px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,boxShadow:'0 2px 8px rgba(0,0,0,.06)',opacity:n.completada?.7:1}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:500,marginBottom:3,textDecoration:n.completada?'line-through':''}}>{n.item}</div>
                    <div style={{fontSize:12,color:'#9a9090'}}>Cant: {n.cantidad}{n.precio?` · $${n.precio}`:''}{n.notas?` · ${n.notas}`:''}</div>
                  </div>
                  <div style={{display:'flex',gap:5,flexShrink:0}}>
                    <Btn size="sm" onClick={()=>onToggleCompra(n.id)}>{n.completada?'✓':'Marcar'}</Btn>
                    <Btn size="sm" variant="ghost" onClick={()=>onEditNota(n)}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>onDeleteNota(n.id)}>🗑️</Btn>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      ) : (
        <div style={{background:'white',borderRadius:16,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
          <div style={{marginBottom:14,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',flex:1,minWidth:160}}>
              <span>🔍</span><input value={qE} onChange={e=>setQE(e.target.value)} placeholder="Buscar egreso..." style={{border:'none',outline:'none',fontFamily:"'Outfit',sans-serif",fontSize:13,background:'transparent',width:'100%'}}/>
            </div>
            <select value={mes} onChange={e=>setMes(e.target.value)} style={{border:'1.5px solid #ede8e8',borderRadius:50,padding:'9px 14px',fontFamily:"'Outfit',sans-serif",fontSize:13,outline:'none',background:'white'}}>
              <option value="">Todos los meses</option>
              {egresoMonths.map(m=><option key={m} value={m}>{MESES[parseInt(m.split('-')[1])-1]} {m.split('-')[0]}</option>)}
            </select>
            <span style={{fontSize:13,color:'#3a9b7b',fontWeight:600,whiteSpace:'nowrap'}}>Total: {fmtPeso(totalEgresos)}</span>
          </div>
          {!egresos.length ? <div style={{textAlign:'center',padding:32,fontSize:14,color:'#9a9090'}}>No hay egresos registrados</div>
            : isMob ? (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {egresos.map(n=>(
                  <div key={n.id} style={{background:'#faf8f5',borderRadius:10,padding:'12px 14px',borderLeft:'3px solid #e8809a'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                      <strong style={{fontSize:13}}>{n.concepto}</strong>
                      <strong style={{fontSize:13,color:'#e8809a'}}>{fmtPeso(n.monto)}</strong>
                    </div>
                    <div style={{fontSize:12,color:'#9a9090',marginBottom:6}}>{n.categoria} · {fmtFecha(n.fecha)}</div>
                    <div style={{display:'flex',gap:5}}>
                      <Btn size="xs" variant="ghost" onClick={()=>onEditNota(n)}>✏️ Editar</Btn>
                      <Btn size="xs" variant="danger" onClick={()=>onDeleteNota(n.id)}>🗑️</Btn>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr>{['Concepto','Categoría','Monto','Fecha',''].map(h=><th key={h} style={{textAlign:'left',fontSize:11,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5,padding:'8px 14px',borderBottom:'2px solid #ede8e8',fontWeight:500}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {egresos.map(n=>(
                      <tr key={n.id}>
                        <td style={{padding:'10px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><strong>{n.concepto}</strong></td>
                        <td style={{padding:'10px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><Badge variant="blue">{n.categoria}</Badge></td>
                        <td style={{padding:'10px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}><strong style={{color:'#e8809a'}}>{fmtPeso(n.monto)}</strong></td>
                        <td style={{padding:'10px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}>{fmtFecha(n.fecha)}</td>
                        <td style={{padding:'10px 14px',borderBottom:'1px solid #ede8e8',fontSize:13}}>
                          <div style={{display:'flex',gap:5}}>
                            <Btn size="xs" variant="ghost" onClick={()=>onEditNota(n)}>✏️</Btn>
                            <Btn size="xs" variant="danger" onClick={()=>onDeleteNota(n.id)}>🗑️</Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════
//  MODAL NOTA (crear y editar)
// ══════════════════════════════════════════════
function ModalNota({ open, onClose, onSave, defaultTipo='compra', initial=null }) {
  const { isMob } = useResp();
  const isEdit = !!initial;
  const [tipo, setTipo] = useState(defaultTipo);
  const [form, setForm] = useState({item:'',cantidad:1,precio:'',notas:'',concepto:'',categoria:'',monto:'',fecha:todayStr()});
  useEffect(() => {
    if (open) {
      setTipo(initial?.tipo || defaultTipo);
      setForm(initial ? {
        item: initial.item||'',
        cantidad: initial.cantidad||1,
        precio: initial.precio||'',
        notas: initial.notas||'',
        concepto: initial.concepto||'',
        categoria: initial.categoria||'',
        monto: initial.monto||'',
        fecha: initial.fecha||todayStr(),
      } : {item:'',cantidad:1,precio:'',notas:'',concepto:'',categoria:'',monto:'',fecha:todayStr()});
    }
  }, [open, initial, defaultTipo]);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <Modal open={open} onClose={onClose} width={440}>
      <ModalHead title={isEdit ? `✏️ Editar ${tipo==='compra'?'Item':'Egreso'}` : 'Nueva Nota'} onClose={onClose} />
      <div style={{padding:'18px 22px'}}>
        {!isEdit && (
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            <Btn variant={tipo==='compra'?'primary':'ghost'} size="sm" onClick={()=>setTipo('compra')} style={{flex:1,justifyContent:'center'}}>🛒 A comprar</Btn>
            <Btn variant={tipo==='egreso'?'primary':'ghost'} size="sm" onClick={()=>setTipo('egreso')} style={{flex:1,justifyContent:'center'}}>💸 Egreso</Btn>
          </div>
        )}
        {tipo==='compra' ? (
          <>
            <FormGroup label="Item *"><input value={form.item} onChange={e=>set('item',e.target.value)} placeholder="Ej: Shampoo canino" style={{...inputStyle,marginBottom:10}} /></FormGroup>
            <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:10,marginBottom:10}}>
              <FormGroup label="Cantidad"><input type="number" value={form.cantidad} onChange={e=>set('cantidad',e.target.value)} min="1" style={inputStyle}/></FormGroup>
              <FormGroup label="Precio ref."><input type="number" value={form.precio} onChange={e=>set('precio',e.target.value)} placeholder="0" style={inputStyle}/></FormGroup>
            </div>
            <FormGroup label="Notas"><input value={form.notas} onChange={e=>set('notas',e.target.value)} placeholder="Marca, dónde comprarlo..." style={{...inputStyle,marginBottom:14}}/></FormGroup>
          </>
        ) : (
          <>
            <FormGroup label="Concepto *"><input value={form.concepto} onChange={e=>set('concepto',e.target.value)} placeholder="Ej: Electricidad" style={{...inputStyle,marginBottom:10}} /></FormGroup>
            <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:10,marginBottom:10}}>
              <FormGroup label="Categoría"><input value={form.categoria} onChange={e=>set('categoria',e.target.value)} placeholder="Servicios" style={inputStyle}/></FormGroup>
              <FormGroup label="Monto *"><input type="number" value={form.monto} onChange={e=>set('monto',e.target.value)} placeholder="0" style={inputStyle}/></FormGroup>
            </div>
            <FormGroup label="Fecha"><input type="date" value={form.fecha} onChange={e=>set('fecha',e.target.value)} style={{...inputStyle,marginBottom:14}}/></FormGroup>
          </>
        )}
        <Btn onClick={()=>onSave(tipo,form,isEdit?initial.id:null)} style={{width:'100%',justifyContent:'center'}}>
          💾 {isEdit ? 'Guardar cambios' : 'Guardar'}
        </Btn>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════
//  HORARIOS (ahora guarda en Supabase)
// ══════════════════════════════════════════════
function HorariosPage({ horariosData, onSaveHorarios }) {
  const { isMob } = useResp();
  const hoy = new Date();

  const proximoLunes = () => {
    const d = new Date(hoy);
    const dia = d.getDay();
    const diff = dia === 1 ? 7 : ((8 - dia) % 7 || 7);
    d.setDate(d.getDate() + diff);
    d.setHours(0,0,0,0);
    return d;
  };

  const [semanaInicio, setSemanaInicio] = useState(() => {
    if (horariosData?.semanaInicio) return new Date(horariosData.semanaInicio);
    return proximoLunes();
  });
  const [slots, setSlots] = useState(horariosData?.slots || {});
  const [diasActivos, setDiasActivos] = useState(horariosData?.diasActivos || []);
  const [tomados, setTomados] = useState(horariosData?.tomados || {});
  const [nuevoSlot, setNuevoSlot] = useState({});
  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const previewRef = useRef(null);

  // Auto-gen slots sin prompt()
  const [autoGenModal, setAutoGenModal] = useState({open:false, dia:null});
  const [autoGenForm, setAutoGenForm] = useState({desde:'09:00',hasta:'17:00',dur:'60'});

  const toKey = (d) => {
    const pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  };

  const getDiaDate = (dia) => {
    const offsetMap = {lunes:0,martes:1,miercoles:2,jueves:3,viernes:4,sabado:5};
    const d = new Date(semanaInicio);
    d.setDate(d.getDate() + (offsetMap[dia]||0));
    return d;
  };

  const isDiaActivo = (dia) => !diasActivos.includes('NO:' + toKey(getDiaDate(dia)));

  const toggleDia = (dia) => {
    const k = 'NO:' + toKey(getDiaDate(dia));
    setDiasActivos(ds => ds.includes(k) ? ds.filter(d => d !== k) : [...ds, k]);
  };

  const agregarSlot = (dia) => {
    const hora = nuevoSlot[dia]||'';
    if (!hora) return;
    const k = toKey(getDiaDate(dia));
    setSlots(s => ({...s, [k]: [...new Set([...getSlotsDelDia(s, k, dia), hora])].sort()}));
    setNuevoSlot(n => ({...n, [dia]:''}));
  };

  const quitarSlot = (dia, hora) => {
    const k = toKey(getDiaDate(dia));
    setSlots(s => ({...s, [k]: getSlotsDelDia(s, k, dia).filter(h=>h!==hora)}));
    setTomados(t => ({...t, [k]: (t[k]||[]).filter(h=>h!==hora)}));
  };

  const toggleTomado = (dia, hora) => {
    const k = toKey(getDiaDate(dia));
    setTomados(t => {
      const lista = t[k]||[];
      return {...t, [k]: lista.includes(hora) ? lista.filter(h=>h!==hora) : [...lista, hora]};
    });
  };

  const cambiarSemana = (dir) => setSemanaInicio(s => { const d = new Date(s); d.setDate(d.getDate() + dir*7); return d; });

  const semanaLabel = () => {
    const fin = new Date(semanaInicio);
    fin.setDate(fin.getDate() + 5);
    return `${semanaInicio.getDate()} de ${MESES[semanaInicio.getMonth()]} → ${fin.getDate()} de ${MESES[fin.getMonth()]}`;
  };

  const handleGuardar = async () => {
    setGuardando(true);
    await onSaveHorarios({ semanaInicio: semanaInicio.toISOString(), slots, diasActivos, tomados });
    setGuardando(false);
  };

  const handleAutoGen = () => {
    const { desde, hasta, dur } = autoGenForm;
    const durN = parseInt(dur)||60;
    let [hh,mm] = desde.split(':').map(Number);
    const [eh,em] = hasta.split(':').map(Number);
    const gen = [];
    while (hh*60+mm+durN <= eh*60+em) {
      gen.push(`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
      mm += durN;
      if (mm>=60) { hh += Math.floor(mm/60); mm = mm%60; }
    }
    const dia = autoGenModal.dia;
    const k = toKey(getDiaDate(dia));
    setSlots(s => {
      const cur = getSlotsDelDia(s, k, dia);
      const merged = [...new Set([...cur, ...gen])].sort();
      return {...s, [k]: merged};
    });
    setAutoGenModal({open:false,dia:null});
  };

  const descargarImagen = async () => {
    setGenerando(true);
    try {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      await new Promise((res,rej) => { script.onload=res; script.onerror=rej; document.head.appendChild(script); });
      const canvas = await window.html2canvas(previewRef.current, {scale:2,useCORS:true,backgroundColor:'#7ec8a0',logging:false,width:540,height:960});
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
    <section>
      <div style={{marginBottom:20,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMob?22:28,fontWeight:600}}>📸 Horarios para publicar</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Cargá los turnos disponibles y descargá la imagen</p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={()=>{
            const keysSemana = DIAS_SEMANA_HOD.map(d => toKey(getDiaDate(d)));
            setSlots(s => { const n={...s}; keysSemana.forEach(k=>delete n[k]); return n; });
            setTomados(t => { const n={...t}; keysSemana.forEach(k=>delete n[k]); return n; });
            setDiasActivos(ds => ds.filter(d => !keysSemana.some(k => d === 'NO:'+k)));
          }} style={{background:'none',border:'1.5px solid #ede8e8',borderRadius:50,padding:'7px 14px',fontSize:12,cursor:'pointer',color:'#9a9090',fontFamily:"'Outfit',sans-serif"}}>🗑 Limpiar</button>
          <Btn size="sm" onClick={handleGuardar} disabled={guardando} variant="ghost">
            {guardando ? '⏳...' : '💾 Guardar'}
          </Btn>
          <Btn size="sm" onClick={descargarImagen} disabled={generando} style={{background:'#25d366',border:'none'}}>
            {generando ? '⏳...' : '📥 Descargar'}
          </Btn>
        </div>
      </div>

      {/* Selector semana */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,background:'white',borderRadius:12,padding:'10px 16px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',width:'fit-content'}}>
        <button onClick={()=>cambiarSemana(-1)} style={{background:'#f0faf5',border:'1.5px solid #dff5ec',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
        <div style={{textAlign:'center',minWidth:180}}>
          <div style={{fontSize:10,color:'#9a9090',textTransform:'uppercase',letterSpacing:.5,marginBottom:1}}>Semana a publicar</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600}}>{semanaLabel()}</div>
        </div>
        <button onClick={()=>cambiarSemana(1)} style={{background:'#f0faf5',border:'1.5px solid #dff5ec',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
      </div>

      {/* Grid editor de slots */}
      <div style={{display:'grid',gridTemplateColumns:`repeat(auto-fill,minmax(${isMob?'160px':'190px'},1fr))`,gap:10,marginBottom:24}}>
        {DIAS_SEMANA_HOD.map(dia => {
          const diaDate = getDiaDate(dia);
          const fechaKey = toKey(diaDate);
          const horasDelDia = getSlotsDelDia(slots, fechaKey, dia);
          const tomadosDia = tomados[fechaKey] || [];
          const activo = isDiaActivo(dia);
          return (
            <div key={dia} style={{background:'white',borderRadius:12,padding:'12px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',opacity:activo?1:0.45,transition:'opacity .2s'}}>
              <div style={{background:activo?'linear-gradient(135deg,#dff5ec,#c8eed9)':'#f0f0f0',borderRadius:8,padding:'6px 10px',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontWeight:700,fontSize:12,color:activo?'#1a1a1a':'#9a9090'}}>{DIAS_HOD_LABELS[dia].toUpperCase()} {diaDate.getDate()}</span>
                <button onClick={()=>toggleDia(dia)} style={{background:activo?'rgba(255,255,255,0.8)':'#e8809a',border:'none',borderRadius:20,padding:'2px 7px',fontSize:10,fontWeight:600,cursor:'pointer',color:activo?'#4caf8e':'white'}}>
                  {activo ? `${horasDelDia.length}✓` : '✕'}
                </button>
              </div>
              {activo ? (
                <>
                  <div style={{minHeight:40,marginBottom:6}}>
                    {horasDelDia.length === 0
                      ? <p style={{fontSize:11,color:'#c0b8b8',textAlign:'center',padding:'4px 0'}}>Sin horarios</p>
                      : horasDelDia.map(h => {
                          const esTomado = tomadosDia.includes(h);
                          return (
                            <div key={h} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'3px 6px',marginBottom:2,background:esTomado?'#fff0f3':'#f8fffe',borderRadius:6,border:`1px solid ${esTomado?'#f5c6d0':'#e8f8f0'}`}}>
                              <span onClick={()=>toggleTomado(dia,h)} title={esTomado?'Marcar disponible':'Marcar tomado'} style={{fontSize:11,fontWeight:600,cursor:'pointer',textDecoration:esTomado?'line-through':'none',color:esTomado?'#b0a0a8':'inherit',userSelect:'none',flex:1}}>
                                🕐 {h} hs {esTomado && <span style={{fontSize:10,color:'#e8809a'}}>tomado</span>}
                              </span>
                              <button onClick={()=>quitarSlot(dia,h)} style={{background:'none',border:'none',color:'#e8809a',cursor:'pointer',fontSize:12,lineHeight:1,padding:0}}>✕</button>
                            </div>
                          );
                        })
                    }
                  </div>
                  <div style={{display:'flex',gap:4}}>
                    <input type="time" value={nuevoSlot[dia]||''} onChange={e=>setNuevoSlot(n=>({...n,[dia]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&agregarSlot(dia)}
                      style={{flex:1,border:'1.5px solid #ede8e8',borderRadius:6,padding:'4px 7px',fontSize:11,fontFamily:"'Outfit',sans-serif",outline:'none'}}
                    />
                    <button onClick={()=>agregarSlot(dia)} style={{background:'#4caf8e',border:'none',borderRadius:6,color:'white',width:26,cursor:'pointer',fontWeight:700,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                    <button onClick={()=>setAutoGenModal({open:true,dia})} title="Auto-generar horarios" style={{background:'#fff3e0',border:'1px solid #ffd599',borderRadius:6,color:'#e6860a',width:26,cursor:'pointer',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>⚡</button>
                  </div>
                </>
              ) : (
                <p style={{fontSize:11,color:'#c0b8b8',textAlign:'center',padding:'6px 0'}}>No trabajo</p>
              )}
            </div>
          );
        })}
      </div>

      <p style={{fontSize:11,color:'#9a9090',marginBottom:12}}>💾 Guardá los cambios con el botón "Guardar" para sincronizar entre dispositivos.</p>

      {/* Preview descargable */}
      <div style={{marginBottom:8,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600}}>Vista previa</div>
        <span style={{fontSize:11,color:'#9a9090'}}>1080×1920px · Stories</span>
      </div>
      <div style={{overflowX:'auto'}}>
        <div ref={previewRef} style={{
          width:540,height:960,background:'#7ec8a0',borderRadius:16,padding:'28px 20px 16px',
          position:'relative',overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,.15)',
          fontFamily:"'Trebuchet MS','Segoe UI',sans-serif",flexShrink:0,display:'flex',flexDirection:'column',
        }}>
          <div style={{position:'absolute',top:10,left:8,opacity:.18,pointerEvents:'none',lineHeight:1}}>
            <div style={{fontSize:26,transform:'rotate(-15deg)'}}>🐾</div>
            <div style={{fontSize:18,marginTop:2,marginLeft:12,transform:'rotate(-5deg)'}}>🐾</div>
          </div>
          <div style={{position:'absolute',top:10,right:8,opacity:.18,pointerEvents:'none',lineHeight:1,textAlign:'right'}}>
            <div style={{fontSize:18,transform:'rotate(5deg)'}}>🐾</div>
            <div style={{fontSize:26,marginTop:2,marginRight:4,transform:'rotate(15deg)'}}>🐾</div>
          </div>
          <div style={{textAlign:'center',marginBottom:16,flexShrink:0}}>
            <span style={{fontSize:50,fontWeight:900,letterSpacing:14,color:'#1a1a1a',textTransform:'uppercase',fontFamily:"'Trebuchet MS',Impact,sans-serif",display:'inline-block'}}>HORARIOS</span>
          </div>
          {(() => {
            const activos = DIAS_SEMANA_HOD.filter(d => isDiaActivo(d));
            const total = activos.length;
            if (total === 0) return <p style={{textAlign:'center',color:'white',fontSize:16}}>Sin días activos</p>;
            const IMG_H=140, topArea=28+50+16, botPad=16, cardGap=8;
            const cardH = Math.max(60, Math.floor((960-topArea-botPad-IMG_H-cardGap*(total-1))/total));
            return activos.map((dia, idx) => {
              const diaDate = getDiaDate(dia);
              const horasDia = getSlotsDelDia(slots, toKey(diaDate), dia);
              const tomadosDia = tomados[toKey(diaDate)] || [];
              const slotCols = horasDia.length<=3?1:horasDia.length<=6?2:3;
              const HEADER_H=34, rows=Math.ceil(horasDia.length/slotCols);
              const fontSize=Math.min(18,Math.max(12,Math.floor((cardH-HEADER_H)/rows*0.55)));
              return (
                <div key={dia} style={{background:'rgba(255,255,255,0.95)',borderRadius:14,overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 2px 8px rgba(0,0,0,.10)',height:cardH,flexShrink:0,marginBottom:idx<total-1?cardGap:0}}>
                  <div style={{background:'#5aba8f',height:HEADER_H,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontWeight:900,fontSize:15,color:'white',letterSpacing:2,textTransform:'uppercase',fontFamily:"'Trebuchet MS',sans-serif"}}>{DIAS_HOD_LABELS[dia].toUpperCase()} {diaDate.getDate()}</span>
                  </div>
                  <div style={{flex:1,padding:'4px 16px',display:'grid',gridTemplateColumns:`repeat(${slotCols},1fr)`,gridTemplateRows:`repeat(${rows},1fr)`,gap:'0px 8px',overflow:'hidden'}}>
                    {horasDia.map(h => {
                      const esTomado = tomadosDia.includes(h);
                      return (
                        <div key={h} style={{fontSize,fontWeight:700,color:esTomado?'#b8b8b8':'#1a1a1a',textDecoration:esTomado?'line-through':'none',fontFamily:"'Trebuchet MS',sans-serif",display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}>
                          <span style={{color:'#5aba8f',fontWeight:900,fontSize:fontSize+2}}>•</span>{h} hs
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
          <div style={{display:'flex',justifyContent:'center',alignItems:'flex-end',flexShrink:0,marginTop:8,height:140}}>
            <img src={PELUQUERA_IMG} style={{height:140,objectFit:'contain',objectPosition:'bottom'}} alt="" crossOrigin="anonymous"/>
          </div>
        </div>
      </div>

      {/* Modal auto-gen sin prompt() */}
      {autoGenModal.open && (
        <div style={{position:'fixed',inset:0,zIndex:9000,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'white',borderRadius:16,padding:24,maxWidth:340,width:'100%',boxShadow:'0 12px 40px rgba(0,0,0,.15)'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,marginBottom:16}}>⚡ Generar horarios — {DIAS_HOD_LABELS[autoGenModal.dia]}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
              <FormGroup label="Desde"><input type="time" value={autoGenForm.desde} onChange={e=>setAutoGenForm(f=>({...f,desde:e.target.value}))} style={inputStyle}/></FormGroup>
              <FormGroup label="Hasta"><input type="time" value={autoGenForm.hasta} onChange={e=>setAutoGenForm(f=>({...f,hasta:e.target.value}))} style={inputStyle}/></FormGroup>
              <FormGroup label="Duración">
                <select value={autoGenForm.dur} onChange={e=>setAutoGenForm(f=>({...f,dur:e.target.value}))} style={inputStyle}>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hora</option>
                  <option value="90">1:30 hs</option>
                </select>
              </FormGroup>
            </div>
            <div style={{display:'flex',gap:8}}>
              <Btn onClick={handleAutoGen} style={{flex:1,justifyContent:'center'}}>Generar</Btn>
              <Btn variant="ghost" onClick={()=>setAutoGenModal({open:false,dia:null})}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════
//  CONFIG
// ══════════════════════════════════════════════
function ConfigPage({ config, onSave }) {
  const { isMob } = useResp();
  const [nombre, setNombre] = useState(config.nombre);
  const [msg, setMsg] = useState(config.msg||'');
  const [anticip, setAnticip] = useState(config.anticip||30);
  const [slots, setSlots] = useState(config.slots||{});
  const [horarios, setHorarios] = useState(config.horarios||{});
  const [openDays, setOpenDays] = useState({});
  const [newSlot, setNewSlot] = useState({});

  useEffect(() => {
    setNombre(config.nombre); setMsg(config.msg||''); setAnticip(config.anticip||30);
    setSlots({...config.slots}); setHorarios({...config.horarios});
  }, [config]);

  const toggleDayOpen = (key,checked) => setHorarios(h=>({...h,[key]:{...(h[key]||{open:true,desde:'09:00',hasta:'18:00'}),open:checked}}));
  const addSlot = key => {
    const hora=newSlot[key+'_hora']||'09:00', dur=parseInt(newSlot[key+'_dur']||60);
    const cur=slots[key]||[];
    if (cur.some(s=>s.hora===hora)) return;
    setSlots(s=>({...s,[key]:[...cur,{hora,duracion:dur}]}));
  };
  const removeSlot = (key,hora) => setSlots(s=>({...s,[key]:(s[key]||[]).filter(sl=>sl.hora!==hora)}));

  return (
    <section>
      <div style={{marginBottom:20,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMob?24:30,fontWeight:600}}>Configuración de Agenda</h2>
          <p style={{color:'#9a9090',fontSize:13,marginTop:3}}>Turnos disponibles por día para el portal de reservas</p>
        </div>
        <Btn onClick={()=>onSave({nombre,msg,anticip:parseInt(anticip),slots,horarios})} size={isMob?'sm':''}>💾 Guardar todo</Btn>
      </div>
      <div style={{background:'white',borderRadius:16,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',marginBottom:16}}>
        <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr 1fr',gap:12}}>
          <FormGroup label="Nombre de tu peluquería"><input value={nombre} onChange={e=>setNombre(e.target.value)} style={inputStyle}/></FormGroup>
          <FormGroup label="Días de anticipación máx.">
            <select value={anticip} onChange={e=>setAnticip(e.target.value)} style={inputStyle}>
              <option value="7">1 semana</option><option value="14">2 semanas</option>
              <option value="30">1 mes</option><option value="60">2 meses</option>
            </select>
          </FormGroup>
          <FormGroup label="Mensaje de bienvenida"><input value={msg} onChange={e=>setMsg(e.target.value)} style={inputStyle}/></FormGroup>
        </div>
      </div>
      {DIAS_CONFIG.map(d=>{
        const daySlots=(slots[d.key]||[]).slice().sort((a,b)=>a.hora.localeCompare(b.hora));
        const isOpen=horarios[d.key]?.open!==false;
        const isExp=openDays[d.key]!==undefined?openDays[d.key]:isOpen;
        return (
          <div key={d.key} style={{background:'white',borderRadius:16,boxShadow:'0 2px 8px rgba(0,0,0,.06)',marginBottom:12,overflow:'hidden'}}>
            <div onClick={()=>setOpenDays(o=>({...o,[d.key]:!isExp}))} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 18px',cursor:'pointer',borderBottom:isExp?'1.5px solid #ede8e8':'1.5px solid transparent'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span onClick={e=>{e.stopPropagation();toggleDayOpen(d.key,!isOpen);}} style={{position:'relative',display:'inline-block',width:38,height:20,cursor:'pointer'}}>
                  <span style={{position:'absolute',inset:0,background:isOpen?'#5fbf9b':'#d0cece',borderRadius:20,transition:'.3s',display:'block'}}/>
                  <span style={{position:'absolute',height:14,width:14,left:isOpen?21:3,top:3,background:'white',borderRadius:'50%',transition:'.3s',boxShadow:'0 1px 4px rgba(0,0,0,.2)',display:'block'}}/>
                </span>
                <span style={{fontSize:14,fontWeight:600}}>{d.emoji} {d.label}</span>
                <span style={{fontSize:11,color:'#9a9090'}}>{daySlots.length} turno{daySlots.length!==1?'s':''}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:11,color:'#9a9090'}}>{isOpen?'Abierto':'Cerrado'}</span>
                <span style={{color:'#9a9090',fontSize:14}}>{isExp?'▲':'▼'}</span>
              </div>
            </div>
            {isExp && <div style={{padding:'14px 18px'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:8,marginBottom:10}}>
                {!daySlots.length ? <div style={{fontSize:13,color:'#9a9090'}}>Sin turnos cargados</div>
                  : daySlots.map(s=>(
                    <div key={s.hora} style={{background:'#dff5ec',borderRadius:8,padding:'7px 10px',display:'flex',alignItems:'center',justifyContent:'space-between',border:'1.5px solid #a8dfc8'}}>
                      <div>
                        <span style={{fontSize:12,fontWeight:500,color:'#3a9b7b'}}>🕐 {s.hora}</span>
                        <span style={{fontSize:10,color:'#9a9090',display:'block'}}>{durLabel(s.duracion)}</span>
                      </div>
                      <button onClick={()=>removeSlot(d.key,s.hora)} style={{background:'none',border:'none',cursor:'pointer',color:'#9a9090',fontSize:13}}>✕</button>
                    </div>
                  ))
                }
              </div>
              <div style={{display:'flex',alignItems:'flex-end',gap:8,background:'#faf8f5',borderRadius:8,padding:'10px 12px',flexWrap:'wrap'}}>
                <FormGroup label="Hora">
                  <input type="time" value={newSlot[d.key+'_hora']||'09:00'} onChange={e=>setNewSlot(s=>({...s,[d.key+'_hora']:e.target.value}))} style={{border:'1.5px solid #ede8e8',borderRadius:8,padding:'6px 9px',fontFamily:"'Outfit',sans-serif",fontSize:12,outline:'none',background:'white'}}/>
                </FormGroup>
                <FormGroup label="Duración">
                  <select value={newSlot[d.key+'_dur']||60} onChange={e=>setNewSlot(s=>({...s,[d.key+'_dur']:e.target.value}))} style={{border:'1.5px solid #ede8e8',borderRadius:8,padding:'6px 9px',fontFamily:"'Outfit',sans-serif",fontSize:12,outline:'none',background:'white'}}>
                    <option value="30">30 min</option><option value="45">45 min</option>
                    <option value="60">1 hora</option><option value="90">1:30 hs</option><option value="120">2 horas</option>
                  </select>
                </FormGroup>
                <Btn size="sm" onClick={()=>addSlot(d.key)}>+ Agregar</Btn>
              </div>
            </div>}
          </div>
        );
      })}
    </section>
  );
}

// ══════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════
function AppInner() {
  const { isMob } = useResp();
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [turnos, setTurnos]   = useState([]);
  const [notas, setNotas]     = useState([]);
  const [config, setConfig]   = useState(DEFAULT_CONFIG);
  const [page, setPage]       = useState('dashboard');
  const [toasts, setToasts]   = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  // Modals
  const [modalCliente,     setModalCliente]     = useState({open:false,id:null});
  const [modalNuevoCliente,setModalNuevoCliente] = useState({open:false,initial:null});
  const [modalTurno,       setModalTurno]       = useState({open:false,fecha:null,turnoEdit:null});
  const [modalNota,        setModalNota]        = useState({open:false,tipo:'compra',initial:null});
  // Confirm dialog (reemplaza window.confirm)
  const [confirm, setConfirm] = useState({open:false,msg:'',onConfirm:null});

  const toast = useCallback((msg, error=false) => {
    const id = Date.now();
    setToasts(ts => [...ts,{id,msg,error}]);
    setTimeout(()=>setToasts(ts=>ts.filter(t=>t.id!==id)), 3500);
  }, []);

  const askConfirm = (msg) => new Promise(resolve => {
    setConfirm({ open:true, msg, onConfirm: () => { setConfirm(c=>({...c,open:false})); resolve(true); }, onCancel: () => { setConfirm(c=>({...c,open:false})); resolve(false); } });
  });

  // ── LOAD ALL ──────────────────────────
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

  // ── CLIENTE ACTIONS ──────────────────
  const handleOpenClient = id => setModalCliente({open:true,id});

  const handleSaveVisit = async (clienteId, svc, precio, fecha) => {
    if (!svc) { toast('Ingresá el servicio', true); return; }
    try {
      await db.insertVisita(clienteId, svc, precio, fecha);
      await loadAll();
      toast('Visita registrada ✂️');
    } catch(e) { toast(e.message, true); }
  };

  const handleEditVisit = async (visitaId, svc, precio, fecha) => {
    try {
      await db.updateVisita(visitaId, {servicio:svc, precio, fecha});
      await loadAll();
      toast('Visita actualizada ✅');
    } catch(e) { toast(e.message, true); }
  };

  const handleDeleteVisit = async (visitaId) => {
    const ok = await askConfirm('¿Eliminar esta visita del historial?');
    if (!ok) return;
    try {
      await db.deleteVisita(visitaId);
      await loadAll();
      toast('Visita eliminada');
    } catch(e) { toast(e.message, true); }
  };

  const handleDeleteClient = async id => {
    const ok = await askConfirm('¿Eliminar este cliente y todas sus visitas?');
    if (!ok) return;
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
      let fotoUrl = form.foto;
      if (fotoFile) {
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
    const ok = await askConfirm('¿Restar una inasistencia?');
    if (!ok) return;
    const c = clientes.find(x=>x.id===id);
    if (!c || (c.inasistencias||0) <= 0) return;
    try {
      await db.updateCliente(id, {inasistencias: c.inasistencias - 1});
      await loadAll();
      toast('Inasistencia eliminada');
    } catch(e) { toast(e.message, true); }
  };

  // ── TURNO ACTIONS ──────────────────
  const handleCompletar = async (id) => {
    const t = turnos.find(x=>x.id===id); if (!t) return;
    if (t.estado === 'completed') return; // ya estaba completado
    try {
      await db.updateTurno(id, {estado:'completed'});
      if (t.clientId) await db.insertVisita(t.clientId, t.servicio, t.precio||0, t.fecha);
      await loadAll();
      toast('Turno completado y guardado en el historial 🎉');
    } catch(e) { toast(e.message, true); }
  };

  const handleNoVino = async (id) => {
    const ok = await askConfirm('¿Marcar este turno como inasistencia?');
    if (!ok) return;
    const t = turnos.find(x=>x.id===id); if (!t) return;
    const c = clientes.find(x=>x.id===t.clientId);
    try {
      await db.deleteTurno(id);
      if (c) await db.updateCliente(c.id, {inasistencias:(c.inasistencias||0)+1});
      await loadAll();
      toast('Inasistencia registrada 📍');
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
    const ok = await askConfirm('¿Eliminar este turno?');
    if (!ok) return;
    try {
      await db.deleteTurno(id);
      await loadAll();
      toast('Turno eliminado');
    } catch(e) { toast(e.message, true); }
  };

  const handleSaveNewTurno = async (mode, form) => {
    let clientId = null, dogName = '';
    try {
      if (mode === 'new') {
        if (!form.dog || !form.owner) { toast('Completá nombre del perro y dueño', true); return; }
        // Verificar si ya existe este cliente (evitar duplicados)
        const existe = clientes.find(c =>
          c.dog.toLowerCase().trim() === form.dog.toLowerCase().trim() &&
          c.owner.toLowerCase().trim() === form.owner.toLowerCase().trim()
        );
        if (existe) {
          clientId = existe.id; dogName = existe.dog;
          toast(`Cliente existente encontrado: ${existe.dog} 🐶`);
        } else {
          const newC = await db.insertCliente({dog:form.dog,owner:form.owner,raza:form.raza,tel:form.tel,size:'',pelaje:'',notes:'',foto:null});
          clientId = newC.id; dogName = form.dog;
        }
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

  // ── NOTAS ACTIONS ──────────────────
  const handleSaveNota = async (tipo, form, editId=null) => {
    if (tipo==='compra' && !form.item) { toast('Completá el item a comprar', true); return; }
    if (tipo==='egreso' && (!form.concepto || !form.monto)) { toast('Completá concepto y monto', true); return; }
    try {
      if (editId) {
        const fields = tipo==='compra'
          ? {item:form.item, cantidad:parseInt(form.cantidad)||1, precio:parseFloat(form.precio)||0, notas_texto:form.notas||''}
          : {concepto:form.concepto, categoria:form.categoria||'', monto:parseFloat(form.monto)||0, fecha:form.fecha||todayStr()};
        await db.updateNota(editId, fields);
        toast('Nota actualizada ✅');
      } else {
        await db.insertNota({tipo, ...form, monto:parseFloat(form.monto)||0, precio:parseFloat(form.precio)||0, cantidad:parseInt(form.cantidad)||1});
        toast(tipo==='compra'?'Item agregado 🛒':'Egreso registrado 💸');
      }
      setModalNota({open:false,tipo:'compra',initial:null});
      await loadAll();
    } catch(e) { toast(e.message, true); }
  };

  const handleToggleCompra = async id => {
    const n = notas.find(x=>x.id===id); if (!n) return;
    try {
      await db.updateNota(id, {completada:!n.completada});
      // Optimistic update
      setNotas(ns => ns.map(x => x.id===id ? {...x,completada:!x.completada} : x));
    } catch(e) { toast(e.message, true); await loadAll(); }
  };

  const handleDeleteNota = async id => {
    const ok = await askConfirm('¿Eliminar esta nota?');
    if (!ok) return;
    try {
      await db.deleteNota(id);
      await loadAll();
    } catch(e) { toast(e.message, true); }
  };

  // ── CONFIG ACTIONS ──────────────────
  const handleSaveConfig = async cfg => {
    try {
      await db.saveConfig(cfg);
      setConfig(cfg);
      toast('Configuración guardada ✅');
    } catch(e) { toast(e.message, true); }
  };

  const handleSaveHorarios = async (horariosSemanales) => {
    try {
      await db.saveConfig({...config, horariosSemanales});
      setConfig(c => ({...c, horariosSemanales}));
      toast('Horarios guardados en la nube ☁️');
    } catch(e) { toast(e.message, true); }
  };

  const pendingCount = turnos.filter(t=>t.estado==='pending').length;
  const activeCliente = clientes.find(c=>c.id===modalCliente.id);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        html,body,#root{height:100%;font-family:'Outfit',sans-serif;background:#faf8f5;color:#2e2828;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{opacity:1;transform:none}}
        @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#d0cece;border-radius:3px}
        button:active{transform:scale(.97)}
        input,select,textarea{-webkit-appearance:none;}
      `}</style>

      <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
        <Sidebar activePage={page} onNav={setPage} pendingCount={pendingCount} mobileOpen={menuOpen} onMobileClose={() => setMenuOpen(false)}/>

        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
          {/* Top bar mobile */}
          {isMob && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'white',borderBottom:'1px solid #ede8e8',boxShadow:'0 2px 8px rgba(0,0,0,.05)',flexShrink:0}}>
              <button onClick={() => setMenuOpen(true)} style={{background:'none',border:'none',cursor:'pointer',padding:6,borderRadius:8,display:'flex',flexDirection:'column',gap:4}}>
                <span style={{display:'block',width:20,height:2,background:'#4caf8e',borderRadius:2}}/>
                <span style={{display:'block',width:14,height:2,background:'#4caf8e',borderRadius:2}}/>
                <span style={{display:'block',width:20,height:2,background:'#4caf8e',borderRadius:2}}/>
              </button>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <span style={{fontSize:16}}>🐾</span>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600}}>Paupet</span>
              </div>
              <div style={{width:32}}/>
            </div>
          )}

          <main style={{flex:1,overflowY:'auto',padding:isMob?'16px 14px':'24px 28px',minWidth:0}}>
            {loading ? <Spinner /> : (
              <>
                {page==='dashboard'  && <Dashboard clientes={clientes} turnos={turnos} onNav={setPage} onCompletar={handleCompletar} onNoVino={handleNoVino} onEditTurno={handleEditTurno}/>}
                {page==='clientes'   && <ClientesPage clientes={clientes} onOpenClient={handleOpenClient} onNuevo={()=>setModalNuevoCliente({open:true,initial:null})}/>}
                {page==='calendario' && <CalendarioPage clientes={clientes} turnos={turnos} onAddTurno={fecha=>setModalTurno({open:true,fecha,turnoEdit:null})} onCompletar={handleCompletar} onNoVino={handleNoVino} onDelete={handleDeleteTurno} onConfirmar={handleConfirmar} onEditTurno={handleEditTurno}/>}
                {page==='historial'  && <HistorialPage clientes={clientes} turnos={turnos}/>}
                {page==='notas'      && <NotasPage notas={notas} onToggleCompra={handleToggleCompra} onDeleteNota={handleDeleteNota} onEditNota={n=>setModalNota({open:true,tipo:n.tipo,initial:n})} onAgregar={tipo=>setModalNota({open:true,tipo,initial:null})}/>}
                {page==='horarios'   && <HorariosPage horariosData={config.horariosSemanales} onSaveHorarios={handleSaveHorarios}/>}
                {page==='config'     && <ConfigPage config={config} onSave={handleSaveConfig}/>}
              </>
            )}
          </main>
        </div>
      </div>

      <ModalCliente
        open={modalCliente.open} cliente={activeCliente}
        onClose={()=>setModalCliente({open:false,id:null})}
        onSaveVisit={handleSaveVisit}
        onEditVisit={handleEditVisit}
        onDeleteVisit={handleDeleteVisit}
        onDelete={handleDeleteClient}
        onEdit={c=>{setModalCliente({open:false,id:null});setModalNuevoCliente({open:true,initial:c});}}
        onDecrementarInasistencia={handleDecrementarInasistencia}
      />
      <ModalClienteForm
        open={modalNuevoCliente.open} initial={modalNuevoCliente.initial}
        onClose={()=>setModalNuevoCliente({open:false,initial:null})}
        onSave={handleSaveNewClient}
      />
      <ModalNuevoTurno
        open={modalTurno.open}
        onClose={()=>setModalTurno({open:false,fecha:null,turnoEdit:null})}
        onSave={handleSaveNewTurno} onUpdate={handleUpdateTurno}
        clientes={clientes} defaultFecha={modalTurno.fecha} turnoEdit={modalTurno.turnoEdit}
      />
      <ModalNota
        open={modalNota.open} defaultTipo={modalNota.tipo} initial={modalNota.initial}
        onClose={()=>setModalNota({open:false,tipo:'compra',initial:null})}
        onSave={handleSaveNota}
      />
      <ConfirmDialog
        open={confirm.open} msg={confirm.msg}
        onConfirm={confirm.onConfirm}
        onCancel={()=>setConfirm(c=>({...c,open:false}))}
      />
      <ToastContainer toasts={toasts}/>
    </>
  );
}

export default function App() {
  return (
    <RespProvider>
      <AppInner />
    </RespProvider>
  );
}
