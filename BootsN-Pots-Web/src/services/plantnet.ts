/**
 * Identificação de plantas pela Pl@ntNet API (https://my.plantnet.org).
 *
 * A chave fica no arquivo .env (VITE_PLANTNET_API_KEY) e não é commitada.
 * Para chamar a API direto do navegador/app é preciso, na página de
 * configuração da chave, marcar "expose my API key" e listar os domínios
 * autorizados (ex.: http://localhost e https://localhost).
 *
 * Documentação: https://my.plantnet.org/doc/getting-started/introduction
 * Custo: 1 crédito por identificação (plano grátis: 500 por dia).
 */

const API_BASE = 'https://my-api.plantnet.org/v2';
const API_KEY: string | undefined = import.meta.env.VITE_PLANTNET_API_KEY;

/** Uma hipótese de espécie retornada pela API, em ordem de confiança. */
export interface Sugestao {
  /** Confiança da sugestão, de 0 a 1. */
  pontuacao: number;
  /** Nome científico completo, com autoridade (ex.: "Mentha × piperita L."). */
  nomeCientifico: string;
  /** Nome científico sem autoridade (ex.: "Mentha × piperita"). */
  nomeSemAutor: string;
  /** Nomes populares em português. */
  nomesComuns: string[];
  familia: string;
  genero: string;
}

/** Foto real de uma espécie vinda do banco da Pl@ntNet (vem junto da identificação). */
export interface ImagemRelacionada {
  url: string;
  /** Crédito obrigatório (autor / Pl@ntNet, licença). */
  credito: string;
}

export interface ResultadoIdentificacao {
  /** Nome científico da melhor correspondência. */
  melhorCorrespondencia: string;
  sugestoes: Sugestao[];
  /** Fotos da espécie identificada (aparece apenas com include-related-images=true). */
  imagens: ImagemRelacionada[];
  /** Créditos restantes de identificação no dia. */
  restante?: number;
}

/** Erro amigável de identificação (mensagem já pronta para exibir ao usuário). */
export class ErroIdentificacao extends Error {
  readonly status?: number;

  constructor(mensagem: string, status?: number) {
    super(mensagem);
    this.name = 'ErroIdentificacao';
    this.status = status;
  }
}

/** Forma bruta da resposta da API (só os campos que usamos). */
interface RespostaIdentificacao {
  bestMatch?: string;
  results?: Array<{
    score: number;
    species: {
      scientificName: string;
      scientificNameWithoutAuthor: string;
      commonNames?: string[];
      family?: { scientificNameWithoutAuthor?: string };
      genus?: { scientificNameWithoutAuthor?: string };
    };
    images?: Array<{ url?: { m?: string }; citation?: string }>;
  }>;
  remainingIdentificationRequests?: number;
}

/**
 * Identifica a planta presente em uma foto.
 *
 * @param foto data URL, blob URL ou URL de arquivo (ex.: caminho do Capacitor).
 * @param orgao Opcional: 'leaf' | 'flower' | 'fruit' | 'bark' | 'habit' | 'auto'.
 *              Quando omitido, a API detecta o órgão sozinha.
 */
export async function identificarPlanta(foto: string, orgao?: string): Promise<ResultadoIdentificacao> {
  if (!API_KEY) {
    throw new ErroIdentificacao(
      'Chave da API não configurada: crie o arquivo .env com VITE_PLANTNET_API_KEY.',
    );
  }

  const imagem = await converterParaArquivo(foto);
  const corpo = new FormData();
  corpo.append('images', imagem);
  if (orgao) corpo.append('organs', orgao);

  let resposta: Response;
  try {
    resposta = await fetch(
      `${API_BASE}/identify/all?api-key=${encodeURIComponent(API_KEY)}` +
        `&lang=pt&include-related-images=true`,
      { method: 'POST', body: corpo },
    );
  } catch {
    throw new ErroIdentificacao(
      'Não foi possível conectar ao serviço de identificação. ' +
        'Verifique a internet e se o domínio deste app está autorizado na chave da Pl@ntNet ' +
        '(expose my API key → Authorized domains).',
    );
  }

  if (!resposta.ok) throw erroPorStatus(resposta.status);

  const dados = (await resposta.json()) as RespostaIdentificacao;

  const sugestoes: Sugestao[] = (dados.results ?? []).map((resultado) => ({
    pontuacao: resultado.score,
    nomeCientifico: resultado.species.scientificName,
    nomeSemAutor: resultado.species.scientificNameWithoutAuthor,
    nomesComuns: resultado.species.commonNames ?? [],
    familia: resultado.species.family?.scientificNameWithoutAuthor ?? '',
    genero: resultado.species.genus?.scientificNameWithoutAuthor ?? '',
  }));

  if (sugestoes.length === 0) {
    throw new ErroIdentificacao('Nenhuma planta reconhecida nesta foto. Tente uma foto mais próxima.');
  }

  const imagens: ImagemRelacionada[] = (dados.results?.[0]?.images ?? [])
    .map((imagemRelacionada) => ({
      url: imagemRelacionada.url?.m ?? '',
      credito: imagemRelacionada.citation ?? '',
    }))
    .filter((imagemRelacionada) => imagemRelacionada.url !== '');

  return {
    melhorCorrespondencia: dados.bestMatch ?? sugestoes[0].nomeCientifico,
    sugestoes,
    imagens,
    restante: dados.remainingIdentificationRequests,
  };
}

/** Converte data URL / URL de arquivo local em File para o FormData. */
async function converterParaArquivo(foto: string): Promise<File> {
  let blob: Blob;
  try {
    const resposta = await fetch(foto);
    blob = await resposta.blob();
  } catch {
    throw new ErroIdentificacao('Não foi possível ler a foto capturada.');
  }

  const tipo = blob.type || 'image/jpeg';
  if (!tipo.startsWith('image/')) {
    throw new ErroIdentificacao('O arquivo selecionado não é uma imagem.');
  }
  return new File([blob], 'planta.jpg', { type: tipo });
}

function erroPorStatus(status: number): ErroIdentificacao {
  if (status === 401 || status === 403) {
    return new ErroIdentificacao(
      'Chave da API recusada. Confira se "expose my API key" está ativo e este domínio ' +
        'está na lista de Authorized domains em my.plantnet.org/settings/api-key.',
      status,
    );
  }
  if (status === 429) {
    return new ErroIdentificacao('Cota diária de identificações atingida. Tente novamente amanhã.', status);
  }
  if (status === 400) {
    return new ErroIdentificacao('Imagem inválida ou muito grande. Tente outra foto.', status);
  }
  return new ErroIdentificacao('Serviço de identificação indisponível. Tente novamente.', status);
}
