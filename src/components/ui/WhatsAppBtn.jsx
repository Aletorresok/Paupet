import Btn from './Btn';

export default function WhatsAppBtn({ onClick, size='xs', children='💬' }) {
  return (
    <Btn size={size} onClick={onClick} style={{background:'#25d366',color:'white',border:'none'}}>{children}</Btn>
  );
}
