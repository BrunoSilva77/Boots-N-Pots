/**
 * Avatares pré-definidos para o usuário personalizar o perfil.
 * São SVGs inline (data URLs) — não precisam de arquivos no dispositivo.
 * A escolha fica guardada por código (ex.: "broto-03") no perfil/local.
 */

export interface Avatar {
  codigo: string;
  nome: string;
  svg: string;
}

/** Cria um SVG data URL simples a partir de um corpo de desenho. */
function avatar(fundo: string, corpo: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">` +
    `<circle cx="48" cy="48" r="48" fill="${fundo}"/>` +
    corpo +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Vaso de barro com broto. */
function broto(vaso: string, folha: string): string {
  return avatar('#eaf6ec', `
    <path d="M36 62h24l-3 18a4 4 0 0 1-4 4H43a4 4 0 0 1-4-4z" fill="${vaso}"/>
    <rect x="34" y="56" width="28" height="8" rx="3" fill="${vaso}"/>
    <path d="M48 56V38" stroke="#3f8f52" stroke-width="3" stroke-linecap="round"/>
    <path d="M48 44c-8-2-12-8-11-15 8 0 13 5 11 15z" fill="${folha}"/>
    <path d="M48 48c7-3 11-9 10-16-8 1-12 7-10 16z" fill="${folha}"/>
  `);
}

/** Gera 6 avatares "broto" com tons de vaso/folha diferentes. */
const brotos: Avatar[] = [
  ['#c98a5b', '#5bb46a'],
  ['#8d6e63', '#43a047'],
  ['#e0a458', '#7cb85c'],
  ['#a1887f', '#2e9e5b'],
  ['#d98f6a', '#8bc34a'],
  ['#b07d56', '#66bb6a'],
].map(([vaso, folha], i) => ({
  codigo: `broto-${String(i + 1).padStart(2, '0')}`,
  nome: `Broto ${i + 1}`,
  svg: broto(vaso as string, folha as string),
}));

/** Cactus simpático. */
function cactus(corpo: string): string {
  return avatar('#eef7ef', `
    <rect x="38" y="40" width="20" height="34" rx="10" fill="${corpo}"/>
    <rect x="24" y="46" width="12" height="8" rx="4" fill="${corpo}"/>
    <rect x="24" y="46" width="6" height="18" rx="3" fill="${corpo}"/>
    <rect x="60" y="50" width="12" height="8" rx="4" fill="${corpo}"/>
    <rect x="66" y="50" width="6" height="14" rx="3" fill="${corpo}"/>
    <path d="M32 74h32l-3 12a4 4 0 0 1-4 4H39a4 4 0 0 1-4-4z" fill="#c98a5b"/>
    <circle cx="48" cy="38" r="4" fill="#e91e63"/>
  `);
}

const cactos: Avatar[] = [
  '#4c9a5a',
  '#3f8f52',
  '#5bb46a',
].map((corpo, i) => ({
  codigo: `cacto-${String(i + 1).padStart(2, '0')}`,
  nome: `Cacto ${i + 1}`,
  svg: cactus(corpo),
}));

/** Folha estilizada (monstera). */
function folha(fundo: string, verde: string): string {
  return avatar(fundo, `
    <path d="M48 18c16 6 24 20 22 34-2 12-12 20-22 22-10-2-20-10-22-22-2-14 6-28 22-34z" fill="${verde}"/>
    <path d="M48 26v44" stroke="#eaf6ec" stroke-width="2" stroke-linecap="round"/>
    <path d="M48 36l8-4M48 46l10-3M48 56l9-2M48 36l-8-4M48 46l-10-3M48 56l-9-2" stroke="#eaf6ec" stroke-width="2" stroke-linecap="round"/>
  `);
}

const folhas: Avatar[] = [
  ['#e8f1fb', '#3f8f52'],
  ['#fdf3e7', '#43a047'],
  ['#eef7ef', '#2e9e5b'],
].map(([fundo, verde], i) => ({
  codigo: `folha-${String(i + 1).padStart(2, '0')}`,
  nome: `Folha ${i + 1}`,
  svg: folha(fundo as string, verde as string),
}));

/** Flores coloridas. */
function flor(fundo: string, petala: string, miolo: string): string {
  return avatar(fundo, `
    <circle cx="48" cy="34" r="7" fill="${petala}"/>
    <circle cx="34" cy="44" r="7" fill="${petala}"/>
    <circle cx="62" cy="44" r="7" fill="${petala}"/>
    <circle cx="40" cy="58" r="7" fill="${petala}"/>
    <circle cx="56" cy="58" r="7" fill="${petala}"/>
    <circle cx="48" cy="47" r="8" fill="${miolo}"/>
    <path d="M48 66v14" stroke="#3f8f52" stroke-width="3" stroke-linecap="round"/>
  `);
}

const flores: Avatar[] = [
  ['#fdeef4', '#ec4899', '#fbbf24'],
  ['#eef4fd', '#8b5cf6', '#fbbf24'],
  ['#fff6e6', '#f59e0b', '#ef4444'],
].map(([fundo, petala, miolo], i) => ({
  codigo: `flor-${String(i + 1).padStart(2, '0')}`,
  nome: `Flor ${i + 1}`,
  svg: flor(fundo as string, petala as string, miolo as string),
}));

/** Lista completa de avatares disponíveis. */
export const AVATARES: Avatar[] = [...brotos, ...cactos, ...folhas, ...flores];

/** Procura um avatar pelo código (devolve null se não achar). */
export function avatarPorCodigo(codigo: string | null | undefined): Avatar | null {
  if (!codigo) return null;
  return AVATARES.find((a) => a.codigo === codigo) ?? null;
}
