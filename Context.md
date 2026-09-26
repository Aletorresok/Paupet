# Contexto del Proyecto: Paupet Peluquería Canina 🐾

## 🛠️ Stack Tecnológico
* **Frontend:** React (VDS / Componentes funcionales con Hooks).
* **Estilos:** CSS en línea modularizado con diseño adaptativo (Mobile & Desktop a través de `RespCtx`).
* **Base de datos & Backend:** Supabase (PostgreSQL + Storage para fotos de clientes).
* **Librerías externas:** `html2canvas` (para la generación y exportación del flyer de horarios).

---

## 📂 Estructura Objetivo (Modularización)
Para mejorar la mantenibilidad, estamos migrando de un archivo monolítico (`App.jsx` de ~2300 líneas) a una arquitectura basada en componentes desacoplados de menor tamaño (~200 líneas máx. por archivo):
src/
├── components/
│   ├── common/         # Primitivas UI (Modal, Btn, Badge, FormGroup, Spinner)
│   ├── dashboard/      # Panel principal y tarjetas de métricas
│   ├── clientes/       # Listado, perfiles y modales de alta/edición
│   ├── calendario/     # Grilla mensual y gestión de turnos diarios
│   ├── historial/      # Tabla unificada de servicios y pagos
│   ├── notas/          # Control de stock, compras y egresos
│   ├── horarios/       # Generador de grillas semanales y exportación a imagen
│   └── config/         # Configuración general y de slots horarios
├── context/
│   └── RespContext.jsx # Proveedor de responsividad (Mobile/Tablet/Desktop)
├── services/
│   └── supabase.js     # Cliente y llamadas a la base de datos
└── App.jsx             # Componente raíz (Enrutamiento y Estado Global)

---

## 🔄 Reglas de Negocio Clave
1. **No Duplicación Financiera:** Los ingresos mensuales y anuales se calculan **exclusivamente a partir de la tabla de visitas**, evitando sumar turnos completados duplicados.
2. **Inasistencias:** Marcar un turno como "No vino" elimina el turno y aumenta el contador de inasistencias del cliente correspondiente.
3. **Flujo de Caja:** Las formas de pago admitidas son `efectivo` y `transferencia`, diferenciándose visualmente en el historial y métricas.

2. Plan de Refactorización: De 2300 líneas a componentes de ~200
Para no romper nada en el proceso, la estrategia ideal es extraer de afuera hacia adentro (empezando por lo que no tiene dependencias complejas y terminando en el contenedor principal).

Fase 1: Extracción de Utilidades, Constantes y Primitivas (Riesgo: Nulo)
Archivo 1: src/utils/constants.js

Mover MESES, DIAS_ES, CAL_DAYS, DIAS_CONFIG, DEFAULT_CONFIG, PELUQUERA_IMG.

Archivo 2: src/utils/formatters.js

Mover funciones puras: fmtFecha, fmtPeso, abrirWhatsApp, animalIcon, durLabel, getSlotsDelDia, todayStr.

Archivo 3: src/services/db.js

Aislar por completo todas las llamadas a Supabase (getClientes, insertVisita, getTurnos, etc.) para que los componentes solo llamen funciones limpias.

Archivo 4: src/components/common/UIPrimitives.jsx

Agrupar componentes visuales tontos (dumb components): ToastContainer, Modal, ModalHead, Badge, Btn, FormGroup, Spinner, ConfirmDialog.

Fase 2: Extracción del Layout y Navegación
Archivo 5: src/components/layout/Sidebar.jsx

Manejo del menú lateral, diseño responsive para mobile/desktop y conteo de turnos pendientes.

Fase 3: Modularización de Vistas Principales (El núcleo)
Cada vista se convertirá en su propio archivo dentro de src/components/vistas/:

DashboardView.jsx (~150 líneas): Tarjetas de métricas del mes/año, turnos de hoy y clientes con inasistencias.

ClientesView.jsx + ModalCliente.jsx + ModalClienteForm.jsx (~200 líneas c/u): Grilla de búsqueda, perfil detallado del perrito, historial de visitas y formulario de alta/edición con manejo de imágenes en Supabase.

CalendarioView.jsx + ModalTurno.jsx (~250 líneas c/u): Calendario interactivo mensual, selección de días y creación/edición de turnos.

HistorialView.jsx (~120 líneas): Tabla filtrable por mes y texto de todas las visitas pasadas con totales automáticos.

NotasView.jsx + ModalNota.jsx (~180 líneas c/u): Pestañas de compras pendientes y control de egresos categorizados.

HorariosView.jsx (~300 líneas): El generador de historias para Instagram, grilla de slots por día y la lógica de html2canvas. (Este puede ser un poco más largo por la complejidad del canvas, pero se aísla perfectamente).

ConfigView.jsx (~150 líneas): Ajustes generales de la peluquería y horarios base de turnos.