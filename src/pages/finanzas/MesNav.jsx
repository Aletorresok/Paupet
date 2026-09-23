import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import { MESES } from '../../lib/constants';
import { mesActual, moverMes } from './finanzasCalc';

export default function MesNav({ mes, onChange }) {
  const [y, m] = mes.split('-').map(Number);
  const esActual = mes === mesActual();
  return (
    <div style={{display:'flex',alignItems:'center',gap:6}}>
      <Btn variant="ghost" onClick={() => onChange(moverMes(mes, -1))} aria-label="Mes anterior" style={{width:44,padding:0}}><Icon name="left" strokeWidth={2}/></Btn>
      <span style={{fontSize:16,fontWeight:600,minWidth:150,textAlign:'center',textTransform:'capitalize'}}>{MESES[m-1]} {y}</span>
      <Btn variant="ghost" onClick={() => onChange(moverMes(mes, 1))} disabled={esActual} aria-label="Mes siguiente" style={{width:44,padding:0}}><Icon name="right" strokeWidth={2}/></Btn>
    </div>
  );
}
