import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Camera, Folder, User, Home as HomeIcon, Clock, ChevronLeft, ChevronRight, X, Droplets, Sun, Thermometer, Leaf } from 'lucide-react';
import { buscarInfoPlanta } from '../services/wikipedia';
import { lerSessao } from '../services/api';
import { avatarPorCodigo } from '../services/avatares';
import './Home.css';

const lastSearch = {
  name: 'Hortelã-Pimenta',
  scientific: 'Mentha × piperita',
  date: 'Hoje, 14:32',
};

const recentPlants = [
  { id: 1, name: 'Manjericão', scientific: 'Ocimum basilicum', color: '#e8f5e9', water: '2x por semana', sun: 'Sol pleno', temp: '18-30°C', use: 'Culinária e medicina', desc: 'Herba aromática muito usada na culinária italiana. Possui propriedades anti-inflamatórias e digestivas.' },
  { id: 2, name: 'Lavanda', scientific: 'Lavandula angustifolia', color: '#f3e5f5', water: '1x por semana', sun: 'Sol pleno', temp: '15-30°C', use: 'Perfumaria e relaxamento', desc: 'Planta aromática com flores roxas. Conhecida por suas propriedades calmantes e uso em perfumes.' },
  { id: 3, name: 'Camomila', scientific: 'Matricaria chamomilla', color: '#fff9c4', water: '2x por semana', sun: 'Sol pleno', temp: '15-25°C', use: 'Chás e medicina', desc: 'Planta medicinal usada para preparação de chás calmantes e tratamento de insônia.' },
  { id: 4, name: 'Erva-cidreira', scientific: 'Melissa officinalis', color: '#e8f5e9', water: '2-3x por semana', sun: 'Meia-sombra', temp: '15-25°C', use: 'Chás e culinária', desc: 'Herba aromática com aroma de limão. Usada em chás para relaxamento e na culinária.' },
];

const popularPlants = [
  { id: 5, name: 'Hortelã', scientific: 'Mentha × piperita', color: '#e8f5e9', water: '2x por semana', sun: 'Sol pleno', temp: '15-30°C', use: 'Culinária e medicina', desc: 'Planta aromática muito versatile, usada em bebidas, doces e remédios caseiros.' },
  { id: 6, name: 'Alecrim', scientific: 'Salvia rosmarinus', color: '#e8f5e9', water: '1x por semana', sun: 'Sol pleno', temp: '10-30°C', use: 'Culinária e aromaterapia', desc: 'Planta aromática perene, muito usada na culinária mediterrânea e para aromatização de ambientes.' },
  { id: 7, name: 'Manjericão Thai', scientific: 'Ocimum basilicum', color: '#e8f5e9', water: '2x por semana', sun: 'Sol pleno', temp: '20-30°C', use: 'Culinária asiática', desc: 'Variedade de manjericão com sabor mais forte, usado na culinária tailandesa e vietnamita.' },
  { id: 8, name: 'Arruda', scientific: 'Ruta graveolens', color: '#e8f5e9', water: '1x por semana', sun: 'Sol pleno', temp: '10-35°C', use: 'Medicina popular', desc: 'Planta medicinal usada na medicina popular para various tratamentos e como inseticida natural.' },
];

const navItems = [
  { path: '/home', icon: HomeIcon, label: 'Início' },
  { path: '/search', icon: Search, label: 'Busca' },
  { path: '/camera', icon: Camera, label: 'Câmera', isCamera: true },
  { path: '/collection', icon: Folder, label: 'Coleção' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

type Plant = typeof recentPlants[0];

function PlantModal({ plant, imagem, onClose }: { plant: Plant; imagem?: string | null; onClose: () => void }) {
  return (
    <div className="plant-modal-overlay" onClick={onClose}>
      <div className="plant-modal" onClick={(e) => e.stopPropagation()}>
        <button className="plant-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="plant-modal-image" style={{ backgroundColor: plant.color }}>
          {imagem ? (
            <img src={imagem} alt={plant.name} className="plant-modal-photo" />
          ) : (
            <svg viewBox="0 0 80 80" width="60" height="60">
              <rect x="33" y="48" width="14" height="20" fill="#8d6e63" rx="3"/>
              <circle cx="40" cy="32" r="20" fill="#4caf50"/>
              <circle cx="26" cy="40" r="14" fill="#66bb6a"/>
              <circle cx="54" cy="40" r="14" fill="#66bb6a"/>
              <circle cx="40" cy="22" r="16" fill="#81c784"/>
            </svg>
          )}
        </div>

        <h2 className="plant-modal-name">{plant.name}</h2>
        <p className="plant-modal-scientific">{plant.scientific}</p>

        <div className="plant-modal-divider" />

        <p className="plant-modal-desc">{plant.desc}</p>

        <div className="plant-modal-info-grid">
          <div className="plant-modal-info-item">
            <div className="plant-modal-info-icon">
              <Droplets size={18} color="#2196f3" />
            </div>
            <div>
              <span className="plant-modal-info-label">Rega</span>
              <span className="plant-modal-info-value">{plant.water}</span>
            </div>
          </div>

          <div className="plant-modal-info-item">
            <div className="plant-modal-info-icon">
              <Sun size={18} color="#ff9800" />
            </div>
            <div>
              <span className="plant-modal-info-label">Luz Solar</span>
              <span className="plant-modal-info-value">{plant.sun}</span>
            </div>
          </div>

          <div className="plant-modal-info-item">
            <div className="plant-modal-info-icon">
              <Thermometer size={18} color="#f44336" />
            </div>
            <div>
              <span className="plant-modal-info-label">Temperatura</span>
              <span className="plant-modal-info-value">{plant.temp}</span>
            </div>
          </div>

          <div className="plant-modal-info-item">
            <div className="plant-modal-info-icon">
              <Leaf size={18} color="#2d7d46" />
            </div>
            <div>
              <span className="plant-modal-info-label">Uso Principal</span>
              <span className="plant-modal-info-value">{plant.use}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type CarouselProps = {
  plants: Plant[];
  imagens: Record<string, string | null>;
  onPlantClick: (plant: Plant) => void;
};

function Carousel({ plants, imagens, onPlantClick }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const prevIndex = (activeIndex - 1 + plants.length) % plants.length;
  const nextIndex = (activeIndex + 1) % plants.length;

  const animate = (dir: 'left' | 'right') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);

    setTimeout(() => {
      if (dir === 'right') {
        setActiveIndex((prev) => (prev + 1) % plants.length);
      } else {
        setActiveIndex((prev) => (prev - 1 + plants.length) % plants.length);
      }
      setDirection(null);
      setTimeout(() => setIsAnimating(false), 50);
    }, 400);
  };

  const getClass = (pos: 'prev' | 'active' | 'next') => {
    if (!direction) return `carousel-card carousel-${pos}`;

    if (direction === 'right') {
      if (pos === 'prev') return 'carousel-card carousel-prev carousel-exit-left';
      if (pos === 'active') return 'carousel-card carousel-active carousel-exit-left';
      if (pos === 'next') return 'carousel-card carousel-next carousel-enter-right';
    } else {
      if (pos === 'prev') return 'carousel-card carousel-prev carousel-enter-left';
      if (pos === 'active') return 'carousel-card carousel-active carousel-exit-right';
      if (pos === 'next') return 'carousel-card carousel-next carousel-exit-right';
    }
    return `carousel-card carousel-${pos}`;
  };

  return (
    <div className="carousel-wrapper">
      <button className="carousel-nav-btn" onClick={() => animate('left')}>
        <ChevronLeft size={20} />
      </button>

      <div className="carousel-viewport">
        <div className="carousel-track">
          <div
            className={getClass('prev')}
            onClick={() => animate('left')}
          >
            <div className="carousel-card-image" style={{ backgroundColor: plants[prevIndex].color }}>
              <ImagemPlanta imagem={imagens[plants[prevIndex].scientific]} />
            </div>
          </div>

          <div
            className={getClass('active')}
            onClick={() => onPlantClick(plants[activeIndex])}
          >
            <div className="carousel-card-image" style={{ backgroundColor: plants[activeIndex].color }}>
              <ImagemPlanta imagem={imagens[plants[activeIndex].scientific]} />
            </div>
            <div className="carousel-card-info">
              <h4>{plants[activeIndex].name}</h4>
            </div>
          </div>

          <div
            className={getClass('next')}
            onClick={() => animate('right')}
          >
            <div className="carousel-card-image" style={{ backgroundColor: plants[nextIndex].color }}>
              <ImagemPlanta imagem={imagens[plants[nextIndex].scientific]} />
            </div>
          </div>
        </div>
      </div>

      <button className="carousel-nav-btn" onClick={() => animate('right')}>
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  // Imagens REAIS de cada planta (Wikipédia/Commons), buscadas pelo nome
  const [imagens, setImagens] = useState<Record<string, string | null>>({});
  useEffect(() => {
    let ativo = true;
    const alvos = [...recentPlants, ...popularPlants, lastSearch];
    alvos.forEach((planta) => {
      void buscarInfoPlanta([planta.name, planta.scientific]).then((info) => {
        if (ativo) {
          setImagens((anterior) => ({ ...anterior, [planta.scientific]: info?.imagem ?? null }));
        }
      });
    });
    return () => {
      ativo = false;
    };
  }, []);

  const currentIndex = navItems.findIndex(item => item.path === location.pathname);

  // Saudação e avatar reais do usuário (ou "Visitante" se não logado)
  const sessao = lerSessao();
  const primeiroNome = (sessao?.usuario.nome ?? 'Visitante').trim().split(' ')[0];
  const avatarEscolhido = avatarPorCodigo(sessao?.usuario.avatar);

  return (
    <div className="home-container">
      <div className="home-scroll">
        <div className="home-header">
          <div>
            <p className="greeting">Olá, {primeiroNome}! 🌱</p>
            <h1 className="home-title">Descubra Plantas</h1>
            <h2 className="home-subtitle">ao seu Redor</h2>
          </div>
          <div
            className="profile-avatar"
            onClick={() => navigate('/profile')}
            role="button"
            aria-label="Abrir perfil"
          >
            {avatarEscolhido ? (
              <img src={avatarEscolhido.svg} alt="Seu avatar" className="profile-avatar-img" />
            ) : (
              <svg viewBox="0 0 50 50" width="50" height="50">
                <circle cx="25" cy="25" r="25" fill="#e0e0e0"/>
                <circle cx="25" cy="20" r="8" fill="#bdbdbd"/>
                <path d="M10 45c0-8.28 6.72-15 15-15s15 6.72 15 15" fill="#bdbdbd"/>
              </svg>
            )}
          </div>
        </div>

        <div className="search-bar">
          <Search size={20} color="#999" />
          <input
            type="text"
            placeholder="Buscar por nome ou espécie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-field"
          />
        </div>

        <div className="last-search-card" onClick={() => navigate('/plant-detail')}>
          <div className="last-search-image">
            {imagens[lastSearch.scientific] ? (
              <img
                src={imagens[lastSearch.scientific] as string}
                alt={lastSearch.name}
                className="last-search-photo"
              />
            ) : (
              <svg viewBox="0 0 120 120" width="100%" height="100%">
                <rect width="120" height="120" fill="#e8f5e9" rx="16"/>
                <rect x="48" y="72" width="24" height="36" fill="#8d6e63" rx="4"/>
                <circle cx="60" cy="48" r="26" fill="#2e7d32"/>
                <circle cx="42" cy="56" r="18" fill="#388e3c"/>
                <circle cx="78" cy="56" r="18" fill="#388e3c"/>
                <circle cx="60" cy="34" r="20" fill="#43a047"/>
              </svg>
            )}
          </div>
          <div className="last-search-info">
            <div className="last-search-badge">
              <Clock size={12} color="#2d7d46" />
              <span>Última Pesquisa</span>
            </div>
            <h3>{lastSearch.name}</h3>
            <p className="scientific">{lastSearch.scientific}</p>
          </div>
        </div>

        <div className="section">
          <h3 className="section-title">Suas Últimas Descobertas</h3>
          <Carousel plants={recentPlants} imagens={imagens} onPlantClick={(plant) => setSelectedPlant(plant)} />
        </div>

        <div className="section">
          <h3 className="section-title">Plantas Populares</h3>
          <Carousel plants={popularPlants} imagens={imagens} onPlantClick={(plant) => setSelectedPlant(plant)} />
        </div>
      </div>

      <div className="bottom-nav">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentIndex === index || (item.path === '/home' && location.pathname === '/');
          
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

      {selectedPlant && (
        <PlantModal
          plant={selectedPlant}
          imagem={imagens[selectedPlant.scientific]}
          onClose={() => setSelectedPlant(null)}
        />
      )}
    </div>
  );
}

/** Foto real da planta quando existe; senão, o ícone. */
function ImagemPlanta({ imagem }: { imagem?: string | null }) {
  if (imagem) {
    return <img src={imagem} alt="" className="carousel-card-photo" loading="lazy" />;
  }
  return <PlantIcon />;
}

function PlantIcon() {
  return (
    <svg viewBox="0 0 60 60" width="40" height="40">
      <rect x="25" y="35" width="10" height="15" fill="#8d6e63" rx="2"/>
      <circle cx="30" cy="25" r="15" fill="#4caf50"/>
      <circle cx="20" cy="30" r="10" fill="#66bb6a"/>
      <circle cx="40" cy="30" r="10" fill="#66bb6a"/>
      <circle cx="30" cy="18" r="12" fill="#81c784"/>
    </svg>
  );
}
