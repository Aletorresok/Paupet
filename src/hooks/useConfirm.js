import { useState } from 'react';

// askConfirm(msg) abre el ConfirmDialog y devuelve una promesa con true/false.
export function useConfirm() {
  const [confirm, setConfirm] = useState({open:false,msg:'',onConfirm:null});

  const askConfirm = (msg) => new Promise(resolve => {
    setConfirm({ open:true, msg, onConfirm: () => { setConfirm(c=>({...c,open:false})); resolve(true); }, onCancel: () => { setConfirm(c=>({...c,open:false})); resolve(false); } });
  });

  const closeConfirm = () => setConfirm(c=>({...c,open:false}));

  return { confirm, askConfirm, closeConfirm };
}
