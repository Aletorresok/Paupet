import { C, serif } from '../../lib/styles';

// CSS de la página pública. Va como texto porque necesita media queries y estados :hover/aria.
export const ESTILOS_TURNOS = `
.pt-scroll{height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain}
.pt-wrap{max-width:1040px;margin:0 auto;padding:28px 16px 48px;display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:32px;align-items:start}
@media (max-width:880px){.pt-wrap{grid-template-columns:minmax(0,1fr);max-width:540px;padding-top:20px}}
.pt-form{display:flex;flex-direction:column;gap:18px}
.pt-hero{display:block;width:100%;max-width:440px;height:auto;margin:0 auto -6px}
@media (max-width:480px){.pt-hero{max-width:270px}}
.pt-cabecera{display:flex;gap:16px;align-items:center}
.pt-cabecera h1{font-family:${serif};font-size:30px;font-weight:600;line-height:1.1;text-wrap:balance}
.pt-cabecera p{margin-top:6px;color:${C.tintaSuave};font-size:15px;line-height:1.45}
@media (max-width:480px){.pt-cabecera h1{font-size:25px}}
.pt-bloque{background:white;border:1px solid ${C.linea};border-radius:18px;padding:24px 22px;display:flex;flex-direction:column;gap:16px}
@media (max-width:480px){.pt-bloque{padding:20px 18px}}
.pt-bloque h2{font-family:${serif};font-size:21px;font-weight:600}
.pt-sub{color:${C.tintaSuave};font-size:14px;line-height:1.45}
.pt-campos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 14px}
@media (max-width:480px){.pt-campos{grid-template-columns:minmax(0,1fr)}}
.pt-campo{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:500}
.pt-opc{font-weight:400;color:${C.tintaSuave}}
.pt-input{font:inherit;font-size:16px;color:${C.tinta};background:#FAF8F5;border:1.5px solid #CBC3B8;border-radius:12px;padding:0 14px;height:48px;width:100%}
.pt-input:focus{background:white;border-color:${C.mentaBorde}}
textarea.pt-input{height:auto;min-height:76px;padding:12px 14px;resize:vertical}
.pt-grupo{display:flex;flex-direction:column;gap:8px}
.pt-tit{font-size:14px;font-weight:500}
.pt-chips{display:flex;flex-wrap:wrap;gap:8px}
.pt-chip{font:inherit;font-size:15px;min-height:44px;padding:0 16px;border-radius:999px;border:1.5px solid #CBC3B8;background:#FAF8F5;color:${C.tinta};cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:background .15s,border-color .15s}
.pt-chip[aria-pressed="true"]{background:${C.mentaSuave};border-color:${C.mentaBorde};color:${C.verde};font-weight:600}
.pt-hora{min-width:76px;justify-content:center}
.pt-dias-scroll{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px;margin:0 -2px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.pt-dia-chip{flex:0 0 auto;scroll-snap-align:start;width:74px;padding:8px 4px;border-radius:14px;border:1.5px solid #CBC3B8;background:#FAF8F5;color:${C.tinta};font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px}
.pt-dia-chip[aria-pressed="true"]{background:${C.menta};border-color:${C.mentaBorde};color:${C.sobreMenta}}
.pt-dia-sem{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.pt-dia-num{font-family:${serif};font-size:24px;font-weight:600;line-height:1.1}
.pt-dia-cant{font-size:11px;opacity:.85}
.pt-link{font:inherit;font-size:15px;color:${C.verde};background:none;border:none;padding:6px 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px;align-self:flex-start;text-align:left}
.pt-lado{position:sticky;top:20px;display:flex;flex-direction:column;gap:12px}
@media (max-width:880px){.pt-lado{position:static}}
.pt-enviar{display:flex;align-items:center;justify-content:center;gap:10px;height:54px;border-radius:14px;background:${C.whatsapp};color:white;font-size:17px;font-weight:600;text-decoration:none}
.pt-enviar[aria-disabled="true"]{background:#B9D3C5;color:#3E5A4E;cursor:pointer}
.pt-falta{font-size:14px;color:${C.ambar}}
.pt-barra{display:none}
@media (max-width:880px){
  .pt-enviar-lado,.pt-falta-lado{display:none}
  .pt-wrap{padding-bottom:130px}
  .pt-barra{display:flex;flex-direction:column;gap:6px;position:fixed;left:0;right:0;bottom:0;z-index:30;background:${C.fondo};border-top:1px solid ${C.linea};padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));box-shadow:0 -6px 20px rgba(31,42,38,.08)}
  .pt-barra .pt-falta{font-size:13px;margin:0;line-height:1.35}
}
.pt-sugerido{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:${C.mentaSuave};border:1.5px solid ${C.mentaBorde};border-radius:14px;padding:12px 14px}
.pt-sugerido-txt{flex:1;min-width:180px;font-size:15px;line-height:1.4;color:#173F31}
.pt-sugerido-btn{font:inherit;font-size:15px;font-weight:600;height:44px;padding:0 18px;border-radius:12px;border:none;background:${C.menta};color:${C.sobreMenta};cursor:pointer}
.pt-chip-sug{position:relative}
.pt-chip-sug::after{content:'sugerido';position:absolute;top:-9px;right:-4px;font-size:10px;font-weight:600;background:${C.verde};color:white;border-radius:999px;padding:1px 6px}
.pt-pie{font-size:13px;color:${C.tintaSuave};line-height:1.45}
.pt-num{color:${C.tinta};user-select:all;white-space:nowrap}
`;
