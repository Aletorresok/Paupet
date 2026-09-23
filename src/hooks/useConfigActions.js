import { db } from '../lib/db';

export function useConfigActions({ config, setConfig, toast }) {
  const handleSaveConfig = async cfg => {
    try {
      await db.saveConfig(cfg);
      setConfig(cfg);
      toast('Configuración guardada ✅');
    } catch(e) { toast(e.message, true); }
  };

  const handleSaveHorarios = async (horariosSemanales) => {
    try {
      await db.saveConfig({...config, horariosSemanales});
      setConfig(c => ({...c, horariosSemanales}));
      toast('Horarios guardados en la nube ☁️');
    } catch(e) { toast(e.message, true); }
  };

  return { handleSaveConfig, handleSaveHorarios };
}
