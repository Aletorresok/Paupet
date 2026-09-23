import { useState, useEffect } from 'react';
import GlobalStyles from '../../components/layout/GlobalStyles';
import Chips from './Chips';
import ElegirHorario from './ElegirHorario';
import VistaMensaje from './VistaMensaje';
import { useHorariosLibres } from './useHorariosLibres';
import { armarMensaje } from './mensajeTurno';
import { ESTILOS_TURNOS } from './estilos';
import pauSecador from '../../assets/ilustraciones/pau-secador.webp';
import { TAMANIOS, VINO_ANTES, SERVICIOS, A_TENER_EN_CUENTA, ICONOS_SERVICIO } from './opciones';

const VACIO = {
  perro: '', duenio: '', raza: '', tamanio: '', vinoAntes: '',
  servicios: [], aTenerEnCuenta: [], comentario: '',
  horario: null, franja: '', preferencia: '',
};

// Página pública (sin usuario): la persona completa el pedido y se abre WhatsApp
// con el mensaje listo para Pau. No guarda nada en la base.
export default function PedirTurnoPage() {
  const [f, setF] = useState(VACIO);
  const [aMano, setAMano] = useState(false);
  const { cargando, dias } = useHorariosLibres();
  const set = (campo, valor) => setF(x => ({ ...x, [campo]: valor }));

  useEffect(() => { document.title = 'Pedí tu turno · Paupet'; }, []);

  const conHorarios = dias.length > 0 && !aMano;
  const { texto, faltan } = armarMensaje(conHorarios ? f : { ...f, horario: null });

  return (
    <>
      <GlobalStyles />
      <style>{ESTILOS_TURNOS}</style>
      <main className="pt-wrap">
        <div className="pt-form">
          <img className="pt-hero" src={pauSecador} alt="Pau secando a un salchicha en la mesa de peluquería" />
          <header className="pt-cabecera">
            <div>
              <h1>Pedí tu turno en Paupet</h1>
              <p>Completá estos datos y se arma un mensaje de WhatsApp para Pau. Ella te confirma el día y el precio.</p>
            </div>
          </header>

          <section className="pt-bloque" aria-labelledby="pt-t-perro">
            <h2 id="pt-t-perro">Tu perro</h2>
            <div className="pt-campos">
              <label className="pt-campo">Nombre del perro
                <input id="pt-perro" className="pt-input" value={f.perro} onChange={e => set('perro', e.target.value)} autoComplete="off" />
              </label>
              <label className="pt-campo">Tu nombre
                <input id="pt-duenio" className="pt-input" value={f.duenio} onChange={e => set('duenio', e.target.value)} autoComplete="given-name" />
              </label>
              <label className="pt-campo"><span>Raza <span className="pt-opc">(si sabés)</span></span>
                <input id="pt-raza" className="pt-input" value={f.raza} onChange={e => set('raza', e.target.value)} autoComplete="off" />
              </label>
            </div>
            <div className="pt-grupo">
              <span className="pt-tit">Tamaño</span>
              <Chips opciones={TAMANIOS} value={f.tamanio} onChange={v => set('tamanio', v)} label="Tamaño" />
            </div>
            <div className="pt-grupo">
              <span className="pt-tit">¿Ya vino a Paupet?</span>
              <Chips opciones={VINO_ANTES} value={f.vinoAntes} onChange={v => set('vinoAntes', v)} label="¿Ya vino a Paupet?" iconos={ICONOS_SERVICIO} />
            </div>
          </section>

          <section className="pt-bloque" aria-labelledby="pt-t-serv">
            <h2 id="pt-t-serv">¿Qué necesita?</h2>
            <p className="pt-sub">Podés elegir más de uno. El precio te lo pasa Pau, porque depende de cada perro.</p>
            <Chips multiple opciones={SERVICIOS} value={f.servicios} onChange={v => set('servicios', v)} label="Servicios" iconos={ICONOS_SERVICIO} />
            <div className="pt-grupo">
              <span className="pt-tit">¿Algo que Pau tenga que saber? <span className="pt-opc">(opcional)</span></span>
              <Chips multiple opciones={A_TENER_EN_CUENTA} value={f.aTenerEnCuenta} onChange={v => set('aTenerEnCuenta', v)} label="Para tener en cuenta" />
              <textarea id="pt-comentario" className="pt-input" value={f.comentario} onChange={e => set('comentario', e.target.value)}
                aria-label="Otro comentario" placeholder="Otro comentario (ej.: le molesta el secador)" />
            </div>
          </section>

          <section className="pt-bloque" aria-labelledby="pt-t-cuando">
            <h2 id="pt-t-cuando">¿Cuándo te queda bien?</h2>
            <ElegirHorario
              dias={dias} cargando={cargando} aMano={aMano} onAMano={setAMano}
              horario={f.horario} onHorario={v => set('horario', v)}
              franja={f.franja} onFranja={v => set('franja', v)}
              preferencia={f.preferencia} onPreferencia={v => set('preferencia', v)}
            />
          </section>
        </div>

        <VistaMensaje texto={texto} faltan={faltan} />
      </main>
    </>
  );
}
