// Arma el sitio de una peluquería a partir de la plantilla.
//   node sitios/armar.mjs canela
// Lee sitios/negocios/canela.json (y las fotos de sitios/negocios/canela/fotos/, si hay)
// y deja el sitio listo para subir en sitios/dist/canela/.
// Sin nombre, arma la muestra (los datos de ejemplo de la plantilla) en sitios/dist/muestra/.
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2];
const plantilla = readFileSync(join(raiz, 'plantilla', 'sitio.html'), 'utf8');

const marca = /(<script type="application\/json" id="negocio">)([\s\S]*?)(<\/script>)/;
const muestra = JSON.parse(plantilla.match(marca)[2]);

let negocio = muestra;
if (slug) {
  const ruta = join(raiz, 'negocios', `${slug}.json`);
  if (!existsSync(ruta)) {
    console.error(`No encuentro ${ruta}. Copiá sitios/negocios/ejemplo.json con ese nombre y completalo.`);
    process.exit(1);
  }
  negocio = JSON.parse(readFileSync(ruta, 'utf8'));
  negocio.demo ??= false;
}

const falta = ['nombre', 'whatsapp', 'eslogan'].filter(k => !negocio[k]);
if (falta.length) { console.error(`Faltan datos en el JSON: ${falta.join(', ')}`); process.exit(1); }
if (!/^\d{10,15}$/.test(String(negocio.whatsapp))) {
  console.error('El whatsapp va con código de país y sin espacios ni signos. Ej.: 5491123456789');
  process.exit(1);
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// "</script>" dentro de un texto cortaría el bloque de datos.
const json = JSON.stringify(negocio, null, 2).replace(/<\//g, '<\\/');

let cuerpo = plantilla
  .replace(marca, (_, a, __, c) => `${a}\n${json}\n${c}`)
  .replace(/<title>[\s\S]*?<\/title>\n?/, '')
  .replace(/<meta name="claude:viewport-fit-sides"[^>]*>\n?/, '');

const titulo = `${negocio.nombre}${negocio.barrio ? ' · Peluquería canina en ' + negocio.barrio.split(',')[0] : ''}`;
const head = `<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(negocio.descripcion)}">
<meta property="og:title" content="${esc(negocio.nombre)}">
<meta property="og:description" content="${esc(negocio.eslogan)}">
<meta property="og:type" content="website">
${negocio.heroFoto ? `<meta property="og:image" content="${esc(negocio.heroFoto)}">` : ''}
${negocio.demo ? '<meta name="robots" content="noindex">' : ''}
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐾</text></svg>">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
`;
const html = head + cuerpo + '\n</body>\n</html>\n';

const salida = join(raiz, 'dist', slug || 'muestra');
rmSync(salida, { recursive: true, force: true });
mkdirSync(join(salida, 'fotos'), { recursive: true });
// Siempre van las ilustraciones de la plantilla (sirven de relleno) y encima las fotos del cliente.
cpSync(join(raiz, 'plantilla', 'fotos'), join(salida, 'fotos'), { recursive: true });
const fotosCliente = slug && join(raiz, 'negocios', slug, 'fotos');
if (fotosCliente && existsSync(fotosCliente)) cpSync(fotosCliente, join(salida, 'fotos'), { recursive: true });
writeFileSync(join(salida, 'index.html'), html);

console.log(`Listo: ${join(salida, 'index.html')}`);
if (negocio.demo) console.log('Está en modo muestra (banda de colores y sin aparecer en Google). Para el sitio final poné "demo": false.');
