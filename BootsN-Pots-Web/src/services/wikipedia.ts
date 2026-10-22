/**
 * Imagens e informações de plantas pelo NOME — grátis, sem chave de API.
 *
 * Fontes (todas liberadas para navegador, CORS aberto):
 * 1. Wikipédia pt → en (REST summary): descrição + imagem da página
 * 2. Wikimedia Commons: busca de imagem pelo nome científico — cobre
 *    quase TODA espécie mesmo quando a Wikipédia não tem página em pt
 * 3. Wikipédia REST search (pt → en): busca de QUALQUER planta pela tela
 *    de Busca (título + miniatura + descrição curta)
 */

export interface InfoPlanta {
  /** Título da página encontrada. */
  titulo: string;
  /** Resumo enciclopédico (em português quando existe). */
  resumo: string;
  /** URL da imagem da página (thumbnail) ou null se não houver. */
  imagem: string | null;
  /** Ex.: "pt.wikipedia.org". */
  fonte: string;
}

/** Resultado da busca da tela Busca. */
export interface ResultadoBusca {
  titulo: string;
  imagem: string | null;
  /** Descrição curta ("espécie de planta"...). */
  resumoCurto: string | null;
  /** Categorias para filtrar (planta, receita, medicinal...). */
  categorias: CategoriaBusca[];
}

/** Categorias usadas nos filtros da tela Busca. */
export type CategoriaBusca = 'planta' | 'receita' | 'medicinal' | 'culinaria' | 'aromatica';

/** Resultado ainda sem classificação (chegou cru da Wikipédia). */
interface ResultadoBruto {
  titulo: string;
  imagem: string | null;
  resumoCurto: string | null;
}

interface ResumoWikipedia {
  extract?: string;
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
}

/** Cache em memória para não repetir buscas na mesma sessão. */
const cache = new Map<string, InfoPlanta | null>();
const cacheBusca = new Map<string, ResultadoBusca[]>();

/**
 * Busca descrição + imagem a partir de nomes candidatos
 * (nome comum, nome científico...). Ordem: pt, depois en; se a página
 * encontrada não tiver imagem, procura no Commons pelo mesmo nome.
 */
export async function buscarInfoPlanta(
  nomes: Array<string | undefined | null>,
): Promise<InfoPlanta | null> {
  const candidatos = limparNomes(nomes);
  if (candidatos.length === 0) return null;

  const chaveCache = candidatos.join('|').toLowerCase();
  const guardado = cache.get(chaveCache);
  if (guardado !== undefined) return guardado;

  // 1) Resumos da Wikipédia (pt primeiro; en só se pt não achar nada)
  const resumos: InfoPlanta[] = [];
  for (const idioma of ['pt', 'en']) {
    for (const nome of candidatos) {
      const info = await resumoDaPagina(idioma, nome);
      if (info) resumos.push(info);
    }
    if (resumos.length > 0) break;
  }

  // Prefere página COM imagem; senão fica com a primeira e tenta o Commons
  let achado = resumos.find((r) => r.imagem) ?? resumos[0] ?? null;
  if (achado && !achado.imagem) {
    const imagem = await imagemNoCommons(candidatos);
    if (imagem) achado = { ...achado, imagem };
  }

  cache.set(chaveCache, achado);
  return achado;
}

/** Conveniência: só a imagem da planta pelo nome. */
export async function buscarImagemPorNome(
  nome: string,
  nomeCientifico?: string,
): Promise<string | null> {
  const info = await buscarInfoPlanta([nome, nomeCientifico]);
  return info?.imagem ?? null;
}

/**
 * Busca QUALQUER planta pelo nome (pt → completa com en).
 * Usada na tela de Busca.
 */
export async function buscarPlantas(termo: string, limite = 12): Promise<ResultadoBusca[]> {
  const consulta = termo.trim();
  if (consulta.length < 2) return [];

  const chaveCache = `busca:${consulta.toLowerCase()}`;
  const guardado = cacheBusca.get(chaveCache);
  if (guardado) return guardado;

  const bruto: ResultadoBruto[] = await buscaPaginas('pt', consulta, limite);
  if (bruto.length < limite) {
    const emIngles = await buscaPaginas('en', consulta, limite);
    const vistos = new Set(bruto.map((r) => r.titulo.toLowerCase()));
    for (const achado of emIngles) {
      const chave = achado.titulo.toLowerCase();
      if (!vistos.has(chave)) {
        vistos.add(chave);
        bruto.push(achado);
      }
    }
  }

  // Classifica e DESCARTA o que não é planta/receita de planta
  const resultados: ResultadoBusca[] = bruto
    .map((resultado) => ({
      ...resultado,
      categorias: classificar(resultado.titulo, resultado.resumoCurto, consulta),
    }))
    .filter((resultado) => resultado.categorias.length > 0)
    .slice(0, limite);

  cacheBusca.set(chaveCache, resultados);
  return resultados;
}

// --------------------------------------------------- classificação

/** Tudo minúsculo e sem acento, para comparar com os termos abaixo. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Páginas obviamente alheias a plantas (TV, filmes, comida pronta...). */
const RUIDO = [
  'desambigua',
  'telenovela',
  'filme',
  'televisao',
  'episodio',
  'musica',
  'cancao',
  'alimento',
  'bebida',
  'restaurante',
  'cantor',
  'ator ',
  'banda musical',
  'empresa',
  'sinfonia',
];

const RECEITA = ['receita', 'molho', 'prato', 'infusao', 'sobremesa', 'suco', 'coquetel', 'sopa'];
const MEDICINAL = ['medicinal', 'medicina', 'terapeut', 'fitoterap', 'remedio', 'farmac'];
const CULINARIA = ['culinar', 'gastronomic', 'cozinha', 'tempero', 'especiaria', 'condimento', 'comestiv', 'alimenticia'];
const AROMATICA = ['aromatic', 'perfum', 'oleo essencial'];
/** Termos que provam que a página É de uma planta. */
const PLANTA = [
  'planta',
  'especie',
  'genero',
  'arvore',
  'arbusto',
  'herbacea',
  'erva',
  'palmeira',
  'cacto',
  'musgo',
  'samambaia',
  'botanic',
  'cultivar',
  'nativa',
  'originaria',
  'endemica',
  'trepadeira',
  'epifita',
  'perene',
];

/**
 * Devolve as categorias do resultado — ou lista vazia se for página
 * que não interessa (aí ela é descartada da busca).
 * Só passa página de planta que tenha indício forte: termo botânico na
 * descrição ou, sem descrição, o próprio termo que a pessoa buscou.
 */
function classificar(titulo: string, resumo: string | null, termoBusca: string): CategoriaBusca[] {
  const texto = normalizar(`${titulo} ${resumo ?? ''}`);
  if (RUIDO.some((termo) => texto.includes(termo))) return [];

  const receita = RECEITA.some((termo) => texto.includes(termo));
  const medicinal = MEDICINAL.some((termo) => texto.includes(termo));
  const culinaria = CULINARIA.some((termo) => texto.includes(termo));
  const aromatica = AROMATICA.some((termo) => texto.includes(termo));
  const ehPlanta =
    PLANTA.some((termo) => texto.includes(termo)) ||
    (!resumo && normalizar(titulo).includes(normalizar(termoBusca)));

  const categorias: CategoriaBusca[] = [];
  // Página de receita (ex.: "Pesto — molho italiano") fica só em Receitas
  if (ehPlanta && (!receita || medicinal || culinaria || aromatica)) categorias.push('planta');
  if (receita) categorias.push('receita');
  if (medicinal) categorias.push('medicinal');
  if (culinaria) categorias.push('culinaria');
  if (aromatica) categorias.push('aromatica');
  return categorias;
}

// ------------------------------------------------------------ internos

async function buscaPaginas(
  idioma: string,
  termo: string,
  limite: number,
): Promise<ResultadoBruto[]> {
  try {
    const resposta = await fetch(
      `https://${idioma}.wikipedia.org/w/rest.php/v1/search/page` +
        `?q=${encodeURIComponent(termo)}&limit=${limite}&origin=*`,
      { headers: { Accept: 'application/json' } },
    );
    if (!resposta.ok) return [];

    const dados = (await resposta.json()) as {
      pages?: Array<{
        title?: string;
        thumbnail?: { url?: string };
        description?: string;
      }>;
    };
    return (dados.pages ?? [])
      .filter((pagina) => !!pagina.title)
      .map((pagina) => ({
        titulo: pagina.title as string,
        imagem: normalizarUrl(pagina.thumbnail?.url),
        resumoCurto: pagina.description ? pagina.description.slice(0, 120) : null,
      }));
  } catch {
    return [];
  }
}

/** Imagem pelo nome no Wikimedia Commons (falta de foto na Wikipédia). */
async function imagemNoCommons(candidatos: string[]): Promise<string | null> {
  for (const nome of candidatos.slice(0, 2)) {
    try {
      const resposta = await fetch(
        'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*' +
          '&generator=search' +
          `&gsrsearch=${encodeURIComponent(nome)}` +
          '&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=400',
        { headers: { Accept: 'application/json' } },
      );
      if (!resposta.ok) continue;

      const dados = (await resposta.json()) as {
        query?: { pages?: Record<string, { imageinfo?: Array<{ thumburl?: string; url?: string }> }> };
      };
      const paginas = dados.query?.pages ? Object.values(dados.query.pages) : [];
      const url = paginas[0]?.imageinfo?.[0]?.thumburl ?? paginas[0]?.imageinfo?.[0]?.url;
      const limpa = url ? url.split('?')[0] : null;
      if (limpa) return limpa;
    } catch {
      // tenta o próximo nome
    }
  }
  return null;
}

async function resumoDaPagina(idioma: string, titulo: string): Promise<InfoPlanta | null> {
  try {
    const resposta = await fetch(
      `https://${idioma}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo)}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!resposta.ok) return null;

    const dados = (await resposta.json()) as ResumoWikipedia;
    if (!dados.extract) return null;

    return {
      titulo,
      resumo: dados.extract,
      imagem: dados.thumbnail?.source ?? dados.originalimage?.source ?? null,
      fonte: `${idioma}.wikipedia.org`,
    };
  } catch {
    return null;
  }
}

/**
 * Se o nome terminar num sufixo botânico incompleto (ex.: "Ocimum basilicum var."),
 * devolve só a base ("Ocimum basilicum") para a busca não falhar por isso.
 */
function nomeBase(nome: string): string | null {
  const base = nome.replace(/\s+(var\.?|subsp\.?|ssp\.?|cv\.?|f\.?)\s*$/i, '').trim();
  return base !== nome && base.length >= 3 ? base : null;
}

function limparNomes(nomes: Array<string | undefined | null>): string[] {
  const candidatos: string[] = [];
  const vistos = new Set<string>();
  const adicionar = (nome?: string | null) => {
    if (!nome) return;
    const limpo = nome.trim();
    if (limpo === '') return;
    const chave = limpo.toLowerCase();
    if (vistos.has(chave)) return;
    vistos.add(chave);
    candidatos.push(limpo);
  };

  for (const nome of nomes) {
    adicionar(nome);
    // fallback: a base limpa de um sufixo quebrado vira candidato extra
    if (nome) adicionar(nomeBase(nome));
  }
  return candidatos;
}

/** URLs da API REST podem vir como "//upload.wikimedia.org/...". */
function normalizarUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}
