/**
 * Cliente da API Boots'N Pots (PHP + MySQL no XAMPP).
 *
 * Base: VITE_API_URL no .env (padrão http://localhost/bootsnpots/api;
 * no celular na LAN use http://192.168.x.x/bootsnpots/api).
 *
 * Sessão: token guardado no localStorage junto do perfil do usuário.
 */

const BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost/bootsnpots/api';

const CHAVE_SESSAO = 'bootsnpots:sessao';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  avatar?: string | null; // código do avatar pré-definido (ex.: "broto-01")
}

export interface Sessao {
  token: string;
  usuario: Usuario;
}

export interface PlantaHistorico {
  id: number;
  nome_comum: string;
  nome_cientifico: string;
  confianca: number | null;
  foto_url: string | null;
  latitude: number | null;
  longitude: number | null;
  local_descricao: string | null;
  achado_em: string;
  pastas_ids: number[];
}

export interface Pasta {
  id: number;
  nome: string;
  id_pasta_pai: number | null;
  total_plantas: number;
  total_subpastas: number;
}

export interface ResumoPerfil {
  total_plantas: number;
  total_pastas: number;
  total_com_local: number;
}

export interface PlantaParaSalvar {
  nome_comum: string;
  nome_cientifico: string;
  confianca: number | null;
  foto?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  local_descricao?: string | null;
}

/** Erro amigável (mensagem da API ou de rede). */
export class ErroApi extends Error {
  readonly status?: number;

  constructor(mensagem: string, status?: number) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
  }
}

// ------------------------------------------------------------ sessão

export function lerSessao(): Sessao | null {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) return null;
    const sessao = JSON.parse(bruto) as Partial<Sessao>;
    return sessao.token && sessao.usuario ? (sessao as Sessao) : null;
  } catch {
    return null;
  }
}

export function logado(): boolean {
  return lerSessao() !== null;
}

export function sair(): void {
  try {
    localStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // storage indisponível
  }
}

function guardarSessao(sessao: Sessao): void {
  try {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  } catch {
    // storage indisponível
  }
}

// ------------------------------------------------------------ núcleo

interface Opcoes {
  metodo?: 'GET' | 'POST' | 'DELETE';
  corpo?: unknown;
}

async function pedir<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const sessao = lerSessao();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (sessao) headers.Authorization = `Bearer ${sessao.token}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}/${caminho}`, {
      method: opcoes.metodo ?? 'GET',
      headers,
      body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
    });
  } catch {
    throw new ErroApi(
      'Não foi possível conectar ao servidor. Confira se o XAMPP (Apache/MySQL) está ligado.',
    );
  }

  let dados: Record<string, unknown> | null = null;
  try {
    dados = (await resposta.json()) as Record<string, unknown>;
  } catch {
    dados = null;
  }

  if (!resposta.ok) {
    throw new ErroApi(
      (dados?.erro as string | undefined) ?? `Erro ${resposta.status} no servidor.`,
      resposta.status,
    );
  }
  return dados as T;
}

// ------------------------------------------------------------ auth

export async function cadastrar(nome: string, email: string, senha: string): Promise<Sessao> {
  const dados = await pedir<{ token: string; usuario: Usuario }>('cadastro.php', {
    metodo: 'POST',
    corpo: { nome, email, senha },
  });
  const sessao: Sessao = { token: dados.token, usuario: dados.usuario };
  guardarSessao(sessao);
  return sessao;
}

export async function entrar(email: string, senha: string): Promise<Sessao> {
  const dados = await pedir<{ token: string; usuario: Usuario }>('login.php', {
    metodo: 'POST',
    corpo: { email, senha },
  });
  const sessao: Sessao = { token: dados.token, usuario: dados.usuario };
  guardarSessao(sessao);
  return sessao;
}

export async function carregarPerfil(): Promise<{ usuario: Usuario; resumo: ResumoPerfil }> {
  return pedir<{ usuario: Usuario; resumo: ResumoPerfil }>('perfil.php');
}

/**
 * Atualiza o perfil (nome e/ou avatar pré-definido).
 * Guarda na sessão local para o app refletir na hora.
 */
export async function atualizarPerfil(alteracoes: {
  nome?: string;
  avatar?: string | null;
}): Promise<Usuario> {
  const dados = await pedir<{ usuario: Usuario }>('perfil.php', {
    metodo: 'POST',
    corpo: alteracoes,
  });
  const sessao = lerSessao();
  if (sessao) {
    guardarSessao({ ...sessao, usuario: { ...sessao.usuario, ...dados.usuario } });
  }
  return dados.usuario;
}

// ------------------------------------------------------------ plantas

export async function listarPlantas(): Promise<PlantaHistorico[]> {
  const dados = await pedir<{ plantas: PlantaHistorico[] }>('plantas.php?acao=historico');
  return dados.plantas;
}

/** Salva a identificação (com foto, local e confiança) no servidor. */
export async function salvarPlantaNaNuvem(planta: PlantaParaSalvar): Promise<PlantaHistorico> {
  const dados = await pedir<{ planta: PlantaHistorico }>('plantas.php?acao=salvar', {
    metodo: 'POST',
    corpo: { ...planta, foto: await normalizarFoto(planta.foto) },
  });
  return dados.planta;
}

export async function removerPlantaDaNuvem(id: number): Promise<void> {
  await pedir('plantas.php?acao=remover', { metodo: 'POST', corpo: { id } });
}

// ------------------------------------------------------------ pastas

export async function listarPastas(): Promise<Pasta[]> {
  const dados = await pedir<{ pastas: Pasta[] }>('pastas.php?acao=lista');
  return dados.pastas;
}

export async function criarPasta(nome: string, idPastaPai: number | null): Promise<Pasta> {
  const dados = await pedir<{ pasta: Pasta }>('pastas.php?acao=criar', {
    metodo: 'POST',
    corpo: { nome, id_pasta_pai: idPastaPai },
  });
  return dados.pasta;
}

export async function removerPasta(id: number): Promise<void> {
  await pedir('pastas.php?acao=remover', { metodo: 'POST', corpo: { id } });
}

export async function plantasDaPasta(idPasta: number): Promise<PlantaHistorico[]> {
  const dados = await pedir<{ plantas: PlantaHistorico[] }>(
    `pasta_plantas.php?acao=listar&id_pasta=${idPasta}`,
  );
  return dados.plantas;
}

export async function addNaPasta(idPasta: number, idPlanta: number): Promise<void> {
  await pedir('pasta_plantas.php?acao=adicionar', {
    metodo: 'POST',
    corpo: { id_pasta: idPasta, id_planta: idPlanta },
  });
}

export async function removerDaPasta(idPasta: number, idPlanta: number): Promise<void> {
  await pedir('pasta_plantas.php?acao=remover', {
    metodo: 'POST',
    corpo: { id_pasta: idPasta, id_planta: idPlanta },
  });
}

// ------------------------------------------------------------ fotos

/**
 * Garante que a foto chegue como data URL (a API salva base64 no servidor).
 * Aceita data URL, URL http (ex.: foto vinda do servidor) ou caminho local.
 */
async function normalizarFoto(foto?: string | null): Promise<string | null> {
  if (!foto) return null;
  if (foto.startsWith('data:')) return foto;
  try {
    const resposta = await fetch(foto);
    const blob = await resposta.blob();
    return await new Promise<string | null>((resolve) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(String(leitor.result));
      leitor.onerror = () => resolve(null);
      leitor.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
