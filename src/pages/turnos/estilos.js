import { C, serif } from '../../lib/styles';

// CSS de la página pública. Va como texto porque necesita media queries y estados :hover/aria.
export const ESTILOS_TURNOS = `
.pt-wrap{max-width:1040px;margin:0 auto;padding:28px 16px 48px;display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:32px;align-items:start}
@media (max-width:880px){.pt-wrap{grid-template-columns:minmax(0,1fr);max-width:540px;padding-top:20px}}
.pt-form{display:flex;flex-direction:column;gap:18px}
.pt-hero{display:block;width:100%;max-width:440px;height:auto;margin:0 auto -6px}
@media (max-width:480px){.pt-hero{max-width:320px}}
.pt-cabecera{display:flex;gap:16px;align-items:center}
.pt-cabecera h1{font-family:${serif};font-size:30px;font-weight:600;line-height:1.1;text-wrap:balance}
.pt-cabecera p{margin-top:6px;color:${C.tintaSuave};font-size:15px;line-height:1.45}
@media (max-width:480px){.pt-cabecera h1{font-size:25px}}
.pt-avatar{width:84px;height:84px;border-radius:50%;background:${C.menta};border:3px solid ${C.mentaBorde};flex-shrink:0}
.pt-avatar-chico{width:36px;height:36px;border-width:2px}
.pt-bloque{background:white;border:1px solid ${C.linea};border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:14px}
.pt-bloque h2{font-family:${serif};font-size:21px;font-weight:600}
.pt-sub{color:${C.tintaSuave};font-size:14px;line-height:1.45}
.pt-campos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media (max-width:480px){.pt-campos{grid-template-columns:minmax(0,1fr)}}
.pt-campo{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:500}
.pt-opc{font-weight:400;color:${C.tintaSuave}}
.pt-input{font:inherit;font-size:16px;color:${C.tinta};background:white;border:1px solid ${C.lineaFuerte};border-radius:12px;padding:0 14px;height:48px;width:100%}
textarea.pt-input{height:auto;min-height:76px;padding:12px 14px;resize:vertical}
.pt-grupo{display:flex;flex-direction:column;gap:8px}
.pt-tit{font-size:14px;font-weight:500}
.pt-chips{display:flex;flex-wrap:wrap;gap:8px}
.pt-chip{font:inherit;font-size:15px;min-height:44px;padding:0 16px;border-radius:999px;border:1px solid ${C.lineaFuerte};background:white;color:${C.tinta};cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:background .15s,border-color .15s}
.pt-chip[aria-pressed="true"]{background:${C.mentaSuave};border-color:${C.mentaBorde};color:${C.verde};font-weight:600}
.pt-hora{min-width:76px;justify-content:center}
.pt-dias{display:flex;flex-direction:column;gap:12px}
.pt-dia{display:grid;grid-template-columns:92px minmax(0,1fr);gap:10px;align-items:start}
@media (max-width:480px){.pt-dia{grid-template-columns:minmax(0,1fr);gap:6px}}
.pt-dia-nom{padding-top:10px;font-weight:600;font-size:15px}
.pt-dia-nom small{display:block;font-weight:400;color:${C.tintaSuave};font-size:13px}
@media (max-width:480px){.pt-dia-nom{padding-top:0}.pt-dia-nom small{display:inline;margin-left:6px}}
.pt-link{font:inherit;font-size:15px;color:${C.verde};background:none;border:none;padding:6px 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px;align-self:flex-start;text-align:left}
.pt-lado{position:sticky;top:20px;display:flex;flex-direction:column;gap:12px}
@media (max-width:880px){.pt-lado{position:static}}
.pt-eyebrow{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${C.tintaSuave}}
.pt-chat{background:#EFE7DD;border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:10px;border:1px solid ${C.linea}}
.pt-para{display:flex;align-items:center;gap:10px;font-size:14px;color:#111B21}
.pt-para small{display:block;opacity:.7;font-size:12px}
.pt-burbuja{align-self:flex-end;max-width:100%;background:#DCF8C6;color:#111B21;border-radius:12px 12px 4px 12px;padding:10px 12px;font-size:14.5px;line-height:1.45;overflow-wrap:anywhere;box-shadow:0 1px 1px rgba(0,0,0,.08)}
.pt-enviar{display:flex;align-items:center;justify-content:center;gap:10px;height:54px;border-radius:14px;background:${C.whatsapp};color:white;font-size:17px;font-weight:600;text-decoration:none}
.pt-enviar[aria-disabled="true"]{opacity:.45;cursor:not-allowed}
.pt-falta{font-size:14px;color:${C.ambar}}
.pt-pie{font-size:13px;color:${C.tintaSuave};line-height:1.45}
.pt-num{color:${C.tinta};user-select:all;white-space:nowrap}
`;
