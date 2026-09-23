import caniche from '../assets/avatares/caniche.webp';
import mestizo from '../assets/avatares/mestizo.webp';
import golden from '../assets/avatares/golden.webp';
import salchicha from '../assets/avatares/salchicha.webp';
import yorkie from '../assets/avatares/yorkie.webp';
import ovejero from '../assets/avatares/ovejero.webp';

// Cara ilustrada según la raza cargada (para perros sin foto). Sin coincidencia → mestizo.
const REGLAS = [
  [/canich|poodle|bich[oó]n|frise/, caniche],
  [/golden|labrador|retriever|lab\b/, golden],
  [/salchich|dachs|teckel/, salchicha],
  [/york|malt[eé]s|shih|schnau|terrier|lhasa|pekin|scottie|westie/, yorkie],
  [/ovejer|pastor|malinois|husky|collie|akita|lobo/, ovejero],
];

export function avatarPorRaza(raza = '') {
  const r = raza.toLowerCase();
  return (REGLAS.find(([re]) => re.test(r)) || [null, mestizo])[1];
}

export const esGato = (raza = '') => /gat[oa]/i.test(raza);
