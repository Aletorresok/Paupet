import { C } from '../../../lib/styles';

// Estilos compartidos por los pasos de Nuevo turno (maqueta `Turno.dc.html`).
export const etiquetaPaso = {fontSize:13,fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase',color:C.tintaSuave};
export const paso = {display:'flex',flexDirection:'column',gap:8,border:'none',margin:0,padding:0,minWidth:0};
export const chip = sel => ({
  height:46,padding:'0 16px',borderRadius:14,fontFamily:'inherit',fontSize:15,cursor:'pointer',whiteSpace:'nowrap',flex:'none',
  ...(sel ? {background:'#E4F4EC',color:C.sobreMenta,border:`2px solid ${C.mentaBorde}`,fontWeight:600}
    : {background:'white',color:C.tinta,border:'1px solid #D9D5CE',fontWeight:500}),
});
export const link = {minHeight:44,display:'inline-flex',alignItems:'center',border:'none',background:'none',padding:0,fontFamily:'inherit',fontSize:13,fontWeight:600,color:'#1F6B50',textDecoration:'underline',cursor:'pointer'};
export const nota = {fontSize:13,color:C.tintaSuave};
