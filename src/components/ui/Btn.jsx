import { C, sans } from '../../lib/styles';

const variants = {
  primary: {background:C.menta,color:C.sobreMenta,border:'none'},
  pink:    {background:C.rosa,color:'white',border:'none'},
  ghost:   {background:'white',color:C.tinta,border:`1px solid ${C.linea}`},
  danger:  {background:'white',color:C.rosa,border:`1px solid ${C.linea}`},
};
const sizes = {
  '':  {height:44,padding:'0 18px',fontSize:15,borderRadius:12},
  sm:  {height:36,padding:'0 14px',fontSize:14,borderRadius:10},
  xs:  {height:32,padding:'0 10px',fontSize:13,borderRadius:9},
};

export default function Btn({ variant='primary', size='', onClick, children, style={}, disabled=false, title, ...rest }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} aria-label={rest['aria-label']} style={{
      display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,
      cursor:disabled?'not-allowed':'pointer',fontFamily:sans,
      fontWeight:600,whiteSpace:'nowrap',transition:'background .15s, opacity .15s',
      opacity:disabled?.6:1,boxSizing:'border-box',
      ...variants[variant],...sizes[size],...style,
    }}>
      {children}
    </button>
  );
}
