import Btn from './Btn';
import Icon from './Icon';
import { C } from '../../lib/styles';

export default function WhatsAppBtn({ onClick, size='xs', children }) {
  return (
    <Btn size={size} onClick={onClick} aria-label={children ? undefined : 'Escribir por WhatsApp'} style={{background:C.whatsapp,color:'white',border:'none'}}>
      <Icon name="chat" size={size==='xs'?16:18} />{children}
    </Btn>
  );
}
