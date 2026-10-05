import PageHeader from '../../components/ui/PageHeader';
import { proximoDiaConTurnos } from '../../lib/bandeja';
import { clientesParaVolver, enPausa } from '../../lib/frecuencia';
import PedidosCard from '../dashboard/PedidosCard';
import ManianaCard from '../dashboard/ManianaCard';
import VuelvenCard from '../dashboard/VuelvenCard';

// Bandeja de Avisos: pedidos de turno, recordatorios del próximo día y "les toca volver".
// Por ahora reúne las tarjetas de Hoy tal cual; el diseño nuevo es el punto 6 de REDISENO.md.
export default function AvisosPage({ clientes, turnos, pedidos = [], pedidoActions, caps = {}, onOpenClient, onPausarVuelta }) {
  const { titulo, turnos: delDia } = proximoDiaConTurnos(turnos);
  const paraVolver = clientesParaVolver(clientes, turnos);

  return (
    <section>
      <PageHeader title="Avisos" subtitle="Mensajes para mandar" />
      <PedidosCard pedidos={pedidos} clientes={clientes} turnos={turnos} acciones={pedidoActions} />
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <ManianaCard turnos={delDia} clientes={clientes} titulo={titulo} />
        <VuelvenCard items={paraVolver.filter(x => !enPausa(x.cliente))} ocultos={paraVolver.filter(x => enPausa(x.cliente))}
          onOpenClient={onOpenClient} onPausar={caps.vueltaPausa ? onPausarVuelta : null} />
      </div>
    </section>
  );
}
