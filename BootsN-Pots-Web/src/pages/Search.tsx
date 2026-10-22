import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Search as SearchIcon,
  Camera,
  Folder,
  User,
  Home as HomeIcon,
  Loader2,
} from 'lucide-react';
import { buscarPlantas, type ResultadoBusca, type CategoriaBusca } from '../services/wikipedia';
import './Search.css';

/** Filtros dos resultados (categoria vinda da classificação). */
const filtros: Array<{ valor: CategoriaBusca | 'todas'; rotulo: string }> = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'planta', rotulo: 'Plantas' },
  { valor: 'medicinal', rotulo: 'Medicinais' },
  { valor: 'culinaria', rotulo: 'Culinárias' },
  { valor: 'aromatica', rotulo: 'Aromáticas' },
  { valor: 'receita', rotulo: 'Receitas' },
];

const rotulos: Record<CategoriaBusca, string> = {
  planta: 'Planta',
  receita: 'Receita',
  medicinal: 'Medicinal',
  culinaria: 'Culinária',
  aromatica: 'Aromática',
};

const navItems = [
  { path: '/home', icon: HomeIcon, label: 'Início' },
  { path: '/search', icon: SearchIcon, label: 'Busca' },
  { path: '/camera', icon: Camera, label: 'Câmera', isCamera: true },
  { path: '/collection', icon: Folder, label: 'Coleção' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [buscou, setBuscou] = useState(false);
  const [filtro, setFiltro] = useState<CategoriaBusca | 'todas'>('todas');
  const sequencia = useRef(0);

  // Debounce: espera o usuário parar de digitar (450ms) antes de buscar
  useEffect(() => {
    const consulta = termo.trim();
    const id = ++sequencia.current;

    if (consulta.length < 2) {
      setResultados([]);
      setCarregando(false);
      setBuscou(false);
      setErro(null);
      return;
    }

    setCarregando(true);
    const atraso = setTimeout(() => {
      void buscarPlantas(consulta)
        .then((achados) => {
          if (sequencia.current !== id) return; // resposta velha: descarta
          setResultados(achados);
          setBuscou(true);
          setErro(null);
        })
        .catch(() => {
          if (sequencia.current !== id) return;
          setErro('Não deu para buscar agora — verifique a conexão.');
        })
        .finally(() => {
          if (sequencia.current === id) setCarregando(false);
        });
    }, 450);

    return () => clearTimeout(atraso);
  }, [termo]);

  /** Card → tela DA PLANTA (descrição e imagem vêm da Wikipédia). */
  const abrirPlanta = (resultado: ResultadoBusca) => {
    navigate('/plant-detail', {
      state: {
        plantaSalva: {
          nome: resultado.titulo,
          nomeCientifico: resultado.titulo,
        },
        foto: resultado.imagem ?? undefined,
      },
    });
  };

  /** Receita não tem tela no app: abre o artigo na Wikipédia. */
  const abrirReceita = (resultado: ResultadoBusca) => {
    window.open(
      `https://pt.wikipedia.org/wiki/${encodeURIComponent(resultado.titulo)}`,
      '_blank',
      'noopener',
    );
  };

  // Resultados separados: plantas de um lado, receitas de outro
  const plantas = resultados.filter((r) => r.categorias.includes('planta'));
  const receitas = resultados.filter(
    (r) => r.categorias.includes('receita') && !r.categorias.includes('planta'),
  );

  const plantasFiltradas =
    filtro === 'receita'
      ? []
      : filtro === 'todas' || filtro === 'planta'
        ? plantas
        : plantas.filter((r) => r.categorias.includes(filtro));
  const receitasFiltradas = filtro === 'todas' || filtro === 'receita' ? receitas : [];

  const etiquetas = (resultado: ResultadoBusca) =>
    resultado.categorias
      .filter((categoria) => categoria !== 'planta')
      .map((categoria) => (
        <span key={categoria} className={`tag ${categoria}`}>
          {rotulos[categoria]}
        </span>
      ));

  return (
    <div className="search-container">
      <div className="search-scroll">
        <div className="search-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Buscar Plantas</h1>
        </div>

        <div className="search-input-container">
          <SearchIcon size={20} color="#999" />
          <input
            type="text"
            placeholder="Nome comum ou científico de qualquer planta..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="categories">
          {filtros.map((filtroOpcao) => (
            <button
              key={filtroOpcao.valor}
              className={`category-btn ${filtro === filtroOpcao.valor ? 'active' : ''}`}
              onClick={() => setFiltro(filtroOpcao.valor)}
            >
              {filtroOpcao.rotulo}
            </button>
          ))}
        </div>

        {erro && <p className="search-message error">{erro}</p>}

        {carregando && (
          <p className="search-message loading">
            <Loader2 size={16} className="spin" /> Buscando...
          </p>
        )}

        {buscou && !carregando && plantasFiltradas.length === 0 && receitasFiltradas.length === 0 && !erro && (
          <p className="search-message">
            Nada encontrado para “{termo}”{filtro !== 'todas' && ` com o filtro ${rotulos[filtro as CategoriaBusca]}`}.
            Tente outro nome ou filtro.
          </p>
        )}

        {plantasFiltradas.length > 0 && (
          <div className="results-group">
            <h3 className="results-section-title">Plantas</h3>
            <div className="search-results">
              {plantasFiltradas.map((resultado) => (
                <div
                  key={resultado.titulo}
                  className="result-card"
                  onClick={() => abrirPlanta(resultado)}
                >
                  <div className="result-image">
                    {resultado.imagem ? (
                      <img
                        src={resultado.imagem}
                        alt={resultado.titulo}
                        className="result-photo"
                        loading="lazy"
                      />
                    ) : (
                      <PlantIcon />
                    )}
                  </div>
                  <div className="result-info">
                    <h3>{resultado.titulo}</h3>
                    <p>{resultado.resumoCurto ?? 'Ver descrição e imagem'}</p>
                    {etiquetas(resultado).length > 0 && (
                      <div className="tag-row">{etiquetas(resultado)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {receitasFiltradas.length > 0 && (
          <div className="results-group">
            <h3 className="results-section-title">Receitas & Usos</h3>
            <div className="search-results">
              {receitasFiltradas.map((resultado) => (
                <div
                  key={resultado.titulo}
                  className="result-card receita"
                  onClick={() => abrirReceita(resultado)}
                >
                  <div className="result-image receita">
                    {resultado.imagem ? (
                      <img
                        src={resultado.imagem}
                        alt={resultado.titulo}
                        className="result-photo"
                        loading="lazy"
                      />
                    ) : (
                      <PlantIcon />
                    )}
                  </div>
                  <div className="result-info">
                    <h3>{resultado.titulo}</h3>
                    <p>{resultado.resumoCurto ?? 'Ver na Wikipédia'}</p>
                    <div className="tag-row">
                      <span className="tag receita">Receita</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="results-hint">Toque numa receita para ver o passo a passo na Wikipédia.</p>
          </div>
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

function PlantIcon() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40">
      <rect x="17" y="22" width="6" height="12" fill="#8d6e63" rx="1"/>
      <circle cx="20" cy="16" r="8" fill="#4caf50"/>
      <circle cx="14" cy="19" r="5" fill="#66bb6a"/>
      <circle cx="26" cy="19" r="5" fill="#66bb6a"/>
    </svg>
  );
}
