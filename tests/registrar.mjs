// Permite que Node resuelva los imports sin extensión del proyecto ("./utils" → "./utils.js"),
// igual que Vite. Sólo para correr los tests con `node --test`, sin dependencias extra.
import { register } from 'node:module';
register('./resolver.mjs', import.meta.url);
