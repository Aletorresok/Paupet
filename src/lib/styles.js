// Tokens de diseño y estilos compartidos (ver "Guía de estilo" en la maqueta).
export const C = {
  fondo: '#F7F4EF',       // fondo de pantalla
  tinta: '#1F2A26',       // texto principal
  tintaSuave: '#5B6661',  // texto secundario (5,9:1)
  linea: '#E6E0D8',       // bordes y divisores
  lineaFuerte: '#CFC8BE', // borde de inputs
  menta: '#5FBF9B',       // color de marca: botones principales (con texto oscuro)
  sobreMenta: '#13302A',  // texto sobre menta (6,5:1)
  mentaSuave: '#DFF5EC',  // seleccionado, avisos buenos
  mentaBorde: '#3FA380',  // bordes de selección
  verde: '#1F5A45',       // texto verde
  verdeProfundo: '#1F3A31',
  rosa: '#B83D62',        // alertas, no vino
  rosaSuave: '#FBE7EC',
  ambar: '#8A5300',       // pendiente
  ambarSuave: '#FFF1DC',
  whatsapp: '#1E7D4F',
};

export const serif = "'Fraunces',Georgia,serif";
export const sans = "'Outfit',sans-serif";

export const inputStyle = {border:`1px solid ${C.lineaFuerte}`,borderRadius:12,padding:'0 12px',height:44,fontFamily:sans,fontSize:15,outline:'none',background:'white',color:C.tinta,width:'100%',boxSizing:'border-box'};

export const cardStyle = {background:'white',borderRadius:16,border:`1px solid ${C.linea}`};

export const sectionTitleStyle = {fontFamily:serif,fontSize:19,fontWeight:600,marginBottom:12};

export const pillSelectStyle = {border:`1px solid ${C.lineaFuerte}`,borderRadius:12,padding:'0 12px',height:44,fontFamily:sans,fontSize:14,outline:'none',background:'white',color:C.tinta};

export const emptyTextStyle = {textAlign:'center',padding:32,fontSize:14,color:C.tintaSuave};
