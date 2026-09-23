export const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
export const CAL_DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
export const DIAS_CONFIG = [
  {key:'lunes',    label:'Lunes',    emoji:'🌿'},
  {key:'martes',   label:'Martes',   emoji:'🌸'},
  {key:'miercoles',label:'Miércoles',emoji:'🌿'},
  {key:'jueves',   label:'Jueves',   emoji:'🌸'},
  {key:'viernes',  label:'Viernes',  emoji:'🌿'},
  {key:'sabado',   label:'Sábado',   emoji:'🌸'},
  {key:'domingo',  label:'Domingo',  emoji:'☀️'},
];
export const DIAS_SEMANA_HOD = ['lunes','martes','miercoles','jueves','viernes','sabado'];
export const DIAS_HOD_LABELS = {lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',jueves:'Jueves',viernes:'Viernes',sabado:'Sábado'};
export const PELUQUERA_IMG = 'https://qelrwbavnrxdlxfckehz.supabase.co/storage/v1/object/public/Fotos/WhatsApp_Image_2026-03-06_at_19.29.42-removebg-preview.png';

// WhatsApp de Pau (el del perfil de Paupet): a este número llegan los pedidos de turno.
export const WHATSAPP_PAU = '5491168019061';
export const WHATSAPP_PAU_VISIBLE = '+54 9 11 6801-9061';
// Página pública para pedir turno (no pide usuario).
export const RUTA_TURNOS = '/turnos';

export const DEFAULT_CONFIG = {
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

// Menú. `grupo` separa las secciones del menú lateral; `movil` = aparece en la barra inferior del celular.
export const NAV_ITEMS = [
  {page:'dashboard', icon:'home',     label:'Hoy',           grupo:'dia', movil:true},
  {page:'calendario',icon:'calendar', label:'Agenda',        grupo:'dia', movil:true, badge:true},
  {page:'clientes',  icon:'users',    label:'Clientes',      grupo:'dia', movil:true},
  {page:'horarios',  icon:'camera',   label:'Horarios para Stories', grupo:'dia'},
  {page:'finanzas',  icon:'chart',    label:'Finanzas',      grupo:'negocio'},
  {page:'historial', icon:'history',  label:'Historial',     grupo:'negocio'},
  {page:'notas',     icon:'notes',    label:'Notas y gastos',grupo:'negocio'},
  {page:'config',    icon:'settings', label:'Configuración', grupo:'negocio'},
];


// Versión actual en producción. Mientras la nueva se prueba en paralelo, se muestra un aviso
// con un link para volver a ésta. Al publicar la nueva en este dominio, el aviso desaparece solo.
export const URL_VERSION_ANTERIOR = 'https://paupet.vercel.app';
