import { C } from '../../lib/styles';

const badgeColors = {
  green:  {bg:C.mentaSuave,color:C.verde},
  pink:   {bg:C.rosaSuave,color:C.rosa},
  orange: {bg:C.ambarSuave,color:C.ambar},
  gray:   {bg:'#EEF1EF',color:'#46524D'},
  blue:   {bg:'#E6EEFA',color:'#2D5DA8'},
};

export default function Badge({ variant, children }) {
  const c = badgeColors[variant] || badgeColors.gray;
  return <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:999,fontSize:12,fontWeight:600,background:c.bg,color:c.color,whiteSpace:'nowrap'}}>{children}</span>;
}
