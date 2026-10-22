/**
 * Lembretes de rega/cuidado das plantas.
 *
 * Guardados no dispositivo (localStorage) e disparados por uma rotina que
 * roda enquanto o app está aberto — usa a Web Notification API quando o
 * usuário autoriza (funciona no navegador e na webview do APK).
 *
 * Cada lembrete: { id, titulo, mensagem, quando (ms desde epoch), repetir }
 * Quando "repetir" for positivo, após disparar ele se reagenda para +repetir.
 */

import { ErroApi } from './api';

export interface Lembrete {
  id: string;
  idPlanta: number;  // identifica a planta (posição na coleção local)
  titulo: string;   // nome da planta
  mensagem: string; // "Hora de regar sua Manjericão 💧"
  quando: number;   // epoch em ms
  repetir: number;  // ms entre repetições (0 = só uma vez)
}

const CHAVE = 'bootsnpots:lembretes';
const CHAVE_PERMISSAO = 'bootsnpots:notific-permissao';

// ------------------------------------------------------------ permissão

/** Pede autorização para mostrar notificações (se o suportar). */
export async function pedirPermissao(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const permissao = await Notification.requestPermission();
    localStorage.setItem(CHAVE_PERMISSAO, permissao);
    return permissao === 'granted';
  } catch {
    return false;
  }
}

/** Já temos permissão de notificação? */
export function temPermissao(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

// ------------------------------------------------------------ guardar

/** Lê todos os lembretes do dispositivo. */
export function listarLembretes(): Lembrete[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as Lembrete[]) : [];
  } catch {
    return [];
  }
}

function salvar(lembretes: Lembrete[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lembretes));
  } catch {
    // storage indisponível
  }
}

/** Gera um id único simples. */
function novoId(): string {
  return `l_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ------------------------------------------------------------ criar / apagar

/**
 * Cria um lembrete para uma planta.
 * @param dias Em quantos dias o primeiro aviso deve tocar.
 * @param repetirDias Se > 0, repete a cada N dias.
 */
export async function criarLembrete(
  idPlanta: number,
  titulo: string,
  mensagem: string,
  dias: number,
  repetirDias = 0,
): Promise<Lembrete> {
  // Precisa de permissão para conseguir avisar de verdade.
  const ok = await pedirPermissao();
  if (!ok) {
    throw new ErroApi(
      'Autorize as notificações nas configurações do navegador/aparelho para receber lembretes.',
    );
  }

  const agora = Date.now();
  const lembrete: Lembrete = {
    id: novoId(),
    idPlanta,
    titulo,
    mensagem,
    quando: agora + Math.round(dias * 86400000),
    repetir: Math.round(repetirDias * 86400000),
  };

  const lembretes = listarLembretes();
  lembretes.push(lembrete);
  salvar(lembretes);
  return lembrete;
}

/** Apaga um lembrete pelo id. */
export function removerLembrete(id: string): void {
  salvar(listarLembretes().filter((l) => l.id !== id));
}

// ------------------------------------------------------------ disparo

/** Mostra a notificação (best-effort). */
function avisar(titulo: string, mensagem: string): void {
  if (!temPermissao()) return;
  try {
    new Notification(titulo, { body: mensagem, icon: '/logoTCC.png', tag: titulo });
  } catch {
    // webview pode bloquear; ignora
  }
}

/**
 * Verifica os lembretes vencidos e dispara os avisos.
 * Reagenda os que se repetem. Devolve quantos avisos tocou.
 */
export function verificarLembretes(): number {
  const agora = Date.now();
  const lembretes = listarLembretes();
  const aindaAtivos: Lembrete[] = [];
  let disparados = 0;

  for (const lembrete of lembretes) {
    if (lembrete.quando > agora) {
      aindaAtivos.push(lembrete);
      continue;
    }
    avisar(`🌱 ${lembrete.titulo}`, lembrete.mensagem);
    disparados++;
    if (lembrete.repetir > 0) {
      // reagenda para a próxima ocorrência futura
      let proximo = lembrete.quando;
      while (proximo <= agora) proximo += lembrete.repetir;
      aindaAtivos.push({ ...lembrete, quando: proximo });
    }
  }

  if (disparados > 0) salvar(aindaAtivos);
  return disparados;
}

// ------------------------------------------------------------ rotina

let rotina: number | null = null;

/**
 * Liga a rotina que checa lembretes de tempos em tempos.
 * Chamar uma vez ao abrir o app. Devolve a função para desligar.
 */
export function iniciarVerificacao(): () => void {
  if (rotina !== null) window.clearInterval(rotina);
  // checa imediatamente e depois a cada 30s
  verificarLembretes();
  rotina = window.setInterval(() => {
    verificarLembretes();
  }, 30000);
  return () => {
    if (rotina !== null) window.clearInterval(rotina);
    rotina = null;
  };
}
