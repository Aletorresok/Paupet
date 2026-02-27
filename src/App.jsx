import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

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
// ══════════════════════════════════════════════
const db = {
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
  {page:'config',    icon:'⚙️', label:'Configuración'},
];

function Sidebar({ activePage, onNav, pendingCount }) {
  return (
    <nav style={{width:230,minWidth:230,background:'linear-gradient(180deg,#4caf8e 0%,#5fbf9b 40%,#c5879a 100%)',display:'flex',flexDirection:'column',padding:'24px 14px',position:'relative',zIndex:20,boxShadow:'4px 0 24px rgba(0,0,0,.08)',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-60,right:-60,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,.07)'}}/>
      <div style={{position:'absolute',bottom:-40,left:-40,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,.05)'}}/>
      <div style={{textAlign:'center',marginBottom:32,position:'relative',zIndex:1}}>
        <div style={{width:54,height:54,background:'white',borderRadius:'50%',margin:'0 auto 8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,boxShadow:'0 4px 16px rgba(0,0,0,.15)'}}>🐾</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'white',letterSpacing:.5}}>Paupet</h1>
        <span style={{fontSize:10,color:'rgba(255,255,255,.7)',fontWeight:300,letterSpacing:1,textTransform:'uppercase'}}>Peluquería Canina</span>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:3,position:'relative',zIndex:1}}>
        {NAV_ITEMS.map(item => (
          <div key={item.page} onClick={() => onNav(item.page)} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 13px',borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:activePage===item.page?500:400,background:activePage===item.page?'white':'transparent',color:activePage===item.page?'#2e2828':'rgba(255,255,255,.8)',boxShadow:activePage===item.page?'0 4px 20px rgba(0,0,0,.08)':'none',transition:'all .2s'}}>
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
  useEffect(() => { if (open) setForm(initial || {dog:'',raza:'',size:'',pelaje:'',owner:'',tel:'',notes:'',foto:null}); }, [open, initial]);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const handleFoto = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => set('foto', ev.target.result);
    r.readAsDataURL(f);
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
          <Btn onClick={() => onSave(form)} style={{flex:1,justifyContent:'center'}}>✓ {initial?'Guardar cambios':'Guardar cliente'}</Btn>
          {!initial && <Btn variant="ghost" onClick={() => setForm({dog:'',raza:'',size:'',pelaje:'',owner:'',tel:'',notes:'',foto:null})}>Limpiar</Btn>}
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════
//  CALENDARIO
// ══════════════════════════════════════════════
function CalendarioPage({ clientes, turnos, onAddTurno, onCompletar, onNoVino, onDelete, onConfirmar }) {
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
                  {t.estado!=='completed' && (
                    <div style={{display:'flex',gap:5,marginTop:7,flexWrap:'wrap'}}>
                      {t.estado==='pending' && <Btn size="xs" onClick={()=>onConfirmar(t.id)}>✓ Confirmar</Btn>}
                      <Btn size="xs" onClick={()=>onCompletar(t.id,selectedDay)}>✓ Completar</Btn>
                      <Btn size="xs" variant="pink" onClick={()=>onNoVino(t.id,selectedDay)}>✕ No vino</Btn>
                      <Btn size="xs" variant="ghost" onClick={()=>onDelete(t.id)}>🗑</Btn>
                    </div>
                  )}
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
//  MODAL NUEVO TURNO
// ══════════════════════════════════════════════
function ModalNuevoTurno({ open, onClose, onSave, clientes, defaultFecha }) {
  const [mode, setMode] = useState('exist');
  const [form, setForm] = useState({clientId:'',dog:'',owner:'',raza:'',tel:'',svc:'',fecha:defaultFecha||todayStr(),hora:'10:00',precio:'',estado:'confirmed'});
  useEffect(() => { if (open) { setForm(f=>({...f,fecha:defaultFecha||todayStr(),clientId:'',dog:'',owner:'',raza:'',tel:'',svc:'',hora:'10:00',precio:'',estado:'confirmed'})); setMode('exist'); } }, [open]);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <Modal open={open} onClose={onClose} width={480}>
      <ModalHead title="Agregar Turno" onClose={onClose} />
      <div style={{padding:'20px 26px'}}>
        <div style={{marginBottom:16,padding:14,background:'#dff5ec',borderRadius:10}}>
          <div style={{fontSize:12,fontWeight:600,color:'#3a9b7b',marginBottom:10,textTransform:'uppercase'}}>¿Cliente nuevo o existente?</div>
          <div style={{display:'flex',gap:10}}>
            <Btn size="sm" variant={mode==='exist'?'primary':'ghost'} onClick={()=>setMode('exist')} style={{flex:1,justifyContent:'center'}}>Existente</Btn>
            <Btn size="sm" variant={mode==='new'?'primary':'ghost'} onClick={()=>setMode('new')} style={{flex:1,justifyContent:'center'}}>Crear nuevo</Btn>
          </div>
        </div>
        {mode==='exist' ? (
          <FormGroup label="Seleccionar cliente">
            <select value={form.clientId} onChange={e=>set('clientId',e.target.value)} style={{...inputStyle,marginBottom:14}}>
              <option value="">— Seleccionar —</option>
              {clientes.map(c=><option key={c.id} value={c.id}>{c.dog} ({c.owner})</option>)}
            </select>
          </FormGroup>
        ) : (
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
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
          <FormGroup label="Servicio"><input value={form.svc} onChange={e=>set('svc',e.target.value)} placeholder="Baño y corte" style={inputStyle} /></FormGroup>
          <FormGroup label="Fecha"><input type="date" value={form.fecha} onChange={e=>set('fecha',e.target.value)} style={inputStyle} /></FormGroup>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
          <FormGroup label="Hora"><input type="time" value={form.hora} onChange={e=>set('hora',e.target.value)} style={inputStyle} /></FormGroup>
          <FormGroup label="Precio"><input type="number" value={form.precio} onChange={e=>set('precio',e.target.value)} placeholder="0" style={inputStyle} /></FormGroup>
        </div>
        <FormGroup label="Estado">
          <select value={form.estado} onChange={e=>set('estado',e.target.value)} style={{...inputStyle,marginBottom:16}}>
            <option value="confirmed">Confirmado</option><option value="pending">Pendiente</option>
          </select>
        </FormGroup>
        <Btn onClick={()=>onSave(mode,form)} style={{width:'100%',justifyContent:'center',marginTop:4}}>✓ Guardar turno</Btn>
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
  const [form, setForm] = useState({item:'',cantidad:1,precio:'',notas:'',concepto:'',categoria:'arriendo',monto:'',fecha:todayStr()});
  useEffect(() => { if(open){setTipo(defaultTipo);setForm({item:'',cantidad:1,precio:'',notas:'',concepto:'',categoria:'arriendo',monto:'',fecha:todayStr()});} },[open]);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
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
        <Btn onClick={()=>onSave(tipo,form)} style={{width:'100%',justifyContent:'center'}}>✓ Guardar</Btn>
      </div>
    </Modal>
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
  const [modalTurno,       setModalTurno]       = useState({open:false,fecha:null});
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

  const handleSaveNewClient = async form => {
    if (!form.dog || !form.owner) { toast('Completá nombre del perro y dueño', true); return; }
    const isEdit = !!modalNuevoCliente.initial;
    try {
      if (isEdit) {
        await db.updateCliente(modalNuevoCliente.initial.id, form);
      } else {
        await db.insertCliente(form);
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
        <Sidebar activePage={page} onNav={setPage} pendingCount={pendingCount} />

        <main style={{flex:1,overflowY:'auto',padding:'28px 32px',minWidth:0}}>
          {loading ? <Spinner /> : (
            <>
              {page==='dashboard'  && <Dashboard clientes={clientes} turnos={turnos} onNav={setPage} onCompletar={handleCompletar} onNoVino={handleNoVino}/>}
              {page==='clientes'   && <ClientesPage clientes={clientes} onOpenClient={handleOpenClient} onNuevo={()=>setModalNuevoCliente({open:true,initial:null})}/>}
              {page==='calendario' && <CalendarioPage clientes={clientes} turnos={turnos} onAddTurno={fecha=>setModalTurno({open:true,fecha})} onCompletar={handleCompletar} onNoVino={handleNoVino} onDelete={handleDeleteTurno} onConfirmar={handleConfirmar}/>}
              {page==='historial'  && <HistorialPage clientes={clientes} turnos={turnos}/>}
              {page==='notas'      && <NotasPage notas={notas} onToggleCompra={handleToggleCompra} onDeleteNota={handleDeleteNota} onAgregar={tipo=>setModalNota({open:true,tipo})}/>}
              {page==='config'     && <ConfigPage config={config} onSave={handleSaveConfig}/>}
            </>
          )}
        </main>
      </div>

      <ModalCliente open={modalCliente.open} cliente={activeCliente} onClose={()=>setModalCliente({open:false,id:null})} onSaveVisit={handleSaveVisit} onDelete={handleDeleteClient} onEdit={c=>{setModalCliente({open:false,id:null});setModalNuevoCliente({open:true,initial:c});}} onDecrementarInasistencia={handleDecrementarInasistencia}/>
      <ModalClienteForm open={modalNuevoCliente.open} initial={modalNuevoCliente.initial} onClose={()=>setModalNuevoCliente({open:false,initial:null})} onSave={handleSaveNewClient}/>
      <ModalNuevoTurno open={modalTurno.open} onClose={()=>setModalTurno({open:false,fecha:null})} onSave={handleSaveNewTurno} clientes={clientes} defaultFecha={modalTurno.fecha}/>
      <ModalNota open={modalNota.open} defaultTipo={modalNota.tipo} onClose={()=>setModalNota({open:false,tipo:'compra'})} onSave={handleSaveNota}/>
      <ToastContainer toasts={toasts}/>
    </>
  );
}
