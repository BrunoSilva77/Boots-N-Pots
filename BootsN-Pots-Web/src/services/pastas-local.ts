/**
 * Pastas e SUBPASTAS no modo local (sem login) — espelho do que a API
 * faz no banco, mas guardado no localStorage.
 *
 * Identidade da planta nas relações: nome científico (é o que o modo
 * local tem de estável — ver services/colecao.ts).
 *
 * Na primeira execução já cria 3 pastas de exemplo com uma subpasta.
 */

import type { Pasta } from './api';

const CHAVE_PASTAS = 'bootsnpots:pastas-local';
const CHAVE_RELACOES = 'bootsnpots:pasta-plantas-local';

/** pastaId -> nomes científicos das plantas dentro dela. */
export type Relacoes = Record<number, string[]>;

interface PastaInterna {
  id: number;
  nome: string;
  idPai: number | null;
  criadoEm: string;
}

function agora(): string {
  return new Date().toISOString();
}

function lerPastas(): PastaInterna[] {
  try {
    const bruto = localStorage.getItem(CHAVE_PASTAS);
    if (!bruto) return [];
    const dados = JSON.parse(bruto);
    return Array.isArray(dados) ? (dados as PastaInterna[]) : [];
  } catch {
    return [];
  }
}

function gravarPastas(lista: PastaInterna[]): void {
  try {
    localStorage.setItem(CHAVE_PASTAS, JSON.stringify(lista));
  } catch {
    // storage indisponível
  }
}

export function listarRelacoes(): Relacoes {
  try {
    const bruto = localStorage.getItem(CHAVE_RELACOES);
    if (!bruto) return {};
    const dados = JSON.parse(bruto);
    return dados && typeof dados === 'object' ? (dados as Relacoes) : {};
  } catch {
    return {};
  }
}

function gravarRelacoes(relacoes: Relacoes): void {
  try {
    localStorage.setItem(CHAVE_RELACOES, JSON.stringify(relacoes));
  } catch {
    // storage indisponível
  }
}

/** Primeira execução: pastas de exemplo (com uma subpasta). */
function semearSeVazio(): void {
  if (localStorage.getItem(CHAVE_PASTAS) !== null) return;

  const pastas: PastaInterna[] = [
    { id: 1, nome: 'Minhas Plantas', idPai: null, criadoEm: agora() },
    { id: 2, nome: 'Favoritas', idPai: null, criadoEm: agora() },
    { id: 3, nome: 'Medicinais', idPai: null, criadoEm: agora() },
    { id: 4, nome: 'Chás', idPai: 3, criadoEm: agora() }, // subpasta de exemplo
  ];
  const relacoes: Relacoes = {
    1: ['Ocimum basilicum', 'Mentha haplocalyx', 'Salvia rosmarinus'],
    2: ['Lavandula angustifolia'],
    3: ['Salvia rosmarinus', 'Mentha haplocalyx'],
    4: ['Mentha haplocalyx', 'Ocimum basilicum'],
  };
  gravarPastas(pastas);
  gravarRelacoes(relacoes);
}

/** Lista no MESMO formato da API (com contagens), para a UI usar igual. */
export function listarPastas(): Pasta[] {
  semearSeVazio();
  const internas = lerPastas();
  const relacoes = listarRelacoes();

  return internas.map((pasta) => ({
    id: pasta.id,
    nome: pasta.nome,
    id_pasta_pai: pasta.idPai,
    total_plantas: (relacoes[pasta.id] ?? []).length,
    total_subpastas: internas.filter((outra) => outra.idPai === pasta.id).length,
  }));
}

export function criar(nome: string, idPastaPai: number | null): Pasta {
  semearSeVazio();
  const internas = lerPastas();
  const id =
    internas.reduce((maior, pasta) => Math.max(maior, pasta.id), 0) + 1;
  internas.push({ id, nome, idPai: idPastaPai, criadoEm: agora() });
  gravarPastas(internas);

  const relacoes = listarRelacoes();
  relacoes[id] = relacoes[id] ?? [];
  gravarRelacoes(relacoes);

  return { id, nome, id_pasta_pai: idPastaPai, total_plantas: 0, total_subpastas: 0 };
}

/** Remove a pasta, as SUBPASTAS (recursivo) e as relações. Plantas ficam. */
export function remover(id: number): void {
  semearSeVazio();
  const internas = lerPastas();

  const paraRemover = new Set<number>();
  const coletar = (alvo: number) => {
    paraRemover.add(alvo);
    internas.filter((p) => p.idPai === alvo).forEach((filha) => coletar(filha.id));
  };
  coletar(id);

  gravarPastas(internas.filter((pasta) => !paraRemover.has(pasta.id)));

  const relacoes = listarRelacoes();
  paraRemover.forEach((pastaId) => delete relacoes[pastaId]);
  gravarRelacoes(relacoes);
}

/** Adiciona/remove a planta na pasta (toggle). */
export function alternarPlanta(idPasta: number, nomeCientifico: string): void {
  semearSeVazio();
  const relacoes = listarRelacoes();
  const dentro = relacoes[idPasta] ?? [];
  const novo =
    dentro.includes(nomeCientifico)
      ? dentro.filter((nome) => nome !== nomeCientifico)
      : [...dentro, nomeCientifico];
  relacoes[idPasta] = novo;
  gravarRelacoes(relacoes);
}
