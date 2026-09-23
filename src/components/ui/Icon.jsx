// Íconos de línea (estilo Lucide). Reemplazan a los emojis en la navegación y los botones.
const PATHS = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  users: <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.6 3 5.2"/></>,
  camera: <><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
  notes: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  settings: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></>,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  chat: <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5"/>,
  // Servicios (idea de Gemini, redibujados con el mismo trazo que el resto).
  banio: <><path d="M3 12h18M4.5 12v2.5A4.5 4.5 0 0 0 9 19h6a4.5 4.5 0 0 0 4.5-4.5V12M7.5 19l-1 2M16.5 19l1 2M6 12V7a2 2 0 0 1 4 0"/><circle cx="14" cy="7.5" r="1.7"/><circle cx="18.2" cy="5" r="1.2"/><circle cx="18" cy="9.3" r="0.9"/></>,
  tijera: <><circle cx="8" cy="18" r="2.6"/><circle cx="16" cy="18" r="2.6"/><path d="M9.6 16 16 3M14.4 16 8 3"/></>,
  banioCorte: <><circle cx="7" cy="18" r="2.6"/><circle cx="15" cy="18" r="2.6"/><path d="M8.6 16 15 3M13.4 16 7 3"/><path d="M20 6.5s-2 2.2-2 3.7a2 2 0 0 0 4 0c0-1.5-2-3.7-2-3.7z"/></>,
  carda: <><rect x="4" y="3" width="16" height="9" rx="2"/><path d="M8 6v3M12 6v3M16 6v3M10.5 12v7.5a1.5 1.5 0 0 0 3 0V12"/></>,
  unias: <><path d="M7.5 16 17 6.5a2.1 2.1 0 0 1 3 3L10.5 19a2.1 2.1 0 0 1-3-3z"/><path d="M10 14.5 16.5 8"/><circle cx="5" cy="19" r="2"/></>,
  pawNuevo: <><circle cx="6" cy="10" r="1.8"/><circle cx="10.5" cy="7" r="1.8"/><circle cx="15" cy="10" r="1.8"/><path d="M10.5 12.5c-3 0-5.5 3.2-5.5 5.2 0 1.6 1.4 2.3 2.7 2.3 1.1 0 1.8-.6 2.8-.6s1.7.6 2.8.6c1.3 0 2.7-.7 2.7-2.3 0-2-2.5-5.2-5.5-5.2z"/><path d="M19 2.5l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L16.1 4.6l2-.3z"/></>,
  x: <path d="M6 6l12 12M18 6 6 18"/>,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>,
  alert: <><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01"/></>,
  more: <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
  left: <path d="m15 6-6 6 6 6"/>,
  right: <path d="m9 6 6 6-6 6"/>,
  paw: <><circle cx="7" cy="9" r="1.8"/><circle cx="12" cy="6.5" r="1.8"/><circle cx="17" cy="9" r="1.8"/><path d="M12 12c-3 0-5.5 3.2-5.5 5.2 0 1.6 1.4 2.3 2.7 2.3 1.1 0 1.8-.6 2.8-.6s1.7.6 2.8.6c1.3 0 2.7-.7 2.7-2.3C17.5 15.2 15 12 12 12z"/></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>,
  download: <path d="M12 4v11m0 0-4-4m4 4 4-4M4 20h16"/>,
  repeat: <><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></>,
};

export default function Icon({ name, size = 18, strokeWidth = 1.8, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flexShrink:0,...style}}>
      {PATHS[name]}
    </svg>
  );
}
