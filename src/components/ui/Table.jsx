const thStyle = {textAlign:'left',fontSize:11,color:'#5B6661',textTransform:'uppercase',letterSpacing:.5,padding:'8px 14px',borderBottom:'2px solid #E6E0D8',fontWeight:500};
const tdStyle = {padding:'10px 14px',borderBottom:'1px solid #E6E0D8',fontSize:13};

export function Table({ headers, children }) {
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr>{headers.map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children }) {
  return <td style={tdStyle}>{children}</td>;
}
