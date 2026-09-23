import { sans } from '../../lib/styles';

const variants = {
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

export default function Btn({ variant='primary', size='', onClick, children, style={}, disabled=false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:'inline-flex',alignItems:'center',gap:7,border:'none',borderRadius:50,
      cursor:disabled?'not-allowed':'pointer',fontFamily:sans,
      fontWeight:500,whiteSpace:'nowrap',transition:'all .2s',
      opacity:disabled?.6:1,
      ...variants[variant],...sizes[size],...style,
    }}>
      {children}
    </button>
  );
}
