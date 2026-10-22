import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Camera, Folder, User, Home as HomeIcon, Plus, X, MapPin } from 'lucide-react';
import type { ResultadoIdentificacao } from '../services/plantnet';
import type { InfoPlanta } from '../services/wikipedia';
import { buscarInfoPlanta } from '../services/wikipedia';
import { estaSalva, salvarPlanta, removerPlanta } from '../services/colecao';
import { logado, salvarPlantaNaNuvem, removerPlantaDaNuvem, ErroApi } from '../services/api';
import type { PlantaHistorico } from '../services/api';
import { obterLocalizacao } from '../services/local';
import './PlantDetail.css';

const tabs = ['Descrição', 'Usos', 'Dicas'];

const navItems = [
  { path: '/home', icon: HomeIcon, label: 'Início' },
  { path: '/search', icon: Search, label: 'Busca' },
  { path: '/camera', icon: Camera, label: 'Câmera', isCamera: true },
  { path: '/collection', icon: Folder, label: 'Coleção' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

/** Estado recebido via navegação (câmera → resultado, coleção → planta salva). */
interface EstadoPlanta {
  /** Foto tirada pelo usuário (data URL). */
  foto?: string;
  /** Resultado real da Pl@ntNet. */
  identificacao?: ResultadoIdentificacao;
  /** Planta vinda da coleção local (só nomes + local). */
  plantaSalva?: {
    nome: string;
    nomeCientifico: string;
    latitude?: number | null;
    longitude?: number | null;
    localDescricao?: string | null;
  };
  /** Planta vinda do histórico do usuário (modo nuvem, logado). */
  plantaNuvem?: PlantaHistorico;
}

/** Onde a planta foi encontrada (para exibir na tela). */
interface LocalExibido {
  latitude: number | null;
  longitude: number | null;
  descricao: string | null;
}

function mensagemDeErro(e: unknown): string {
  if (e instanceof ErroApi) return e.message;
  return 'Não deu para salvar agora — tente novamente.';
}

export default function PlantDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Descrição');
  const [infoWiki, setInfoWiki] = useState<InfoPlanta | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroAoSalvar, setErroAoSalvar] = useState<string | null>(null);

  const estado = (location.state ?? {}) as EstadoPlanta;
  const { foto, identificacao, plantaSalva, plantaNuvem } = estado;
  const temSessao = logado();

  const top = identificacao?.sugestoes[0];
  const ehDemo = !identificacao && !plantaSalva && !plantaNuvem;
  const nomeComum =
    top?.nomesComuns[0] ??
    plantaNuvem?.nome_comum ??
    plantaSalva?.nome ??
    identificacao?.melhorCorrespondencia ??
    'Hortelã-Pimenta';
  const nomeCientifico =
    top?.nomeSemAutor ?? plantaNuvem?.nome_cientifico ?? plantaSalva?.nomeCientifico ?? 'Mentha × piperita';
  const confianca = top ? Math.round(top.pontuacao * 100) : (plantaNuvem?.confianca ?? null);

  const [plantaNuvemSalva, setPlantaNuvemSalva] = useState<PlantaHistorico | null>(
    plantaNuvem ?? null,
  );
  const [salvaLocal, setSalvaLocal] = useState(() => estaSalva(nomeCientifico));
  const [localExibido, setLocalExibido] = useState<LocalExibido | null>(() => {
    if (plantaNuvem) {
      return {
        latitude: plantaNuvem.latitude,
        longitude: plantaNuvem.longitude,
        descricao: plantaNuvem.local_descricao,
      };
    }
    // Só mostra se a planta local realmente veio com localização
    if (plantaSalva && (plantaSalva.latitude != null || plantaSalva.localDescricao)) {
      return {
        latitude: plantaSalva.latitude ?? null,
        longitude: plantaSalva.longitude ?? null,
        descricao: plantaSalva.localDescricao ?? null,
      };
    }
    return null;
  });

  const [salvaDe, setSalvaDe] = useState(nomeCientifico);
  if (salvaDe !== nomeCientifico) {
    // Ajusta quando a planta muda sem desmontar a tela
    setSalvaDe(nomeCientifico);
    setSalvaLocal(estaSalva(nomeCientifico));
    setPlantaNuvemSalva(plantaNuvem ?? null);
  }

  const noNuvem = plantaNuvemSalva !== null;
  const salva = noNuvem || salvaLocal;

  // Imagem + descrição da espécie buscadas pelo NOME na Wikipédia (pt → en)
  useEffect(() => {
    let ativo = true;
    void buscarInfoPlanta([nomeComum, nomeCientifico]).then((info) => {
      if (ativo) setInfoWiki(info);
    });
    return () => {
      ativo = false;
    };
  }, [nomeComum, nomeCientifico]);

  const alternarColecao = async () => {
    if (salvando) return;
    setSalvando(true);
    setErroAoSalvar(null);
    try {
      if (noNuvem) {
        // Registrado no histórico do servidor: remove de lá
        await removerPlantaDaNuvem(plantaNuvemSalva.id);
        setPlantaNuvemSalva(null);
      } else if (salvaLocal) {
        await removerPlanta(nomeCientifico);
        setSalvaLocal(false);
      } else {
        // Salva com a LOCALIZAÇÃO de onde a planta foi encontrada
        const local = await obterLocalizacao();
        const descricao = local?.descricao ?? null;
        if (temSessao) {
          const nova = await salvarPlantaNaNuvem({
            nome_comum: nomeComum,
            nome_cientifico: nomeCientifico,
            confianca,
            foto: foto ?? null,
            latitude: local?.latitude ?? null,
            longitude: local?.longitude ?? null,
            local_descricao: descricao,
          });
          setPlantaNuvemSalva(nova);
          setLocalExibido({
            latitude: nova.latitude,
            longitude: nova.longitude,
            descricao: nova.local_descricao,
          });
        } else {
          await salvarPlanta({
            nome: nomeComum,
            nomeCientifico,
            foto,
            latitude: local?.latitude ?? null,
            longitude: local?.longitude ?? null,
            localDescricao: descricao,
          });
          setSalvaLocal(estaSalva(nomeCientifico));
          setLocalExibido({
            latitude: local?.latitude ?? null,
            longitude: local?.longitude ?? null,
            descricao,
          });
        }
      }
    } catch (e) {
      setErroAoSalvar(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  };

  // Foto do usuário > foto salva na nuvem > foto da espécie (Pl@ntNet) > pelo nome (Wikipédia)
  const imagemDaApi = identificacao?.imagens[0];
  const imagem = foto ?? plantaNuvemSalva?.foto_url ?? imagemDaApi?.url ?? infoWiki?.imagem ?? null;
  const creditoImagem = !foto && imagemDaApi ? imagemDaApi.credito : null;

  const temLocal = localExibido !== null;
  const linkMapa =
    temLocal && localExibido.latitude !== null && localExibido.longitude !== null
      ? `https://www.openstreetmap.org/?mlat=${localExibido.latitude}&mlon=${localExibido.longitude}#map=17/${localExibido.latitude}/${localExibido.longitude}`
      : null;

  return (
    <div className="detail-container">
      <div className="detail-scroll">
        <div className="detail-image">
          {imagem ? (
            <img src={imagem} alt={nomeComum} className="captured-photo" />
          ) : (
            <div className="plant-illustration">
              <svg viewBox="0 0 200 200" width="200" height="200">
                <rect width="200" height="200" fill="#e8f5e9" rx="20"/>
                <rect x="85" y="120" width="30" height="60" fill="#8d6e63" rx="5"/>
                <circle cx="100" cy="90" r="40" fill="#2e7d32"/>
                <circle cx="75" cy="100" r="25" fill="#388e3c"/>
                <circle cx="125" cy="100" r="25" fill="#388e3c"/>
                <circle cx="100" cy="70" r="30" fill="#43a047"/>
                <circle cx="65" cy="90" r="18" fill="#4caf50"/>
                <circle cx="135" cy="90" r="18" fill="#4caf50"/>
              </svg>
            </div>
          )}
          {creditoImagem && <span className="image-credit">{creditoImagem}</span>}
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} color="white" />
          </button>
        </div>

        <div className="detail-content">
          <div className="detail-header">
            <div>
              <h1 className="plant-name">{nomeComum}</h1>
              <p className="scientific-name">({nomeCientifico})</p>
            </div>
            {confianca !== null && (
              <span className="confidence-badge" title="Confiança da identificação">
                <strong>{confianca}%</strong>
                <small>confiança</small>
              </span>
            )}
          </div>

          <div className="tabs-container">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'Descrição' && (
              <div>
                {ehDemo ? (
                  <div>
                    <p className="description-text">
                      Planta aromática perene, consitituda, taliva e plana e comprimento...
                    </p>
                    <div className="info-section">
                      <h4 className="info-title">Como é Conhecida:</h4>
                      <p className="info-text">Menta, Hortelã, Piperrita.</p>
                    </div>
                    <div className="info-section">
                      <h4 className="info-title">Benefícios & Usos:</h4>
                      <p className="info-text">Digestivo natural, Alívio de dores...</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="description-text">
                      {infoWiki?.resumo ??
                        (confianca !== null
                          ? `${nomeComum} foi reconhecida na sua foto com ${confianca}% de confiança pelo serviço de identificação da Pl@ntNet.`
                          : `${nomeComum} está salva na sua coleção.`)}
                    </p>

                    <div className="info-section">
                      <h4 className="info-title">Como é Conhecida:</h4>
                      <p className="info-text">
                        {(top?.nomesComuns.length ? top.nomesComuns : [nomeComum]).join(', ')}
                      </p>
                    </div>

                    {top && (top.familia || top.genero) && (
                      <div className="info-section">
                        <h4 className="info-title">Classificação:</h4>
                        <p className="info-text">
                          {[top.genero ? `Gênero ${top.genero}` : '', top.familia ? `Família ${top.familia}` : '']
                            .filter((parte) => parte !== '')
                            .join(' · ')}
                        </p>
                      </div>
                    )}

                    {confianca !== null && (
                      <div className="info-section">
                        <h4 className="info-title">Confiança da Identificação:</h4>
                        <p className="info-text">
                          {confianca}% de chance nesta foto
                          {identificacao?.restante !== undefined &&
                            ` · ${identificacao.restante} identificações restantes hoje`}
                        </p>
                      </div>
                    )}

                    {identificacao && identificacao.sugestoes.length > 1 && (
                      <div className="info-section">
                        <h4 className="info-title">Outras possibilidades:</h4>
                        <ul className="suggestions-list">
                          {identificacao.sugestoes.slice(1, 5).map((sugestao) => (
                            <li key={sugestao.nomeCientifico}>
                              <span>{sugestao.nomeSemAutor}</span>
                              <span className="suggestion-score">
                                {Math.round(sugestao.pontuacao * 100)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {infoWiki && <p className="info-source">Fonte: Wikipédia ({infoWiki.fonte})</p>}
                  </div>
                )}

                {localExibido && (localExibido.latitude !== null || !!localExibido.descricao) && (
                  <div className="info-section location-section">
                    <h4 className="info-title">
                      <MapPin size={14} /> Onde foi encontrada:
                    </h4>
                    <p className="info-text">
                      {localExibido.descricao ??
                        (localExibido.latitude !== null && localExibido.longitude !== null
                          ? `${localExibido.latitude}, ${localExibido.longitude}`
                          : 'Local salvo')}
                      {linkMapa && (
                        <>
                          {' · '}
                          <a className="map-link" href={linkMapa} target="_blank" rel="noreferrer">
                            ver no mapa
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Usos' && (
              ehDemo ? (
                <div>
                  <h3 className="section-title">Hortelã-Pimenta - Usos & Receitas</h3>

                  <div className="recipe-card">
                    <div className="recipe-info">
                      <h4 className="recipe-name">Chá de Hortelã</h4>
                      <p className="recipe-desc">Receita simples e rápida</p>
                    </div>
                    <div className="recipe-image">
                      <MiniPlantIcon />
                    </div>
                  </div>

                  <div className="recipe-card">
                    <div className="recipe-info">
                      <h4 className="recipe-name">Receita: Mojito Sem Álcool</h4>
                      <p className="recipe-desc">Refresco com limão</p>
                    </div>
                    <div className="recipe-image">
                      <MiniPlantIcon />
                    </div>
                  </div>

                  <div className="recipe-card">
                    <div className="recipe-info">
                      <h4 className="recipe-name">Óleo Essencial</h4>
                      <p className="recipe-desc">Para aromaterapia</p>
                    </div>
                    <div className="recipe-image">
                      <MiniPlantIcon />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-note">
                  <p>Os usos e receitas desta espécie ainda não foram cadastrados no app.</p>
                </div>
              )
            )}

            {activeTab === 'Dicas' && (
              ehDemo ? (
                <p className="description-text">
                  Cultivo: Prefere sol parcial e solo úmido.<br/><br/>
                  Colheita: Colha as folhas antes da floração.<br/><br/>
                  Armazenamento: Seque as folhas à sombra.
                </p>
              ) : (
                <div className="empty-note">
                  <p>As dicas de cultivo desta espécie ainda não foram cadastradas no app.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="detail-bottom">
        {erroAoSalvar && <p className="save-error">{erroAoSalvar}</p>}
        <button
          className={`add-button${salva ? ' saved' : ''}`}
          onClick={() => void alternarColecao()}
          disabled={salvando}
        >
          {salvando ? (
            'Salvando...'
          ) : salva ? (
            <>
              <X size={18} /> Remover da Coleção
            </>
          ) : (
            <>
              <Plus size={18} /> Adicionar à Coleção
            </>
          )}
        </button>

        <div className="bottom-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/home' && location.pathname === '/plant-detail';

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
    </div>
  );
}

function MiniPlantIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <rect width="60" height="60" fill="#e8f5e9" rx="8"/>
      <rect x="25" y="35" width="10" height="15" fill="#8d6e63" rx="2"/>
      <circle cx="30" cy="25" r="12" fill="#2e7d32"/>
      <circle cx="20" cy="30" r="8" fill="#388e3c"/>
      <circle cx="40" cy="30" r="8" fill="#388e3c"/>
    </svg>
  );
}
