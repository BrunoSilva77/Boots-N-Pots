import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Folder, User, Home as HomeIcon, Plus, Search as SearchIcon } from 'lucide-react';
import './Collection.css';

const collections = [
  { id: 1, name: 'Minhas Plantas', count: 8, color: '#e8f5e9' },
  { id: 2, name: 'Favoritas', count: 4, color: '#fce4ec' },
  { id: 3, name: 'Medicinais', count: 6, color: '#e3f2fd' },
];

const recentPlants = [
  { id: 1, name: 'Manjericão', color: '#e8f5e9' },
  { id: 2, name: 'Lavanda', color: '#f3e5f5' },
  { id: 3, name: 'Hortelã', color: '#e8f5e9' },
  { id: 4, name: 'Alecrim', color: '#e8f5e9' },
];

const navItems = [
  { path: '/home', icon: HomeIcon, label: 'Início' },
  { path: '/search', icon: SearchIcon, label: 'Busca' },
  { path: '/camera', icon: Camera, label: 'Câmera', isCamera: true },
  { path: '/collection', icon: Folder, label: 'Coleção' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

export default function Collection() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="collection-container">
      <div className="collection-scroll">
        <div className="collection-header">
          <h1>Minha Coleção</h1>
        </div>

        <div className="collections-section">
          <h2 className="section-title">Coleções</h2>
          <div className="collections-grid">
            {collections.map((col) => (
              <div key={col.id} className="collection-card" style={{ backgroundColor: col.color }}>
                <Folder size={28} color="#2d7d46" />
                <div className="collection-info">
                  <h3>{col.name}</h3>
                  <p>{col.count} plantas</p>
                </div>
              </div>
            ))}
            <div className="collection-card add-collection">
              <Plus size={28} color="#999" />
              <span>Nova Coleção</span>
            </div>
          </div>
        </div>

        <div className="recent-section">
          <h2 className="section-title">Adicionadas Recentemente</h2>
          <div className="recent-grid">
            {recentPlants.map((plant) => (
              <div 
                key={plant.id} 
                className="recent-card"
                onClick={() => navigate('/plant-detail')}
              >
                <div className="recent-image" style={{ backgroundColor: plant.color }}>
                  <PlantIcon />
                </div>
                <p>{plant.name}</p>
              </div>
            ))}
          </div>
        </div>
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
              {item.isCamera ? (
                <div className="camera-circle">
                  <Icon size={24} color="white" />
                </div>
              ) : (
                <Icon size={24} />
              )}
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
    <svg viewBox="0 0 50 50" width="50" height="50">
      <rect x="20" y="28" width="10" height="15" fill="#8d6e63" rx="2"/>
      <circle cx="25" cy="18" r="10" fill="#4caf50"/>
      <circle cx="18" cy="22" r="7" fill="#66bb6a"/>
      <circle cx="32" cy="22" r="7" fill="#66bb6a"/>
    </svg>
  );
}
