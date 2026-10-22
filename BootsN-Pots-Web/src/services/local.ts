/**
 * Localização de onde a planta foi encontrada.
 *
 * 1) Pede a posição do aparelho (Geolocation API)
 * 2) Converte em endereço aproximado (Nominatim/OpenStreetMap, grátis)
 * Falha em qualquer etapa => null (a planta é salva sem local mesmo assim).
 *
 * Obs.: em http:// puro (fora de localhost) os navegadores bloqueiam
 * geolocalização — no app Android (Capacitor) o origin é https://localhost
 * e funciona normalmente.
 */

export interface Local {
  latitude: number;
  longitude: number;
  descricao: string | null;
}

export function obterLocalizacao(): Promise<Local | null> {
  if (!('geolocation' in navigator)) return Promise.resolve(null);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (posicao) => {
        const latitude = arredondar(posicao.coords.latitude);
        const longitude = arredondar(posicao.coords.longitude);
        const descricao = await descricaoDoEndereco(latitude, longitude);
        resolve({ latitude, longitude, descricao });
      },
      () => resolve(null),
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true },
    );
  });
}

async function descricaoDoEndereco(latitude: number, longitude: number): Promise<string | null> {
  try {
    const controle = new AbortController();
    const tempo = setTimeout(() => controle.abort(), 5000);
    const resposta = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
        `&lat=${latitude}&lon=${longitude}&zoom=14&accept-language=pt-BR`,
      { signal: controle.signal },
    );
    clearTimeout(tempo);
    if (!resposta.ok) return null;

    const dados = (await resposta.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const enderecos = dados.address ?? {};
    const partes = [
      enderecos.road ?? enderecos.neighbourhood ?? enderecos.suburb ?? enderecos.hamlet,
      enderecos.city ?? enderecos.town ?? enderecos.village ?? enderecos.state,
    ].filter((parte): parte is string => !!parte);

    const texto = partes.length > 0 ? partes.join(' - ') : dados.display_name;
    return texto ? String(texto).slice(0, 200) : null;
  } catch {
    return null;
  }
}

/** DECIMAL(10,7) no banco: 7 casas decimais bastam (~1cm). */
function arredondar(valor: number): number {
  return Math.round(valor * 1e7) / 1e7;
}
