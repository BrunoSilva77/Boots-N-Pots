import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Camera,
  Folder,
  User,
  Home as HomeIcon,
  Plus,
  Search as SearchIcon,
  FolderPlus,
  Trash2,
  MapPin,
  Check,
} from 'lucide-react';
import * as api from '../services/api';
import type { Pasta, PlantaHistorico } from '../services/api';
import * as pastasLocal from '../services/pastas-local';
import { listarColecao, abrirFotoDaColecao, type PlantaSalva } from '../services/colecao';
import { buscarInfoPlanta } from '../services/wikipedia';
import './Collection.css';

/** Exemplos do modo demonstração (sem login) — viram plantas clicáveis. */
const recentPlants = [
  { id: 'manjericao', name: 'Manjericão', scientificName: 'Ocimum basilicum' },
  { id: 'lavanda', name: 'Lavanda', scientificName: 'Lavandula angustifolia' },
  { id: 'hortela', name: 'Hortelã', scientificName: 'Mentha haplocalyx' },
  { id: 'alecrim', name: 'Alecrim', scientificName: 'Salvia rosmarinus' },
];

const navItems = [
  { path: '/home', icon: HomeIcon, label: 'Início' },
  { path: '/search', icon: SearchIcon, label: 'Busca' },
  { path: '/camera', icon: Camera, label: 'Câmera', isCamera: true },
  { path: '/collection', icon: Folder, label: 'Coleção' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

function mensagemDe(e: unknown): string {
  if (e instanceof api.ErroApi) return e.message;
  return 'Falha de conexão com o servidor.';
}

/** Id estável para plantas locais (chaves do React e comparações). */
function idEstavel(texto: string): number {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = (hash * 31 + texto.charCodeAt(i)) | 0;
  }
  return hash;
}

export default function Collection() {
  const navigate = useNavigate();
  const location = useLocation();
  const temSessao = api.logado();

  // ------------------------------------------------------- modo nuvem
  const [plantasNuvem, setPlantasNuvem] = useState<PlantaHistorico[]>([]);
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [pastaAtual, setPastaAtual] = useState<Pasta | null>(null);
  const [plantasNaPasta, setPlantasNaPasta] = useState<PlantaHistorico[]>([]);
  const [adicionando, setAdicionando] = useState(false);
  const [carregando, setCarregando] = useState(temSessao);
  const [erro, setErro] = useState<string | null>(null);

  // -------------------------------------------------- modo local (s/ login)
  const [salvas] = useState<PlantaSalva[]>(() => (temSessao ? [] : listarColecao()));
  const [pastasLocais, setPastasLocais] = useState<Pasta[]>(() =>
    temSessao ? [] : pastasLocal.listarPastas(),
  );
  const [relacoes, setRelacoes] = useState<pastasLocal.Relacoes>(() =>
    temSessao ? {} : pastasLocal.listarRelacoes(),
  );

  // ----------------------------------------------------------- imagens
  const [fotosLocais, setFotosLocais] = useState<Record<string, string>>({});
  const [imagensWiki, setImagensWiki] = useState<Record<string, string>>({});

  // ------------------------------------------------------ carregamento

  const carregarBase = useCallback(async () => {
    if (!temSessao) {
      setCarregando(false);
      return;
    }
    try {
      const [plantas, lista] = await Promise.all([api.listarPlantas(), api.listarPastas()]);
      setPlantasNuvem(plantas);
      setPastas(lista);
      setErro(null);
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setCarregando(false);
    }
  }, [temSessao]);

  useEffect(() => {
    void carregarBase();
  }, [carregarBase]);

  const recarregar = useCallback(async () => {
    if (temSessao) {
      await carregarBase();
    } else {
      setPastasLocais(pastasLocal.listarPastas());
      setRelacoes(pastasLocal.listarRelacoes());
    }
  }, [temSessao, carregarBase]);

  // Plantas da pasta aberta (modo nuvem)
  useEffect(() => {
    if (!temSessao || !pastaAtual) {
      setPlantasNaPasta([]);
      return;
    }
    let ativo = true;
    void api
      .plantasDaPasta(pastaAtual.id)
      .then((lista) => {
        if (ativo) {
          setPlantasNaPasta(lista);
          setErro(null);
        }
      })
      .catch((e: unknown) => {
        if (ativo) setErro(mensagemDe(e));
      });
    return () => {
      ativo = false;
    };
  }, [temSessao, pastaAtual]);

  // Fotos tiradas pelo usuário (pasta privada do app)
  useEffect(() => {
    let ativo = true;
    salvas.forEach((planta) => {
      if (!planta.foto) return;
      void abrirFotoDaColecao(planta).then((foto) => {
        if (ativo && foto) {
          setFotosLocais((anterior) => ({ ...anterior, [planta.nomeCientifico]: foto }));
        }
      });
    });
    return () => {
      ativo = false;
    };
  }, [salvas]);

  // --------------------------------------------------- plantas visíveis

  /** Plantas do modo local: salvas (coleção) + exemplos, no formato da nuvem. */
  const plantasLocal = useMemo<PlantaHistorico[]>(() => {
    const deColecao: PlantaHistorico[] = salvas.map((planta) => ({
      id: idEstavel(planta.nomeCientifico),
      nome_comum: planta.nome,
      nome_cientifico: planta.nomeCientifico,
      confianca: null,
      foto_url: fotosLocais[planta.nomeCientifico] ?? null,
      latitude: planta.latitude ?? null,
      longitude: planta.longitude ?? null,
      local_descricao: planta.localDescricao ?? null,
      achado_em: planta.salvoEm,
      pastas_ids: [],
    }));
    const deExemplo: PlantaHistorico[] = recentPlants.map((planta) => ({
      id: idEstavel(planta.scientificName),
      nome_comum: planta.name,
      nome_cientifico: planta.scientificName,
      confianca: null,
      foto_url: null,
      latitude: null,
      longitude: null,
      local_descricao: null,
      achado_em: '',
      pastas_ids: [],
    }));
    return [...deColecao, ...deExemplo];
  }, [salvas, fotosLocais]);

  const pastasVisiveis = temSessao ? pastas : pastasLocais;
  const plantasBase = temSessao ? plantasNuvem : plantasLocal;

  const raizes = useMemo(
    () => pastasVisiveis.filter((p) => p.id_pasta_pai === null),
    [pastasVisiveis],
  );
  const subpastas = useMemo(
    () => (pastaAtual ? pastasVisiveis.filter((p) => p.id_pasta_pai === pastaAtual.id) : []),
    [pastasVisiveis, pastaAtual],
  );
  const caminho = useMemo(
    () => (pastaAtual ? caminhoAte(pastaAtual, pastasVisiveis) : []),
    [pastaAtual, pastasVisiveis],
  );

  const plantasExibidas = useMemo(() => {
    if (!pastaAtual) return plantasBase;
    if (temSessao) return plantasNaPasta;
    const chaves = relacoes[pastaAtual.id] ?? [];
    return plantasBase.filter((planta) => chaves.includes(planta.nome_cientifico));
  }, [pastaAtual, temSessao, plantasBase, plantasNaPasta, relacoes]);

  const disponiveis = useMemo(
    () =>
      pastaAtual
        ? plantasBase.filter(
            (planta) => !plantasExibidas.some((dentro) => dentro.id === planta.id),
          )
        : [],
    [pastaAtual, plantasBase, plantasExibidas],
  );

  // Imagens buscadas pelo NOME (Wikipédia) para quem não tem foto própria
  const faltandoImagem = useMemo(() => {
    const mapa = new Map<string, { nome: string; cientifico: string }>();
    const querer = (planta: PlantaHistorico) => {
      if (planta.foto_url || imagensWiki[planta.nome_cientifico] !== undefined) return;
      if (mapa.has(planta.nome_cientifico)) return;
      mapa.set(planta.nome_cientifico, {
        nome: planta.nome_comum,
        cientifico: planta.nome_cientifico,
      });
    };
    plantasBase.forEach(querer);
    plantasExibidas.forEach(querer);
    return [...mapa.values()];
  }, [plantasBase, plantasExibidas, imagensWiki]);

  useEffect(() => {
    let ativo = true;
    faltandoImagem.forEach(({ nome, cientifico }) => {
      void buscarInfoPlanta([nome, cientifico]).then((info) => {
        if (ativo) {
          setImagensWiki((anterior) => ({ ...anterior, [cientifico]: info?.imagem ?? '' }));
        }
      });
    });
    return () => {
      ativo = false;
    };
  }, [faltandoImagem]);

  // ------------------------------------------------------- ações

  const novaPasta = async (pai: Pasta | null) => {
    const nome = window.prompt(
      pai ? `Nome da subpasta (dentro de "${pai.nome}")` : 'Nome da nova coleção',
    );
    if (!nome || nome.trim() === '') return;
    try {
      if (temSessao) {
        await api.criarPasta(nome.trim(), pai ? pai.id : null);
      } else {
        pastasLocal.criar(nome.trim(), pai ? pai.id : null);
      }
      await recarregar();
      setErro(null);
    } catch (e) {
      setErro(mensagemDe(e));
    }
  };

  const apagarPasta = async (pasta: Pasta) => {
    const ok = window.confirm(
      `Apagar a pasta "${pasta.nome}" e suas subpastas?\nAs plantas continuam no seu histórico.`,
    );
    if (!ok) return;
    try {
      if (temSessao) {
        await api.removerPasta(pasta.id);
      } else {
        pastasLocal.remover(pasta.id);
      }
      if (pastaAtual && caminho.some((c) => c.id === pasta.id)) {
        setPastaAtual(null);
      }
      setAdicionando(false);
      await recarregar();
      setErro(null);
    } catch (e) {
      setErro(mensagemDe(e));
    }
  };

  const alternarNaPasta = async (planta: PlantaHistorico) => {
    if (!pastaAtual) return;
    const dentro = plantasExibidas.some((p) => p.id === planta.id);
    try {
      if (temSessao) {
        if (dentro) {
          await api.removerDaPasta(pastaAtual.id, planta.id);
        } else {
          await api.addNaPasta(pastaAtual.id, planta.id);
        }
        setPlantasNaPasta(await api.plantasDaPasta(pastaAtual.id));
        await carregarBase(); // atualiza contagens
      } else {
        pastasLocal.alternarPlanta(pastaAtual.id, planta.nome_cientifico);
        setRelacoes(pastasLocal.listarRelacoes());
        setPastasLocais(pastasLocal.listarPastas());
      }
      setErro(null);
    } catch (e) {
      setErro(mensagemDe(e));
    }
  };

  /** Card → tela DA PLANTA (identificação salva, salva local ou exemplo). */
  const abrirPlanta = (planta: PlantaHistorico) => {
    if (temSessao) {
      navigate('/plant-detail', {
        state: { plantaNuvem: planta, foto: planta.foto_url ?? undefined },
      });
    } else {
      navigate('/plant-detail', {
        state: {
          plantaSalva: {
            nome: planta.nome_comum,
            nomeCientifico: planta.nome_cientifico,
            latitude: planta.latitude,
            longitude: planta.longitude,
            localDescricao: planta.local_descricao,
          },
          foto: planta.foto_url ?? undefined,
        },
      });
    }
  };

  const card = (planta: PlantaHistorico) => {
    const imagem =
      fotosLocais[planta.nome_cientifico] ||
      planta.foto_url ||
      imagensWiki[planta.nome_cientifico] ||
      undefined;
    return (
      <div key={`n${planta.id}`} className="recent-card" onClick={() => abrirPlanta(planta)}>
        <div className="recent-image" style={{ backgroundColor: '#e8f5e9' }}>
          {imagem ? (
            <img src={imagem} alt={planta.nome_comum} className="recent-photo" />
          ) : (
            <PlantIcon />
          )}
          {planta.latitude !== null && (
            <span className="card-pin" title="Local salvo">
              <MapPin size={12} color="#fff" />
            </span>
          )}
        </div>
        <p>{planta.nome_comum}</p>
        {!temSessao && salvas.some((s) => s.nomeCientifico === planta.nome_cientifico) && (
          <span className="saved-tag">Sua foto</span>
        )}
      </div>
    );
  };

  const carregandoTudo = temSessao && carregando;

  return (
    <div className="collection-container">
      <div className="collection-scroll">
        <div className="collection-header">
          <h1>Minha Coleção</h1>
        </div>

        {erro && <p className="sync-banner error">{erro}</p>}

        {!temSessao && (
          <p className="sync-banner">
            Modo local — entre na sua conta para sincronizar plantas, pastas e localizações.{' '}
            <button className="sync-link" onClick={() => navigate('/login')}>
              Entrar
            </button>
          </p>
        )}

        {carregandoTudo && <p className="sync-banner">Carregando sua coleção...</p>}

        {!carregandoTudo && (
          <>
            {/* Trilha de navegação: Coleção / pasta / subpasta */}
            {pastaAtual && (
              <nav className="breadcrumb">
                <button
                  className="crumb"
                  onClick={() => {
                    setPastaAtual(null);
                    setAdicionando(false);
                  }}
                >
                  <Folder size={14} /> Coleção
                </button>
                {caminho.map((etapa) => (
                  <span className="crumb-group" key={etapa.id}>
                    <span className="crumb-sep">/</span>
                    <button
                      className={`crumb ${etapa.id === pastaAtual.id ? 'current' : ''}`}
                      onClick={() => {
                        setAdicionando(false);
                        setPastaAtual(etapa);
                      }}
                    >
                      {etapa.nome}
                    </button>
                  </span>
                ))}
              </nav>
            )}

            {/* Pastas / SUBPASTAS */}
            <div className="collections-section">
              <div className="section-head">
                <h2 className="section-title">
                  {pastaAtual ? 'Subpastas' : 'Coleções'}
                </h2>
                <div className="section-actions">
                  <button className="pill-button" onClick={() => void novaPasta(pastaAtual)}>
                    <FolderPlus size={14} /> {pastaAtual ? 'Subpasta' : 'Nova coleção'}
                  </button>
                  {pastaAtual && (
                    <button
                      className="pill-button danger"
                      onClick={() => void apagarPasta(pastaAtual)}
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                  )}
                </div>
              </div>

              <div className="collections-grid">
                {(pastaAtual ? subpastas : raizes).map((pasta) => (
                  <div
                    key={pasta.id}
                    className="collection-card clickable"
                    onClick={() => {
                      setAdicionando(false);
                      setPastaAtual(pasta);
                    }}
                  >
                    <Folder size={28} color="#2d7d46" />
                    <div className="collection-info">
                      <h3>{pasta.nome}</h3>
                      <p>
                        {pasta.total_plantas} planta{pasta.total_plantas === 1 ? '' : 's'}
                        {pasta.total_subpastas > 0 &&
                          ` · ${pasta.total_subpastas} subpasta${
                            pasta.total_subpastas === 1 ? '' : 's'
                          }`}
                      </p>
                    </div>
                  </div>
                ))}
                {(pastaAtual ? subpastas : raizes).length === 0 && (
                  <p className="empty-note">
                    {pastaAtual
                      ? 'Nenhuma subpasta ainda — crie uma acima.'
                      : 'Nenhuma pasta ainda — crie sua primeira coleção.'}
                  </p>
                )}
              </div>
            </div>

            {/* Plantas */}
            <div className="recent-section">
              <div className="section-head">
                <h2 className="section-title">
                  {pastaAtual ? pastaAtual.nome : 'Adicionadas Recentemente'}
                </h2>
                {pastaAtual && (
                  <button
                    className={`pill-button ${adicionando ? 'active' : ''}`}
                    onClick={() => setAdicionando((a) => !a)}
                  >
                    {adicionando ? (
                      <>
                        <Check size={14} /> Concluir
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Plantas
                      </>
                    )}
                  </button>
                )}
              </div>

              {plantasExibidas.length === 0 && !adicionando && (
                <p className="empty-note">
                  {pastaAtual
                    ? 'Esta pasta ainda está vazia — toque em "Plantas" para adicionar.'
                    : 'Suas plantas aparecem aqui.'}
                </p>
              )}

              <div className="recent-grid">
                {plantasExibidas.map((planta) => card(planta))}
              </div>

              {/* Modo "adicionar/remover plantas desta pasta" */}
              {pastaAtual && adicionando && (
                <div className="available-list">
                  <p className="available-title">Toque nas plantas para mover para esta pasta:</p>
                  {plantasExibidas.map((planta) => (
                    <button
                      key={`sel-${planta.id}`}
                      className="available-item"
                      onClick={() => void alternarNaPasta(planta)}
                    >
                      <span className="available-name">
                        <strong>{planta.nome_comum}</strong>
                        <small>{planta.nome_cientifico}</small>
                      </span>
                      <Check size={16} color="#2d7d46" />
                    </button>
                  ))}
                  {disponiveis.map((planta) => (
                    <button
                      key={`disp-${planta.id}`}
                      className="available-item muted"
                      onClick={() => void alternarNaPasta(planta)}
                    >
                      <span className="available-name">
                        <strong>{planta.nome_comum}</strong>
                        <small>{planta.nome_cientifico}</small>
                      </span>
                      <Plus size={16} color="#999" />
                    </button>
                  ))}
                  {plantasExibidas.length === 0 && disponiveis.length === 0 && (
                    <p className="empty-note">Nenhuma planta disponível ainda.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === location.pathname;

          return (
            <button
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''} ${item.isCamera ? 'camera-button' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <div className={item.isCamera ? 'camera-circle' : 'nav-circle'}>
                <Icon size={24} color={item.isCamera || isActive ? 'white' : undefined} />
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Trilha da raiz até a pasta informada. */
function caminhoAte(pasta: Pasta, todas: Pasta[]): Pasta[] {
  const trilha = [pasta];
  let atual = pasta;
  while (atual.id_pasta_pai !== null) {
    const pai = todas.find((p) => p.id === atual.id_pasta_pai);
    if (!pai) break;
    trilha.unshift(pai);
    atual = pai;
  }
  return trilha;
}

function PlantIcon() {
  return (
    <svg viewBox="0 0 50 50" width="50" height="50">
      <rect x="20" y="28" width="10" height="15" fill="#8d6e63" rx="2"/>
      <circle cx="25" cy="18" r="10" fill="#4caf50"/>
      <circle cx="18" cy="22" r="7" fill="#66bb6a"/>
      <circle cx="32" cy="22" r="7" fill="#66bb6a"/>
    </svg>
  );
}
