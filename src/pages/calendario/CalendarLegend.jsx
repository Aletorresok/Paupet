const dot = color => <span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:color,marginRight:3,verticalAlign:'middle'}}/>;

export default function CalendarLegend() {
  return (
    <div style={{display:'flex',gap:10,fontSize:11,color:'#5B6661',alignItems:'center'}}>
      <span>{dot('#5fbf9b')}Confirmado</span>
      <span>{dot('#B83D62')}Pendiente</span>
    </div>
  );
}
