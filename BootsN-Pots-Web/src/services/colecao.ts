/**
 * Coleção do usuário.
 *
 * Guarda apenas METADADOS (nomes + referência da foto) no localStorage.
 * Os arquivos das fotos ficam na pasta privada do app (services/fotos.ts);
 * na web a foto fica como data URL junto do registro, com tratamento de
 * limite de espaço (remove a foto mais antiga se estourar).
 *
 * As imagens de plantas que o usuário NÃO fotografou são buscadas depois
 * pelo nome (services/wikipedia.ts) — nada de imagem pesada guardada.
 */

import { apagarFoto, abrirFoto, salvarFoto, novoIdFoto, type FotoSalva } from './fotos';

export interface PlantaSalva {
  nome: string;
  nomeCientifico: string;
  /** ISO date da inclusão. */
  salvoEm: string;
  /** Referência da foto tirada pelo usuário (pasta privada do app). */
  foto?: FotoSalva;
  /** Onde a planta foi encontrada (quando o aparelho permitiu). */
  latitude?: number | null;
  longitude?: number | null;
  localDescricao?: string | null;
}

const CHAVE_STORAGE = 'bootsnpots:colecao';

function ler(): PlantaSalva[] {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return [];
    const dados = JSON.parse(bruto);
    return Array.isArray(dados) ? (dados as PlantaSalva[]) : [];
  } catch {
    return [];
  }
}

/** Grava; se estourar o limite do navegador, descarta a foto mais antiga e tenta de novo. */
function gravar(lista: PlantaSalva[]): boolean {
  for (let tentativa = 0; tentativa < 8; tentativa++) {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(lista));
      return true;
    } catch {
      const comFotoData = lista
        .filter((planta) => planta.foto?.dataUrl)
        .sort((a, b) => a.salvoEm.localeCompare(b.salvoEm));
      if (comFotoData.length === 0) return false;
      comFotoData[0].foto = undefined;
    }
  }
  return false;
}

export function listarColecao(): PlantaSalva[] {
  return ler().sort((a, b) => b.salvoEm.localeCompare(a.salvoEm));
}

export function estaSalva(nomeCientifico: string): boolean {
  return ler().some((planta) => planta.nomeCientifico === nomeCientifico);
}

/**
 * Adiciona a planta (e a foto, quando informada) se ainda não existir.
 * Identidade: nome científico.
 */
export async function salvarPlanta(planta: {
  nome: string;
  nomeCientifico: string;
  foto?: string;
  latitude?: number | null;
  longitude?: number | null;
  localDescricao?: string | null;
}): Promise<boolean> {
  if (estaSalva(planta.nomeCientifico)) return false;

  const foto = planta.foto ? await salvarFoto(planta.foto, novoIdFoto()) : undefined;

  const lista = ler();
  lista.push({
    nome: planta.nome,
    nomeCientifico: planta.nomeCientifico,
    salvoEm: new Date().toISOString(),
    foto,
    latitude: planta.latitude ?? null,
    longitude: planta.longitude ?? null,
    localDescricao: planta.localDescricao ?? null,
  });
  gravar(lista);
  return true;
}

/** Remove a planta e apaga o arquivo da foto da pasta do app. */
export async function removerPlanta(nomeCientifico: string): Promise<void> {
  const lista = ler();
  const alvo = lista.find((planta) => planta.nomeCientifico === nomeCientifico);
  if (alvo?.foto) await apagarFoto(alvo.foto);
  gravar(lista.filter((planta) => planta.nomeCientifico !== nomeCientifico));
}

/** Abre a foto de uma planta salva como data URL (null se não houver/falhar). */
export async function abrirFotoDaColecao(planta: PlantaSalva): Promise<string | null> {
  if (!planta.foto) return null;
  return abrirFoto(planta.foto);
}
