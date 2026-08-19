import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, Camera, Folder, User, Home as HomeIcon } from 'lucide-react';
import './Search.css';

const allPlants = [
  { id: 1, name: 'Manjericão', scientific: 'Ocimum basilicum', color: '#e8f5e9' },
  { id: 2, name: 'Lavanda', scientific: 'Lavandula angustifolia', color: '#f3e5f5' },
  { id: 3, name: 'Hortelã', scientific: 'Mentha × piperita', color: '#e8f5e9' },
  { id: 4, name: 'Alecrim', scientific: 'Salvia rosmarinus', color: '#e8f5e9' },
  { id: 5, name: 'Camomila', scientific: 'Matricaria chamomilla', color: '#fff9c4' },
  { id: 6, name: 'Erva-cidreira', scientific: 'Melissa officinalis', color: '#e8f5e9' },
  { id: 7, name: 'Arruda', scientific: 'Ruta graveolens', color: '#e8f5e9' },
  { id: 8, name: 'Alecrim-da-horta', scientific: 'Ocimum gratissimum', color: '#e8f5e9' },
];

const categories = ['Todas', 'Medicinais', 'Culinárias', 'Aromáticas'];

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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');

  const filteredPlants = allPlants.filter(plant =>
    plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.scientific.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            placeholder="Buscar por nome ou espécie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="categories">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="search-results">
          {filteredPlants.map((plant) => (
            <div 
              key={plant.id} 
              className="result-card"
              onClick={() => navigate('/plant-detail')}
            >
              <div className="result-image" style={{ backgroundColor: plant.color }}>
                <PlantIcon />
              </div>
              <div className="result-info">
                <h3>{plant.name}</h3>
                <p>{plant.scientific}</p>
              </div>
            </div>
          ))}
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
    <svg viewBox="0 0 40 40" width="40" height="40">
      <rect x="17" y="22" width="6" height="12" fill="#8d6e63" rx="1"/>
      <circle cx="20" cy="16" r="8" fill="#4caf50"/>
      <circle cx="14" cy="19" r="5" fill="#66bb6a"/>
      <circle cx="26" cy="19" r="5" fill="#66bb6a"/>
    </svg>
  );
}
