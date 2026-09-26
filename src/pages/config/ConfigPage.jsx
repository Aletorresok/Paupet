import { useState, useEffect } from 'react';
import { useResp } from '../../context/resp';
import Btn from '../../components/ui/Btn';
import Icon from '../../components/ui/Icon';
import PageHeader from '../../components/ui/PageHeader';
import { DIAS_CONFIG } from '../../lib/constants';
import ConfigGeneral from './ConfigGeneral';
import RespaldoCard from './RespaldoCard';
import DiaConfigCard from './DiaConfigCard';

export default function ConfigPage({ config, onSave, toast }) {
  const { isMob } = useResp();
  const [nombre, setNombre] = useState(config.nombre);
  const [msg, setMsg] = useState(config.msg||'');
  const [anticip, setAnticip] = useState(config.anticip||30);
  const [slots, setSlots] = useState(config.slots||{});
  const [horarios, setHorarios] = useState(config.horarios||{});
  const [openDays, setOpenDays] = useState({});
  const [newSlot, setNewSlot] = useState({});

  useEffect(() => {
    setNombre(config.nombre); setMsg(config.msg||''); setAnticip(config.anticip||30);
    setSlots({...config.slots}); setHorarios({...config.horarios});
  }, [config]);

  const toggleDayOpen = (key, open) => setHorarios(h => ({...h, [key]: {...(h[key]||{open:true,desde:'09:00',hasta:'18:00'}), open}}));
  const addSlot = key => {
    const hora=newSlot[key+'_hora']||'09:00', dur=parseInt(newSlot[key+'_dur']||60);
    const cur=slots[key]||[];
    if (cur.some(s=>s.hora===hora)) return;
    setSlots(s=>({...s,[key]:[...cur,{hora,duracion:dur}]}));
  };
  const removeSlot = (key,hora) => setSlots(s=>({...s,[key]:(s[key]||[]).filter(sl=>sl.hora!==hora)}));

  return (
    <section>
      <PageHeader title="Configuración" subtitle="Horarios base de cada día: la página Pedí tu turno los ofrece cuando un día no está cargado en Horarios para Stories">
        <Btn onClick={()=>onSave({nombre,msg,anticip:parseInt(anticip),slots,horarios})} size={isMob?'sm':''}><Icon name="check" strokeWidth={2}/>Guardar todo</Btn>
      </PageHeader>
      <RespaldoCard toast={toast} />
      <ConfigGeneral nombre={nombre} anticip={anticip} msg={msg} onNombre={setNombre} onAnticip={setAnticip} onMsg={setMsg} />
      {DIAS_CONFIG.map(d=>{
        const daySlots=(slots[d.key]||[]).slice().sort((a,b)=>a.hora.localeCompare(b.hora));
        const isOpen=horarios[d.key]?.open!==false;
        const isExp=openDays[d.key]!==undefined?openDays[d.key]:isOpen;
        return (
          <DiaConfigCard
            key={d.key}
            dia={d}
            slots={daySlots}
            isOpen={isOpen}
            onToggleOpen={open=>toggleDayOpen(d.key, open)}
            isExp={isExp}
            onToggleExp={()=>setOpenDays(o=>({...o,[d.key]:!isExp}))}
            newHora={newSlot[d.key+'_hora']||'09:00'}
            newDur={newSlot[d.key+'_dur']||60}
            onNewHora={v=>setNewSlot(s=>({...s,[d.key+'_hora']:v}))}
            onNewDur={v=>setNewSlot(s=>({...s,[d.key+'_dur']:v}))}
            onAddSlot={()=>addSlot(d.key)}
            onRemoveSlot={hora=>removeSlot(d.key,hora)}
          />
        );
      })}
    </section>
  );
}
