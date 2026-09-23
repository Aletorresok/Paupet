import { useState } from 'react';

export const CLOSED_TURNO = {open:false,fecha:null,turnoEdit:null};
export const CLOSED_NOTA = {open:false,tipo:'compra',initial:null};

export function useModals() {
  const [modalCliente,      setModalCliente]      = useState({open:false,id:null});
  const [modalNuevoCliente, setModalNuevoCliente] = useState({open:false,initial:null});
  const [modalTurno,        setModalTurno]        = useState(CLOSED_TURNO);
  const [modalNota,         setModalNota]         = useState(CLOSED_NOTA);
  return {
    modalCliente, setModalCliente,
    modalNuevoCliente, setModalNuevoCliente,
    modalTurno, setModalTurno,
    modalNota, setModalNota,
  };
}
