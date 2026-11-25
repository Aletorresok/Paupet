# Sitios para peluquerías caninas

Plantilla de sitio web para ofrecer a peluquerías. No toca la app de Pau ni su base de datos:
es una página sola que funciona sin servidor (el pedido de turno sale por WhatsApp).

## Qué tiene
Portada con estado "Abierto ahora", servicios con precio por tamaño (chico / mediano / grande),
cómo es el turno, fotos, reseñas de Google, formulario de pedir turno que arma el mensaje de WhatsApp,
horarios (acepta horario cortado: `"09:00-13:00, 15:00-19:00"`), dirección, preguntas frecuentes
y botón flotante de WhatsApp en el celular. Modo oscuro automático.

## Mostrarla a un cliente nuevo
`node sitios/armar.mjs` arma la **muestra** (Peluquería Canela, datos de ejemplo) en `sitios/dist/muestra/`.
La muestra tiene una banda arriba para cambiar el color en vivo (canela, menta, lavanda, cielo, frutilla)
y no aparece en Google.

## Armar el sitio de una peluquería
1. Copiá `sitios/negocios/ejemplo.json` como `sitios/negocios/<nombre>.json` (ej.: `huellitas.json`).
2. Completalo: nombre, WhatsApp (con 549 y sin espacios), dirección, horarios, servicios y precios,
   reseñas de Google, preguntas. `"tema"` elige el color. Si no querés mostrar precios: `"mostrarPrecios": false`.
3. Fotos: ponelas en `sitios/negocios/<nombre>/fotos/` y nombralas en el JSON como `"fotos/archivo.jpg"`
   (en `fotos`, `heroFoto` y en el `perro` de cada reseña). Las que no cambies quedan con las ilustraciones.
4. `node sitios/armar.mjs <nombre>` → queda en `sitios/dist/<nombre>/`, listo para subir a Vercel o Netlify.
5. Mientras es una propuesta dejá `"demo": true` (banda de "Sitio de muestra" y sin aparecer en Google).
   Cuando el cliente paga y te autoriza a usar sus fotos y reseñas, poné `"demo": false` y volvé a armarlo.

`sitios/dist/` no se sube al repo (está en `.gitignore`).
