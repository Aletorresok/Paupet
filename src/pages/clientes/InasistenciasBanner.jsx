import Btn from '../../components/ui/Btn';

export default function InasistenciasBanner({ cantidad, onRestar }) {
  return (
    <div style={{marginBottom:14,padding:'10px 14px',background:'#FBE7EC',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div>
        <div style={{fontSize:11,fontWeight:600,color:'#B83D62'}}>INASISTENCIAS</div>
        <div style={{fontSize:20,fontWeight:600,color:'#B83D62'}}>{cantidad}</div>
      </div>
      <Btn size="sm" variant="pink" onClick={onRestar}>➖ Restar</Btn>
    </div>
  );
}
