const dot = color => <span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:color,marginRight:3,verticalAlign:'middle'}}/>;

export default function CalendarLegend() {
  return (
    <div style={{display:'flex',gap:10,fontSize:11,color:'#9a9090',alignItems:'center'}}>
      <span>{dot('#5fbf9b')}Confirmado</span>
      <span>{dot('#e8809a')}Pendiente</span>
    </div>
  );
}
