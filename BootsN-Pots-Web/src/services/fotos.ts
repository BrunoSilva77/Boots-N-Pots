/**
 * Fotos tiradas pelo usuário na Coleção.
 *
 * - Android (app): salva em `fotos/` dentro do DIRETÓRIO PRIVADO do app
 *   (Directory.Data → /data/data/<pacote>/files/fotos/). Nada vai pra
 *   galeria do celular nem ocupa o espaço visível do usuário.
 * - Navegador (web): guarda a data URL junto da coleção (localStorage),
 *   com limite de espaço tratado em services/colecao.ts.
 *
 * Toda foto é reescalada para no máx. 1024px/JPEG 82% antes de salvar,
 * mantendo a pasta pequena e a galeria rápida de carregar.
 */

import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

const PASTORA = 'fotos';
const isNative = Capacitor.isNativePlatform();

/** Referência de uma foto armazenada (arquivo no app ou data URL na web). */
export interface FotoSalva {
  /** Caminho relativo à pasta privada do app (Android). */
  caminho?: string;
  /** data URL direta (navegador). */
  dataUrl?: string;
}

/** Gera um id único para o arquivo da foto. */
export function novoIdFoto(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Salva a foto capturada (data URL) e devolve a referência.
 * Retorna undefined se o armazenamento falhar (nesse caso a planta
 * é salva só com o nome e a imagem vem da internet depois).
 */
export async function salvarFoto(foto: string, id: string): Promise<FotoSalva | undefined> {
  const otimizada = await otimizarImagem(foto);

  if (!isNative) {
    return { dataUrl: otimizada };
  }

  const caminho = `${PASTORA}/${id}.jpg`;
  const base64 = otimizada.replace(/^data:image\/\w+;base64,/, '');
  try {
    await Filesystem.writeFile({
      path: caminho,
      data: base64,
      directory: Directory.Data,
    });
    return { caminho };
  } catch {
    return undefined;
  }
}

/** Abre uma foto salva como data URL (para exibir na tela). */
export async function abrirFoto(foto: FotoSalva): Promise<string | null> {
  if (foto.dataUrl) return foto.dataUrl;
  if (foto.caminho) {
    try {
      // Sem `encoding`, o plugin devolve o conteúdo já em base64.
      const { data } = await Filesystem.readFile({
        path: foto.caminho,
        directory: Directory.Data,
      });
      return `data:image/jpeg;base64,${data}`;
    } catch {
      return null;
    }
  }
  return null;
}

/** Apaga o arquivo da foto da pasta privada do app. */
export async function apagarFoto(foto: FotoSalva): Promise<void> {
  if (!foto.caminho) return;
  try {
    await Filesystem.deleteFile({ path: foto.caminho, directory: Directory.Data });
  } catch {
    // arquivo já não existia
  }
}

/** Reduz a foto para no máx. 1024px de lado (JPEG 82%) para não inflar a pasta. */
async function otimizarImagem(dataUrl: string, ladoMax = 1024): Promise<string> {
  try {
    const imagem = await carregarImagem(dataUrl);
    let { width, height } = imagem;
    if (width > ladoMax || height > ladoMax) {
      const escala = ladoMax / Math.max(width, height);
      width = Math.round(width * escala);
      height = Math.round(height * escala);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const contexto = canvas.getContext('2d');
    if (!contexto) return dataUrl;
    contexto.drawImage(imagem, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return dataUrl;
  }
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error('falha ao carregar imagem'));
    imagem.src = src;
  });
}
