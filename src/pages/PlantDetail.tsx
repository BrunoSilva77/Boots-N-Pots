import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Camera, Folder, User, Home as HomeIcon } from 'lucide-react';
import './PlantDetail.css';

const tabs = ['Descrição', 'Usos', 'Dicas'];

const navItems = [
  { path: '/home', icon: HomeIcon, label: 'Início' },
  { path: '/search', icon: Search, label: 'Busca' },
  { path: '/camera', icon: Camera, label: 'Câmera', isCamera: true },
  { path: '/collection', icon: Folder, label: 'Coleção' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

export default function PlantDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Descrição');

  const currentIndex = navItems.findIndex(item => item.path === location.pathname);

  return (
    <div className="detail-container">
      <div className="detail-scroll">
        <div className="detail-image">
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
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} color="white" />
          </button>
        </div>

        <div className="detail-content">
          <div className="detail-header">
            <div>
              <h1 className="plant-name">Hortelã-Pimenta</h1>
              <p className="scientific-name">(Mentha × piperita)</p>
            </div>
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
            )}

            {activeTab === 'Usos' && (
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
            )}

            {activeTab === 'Dicas' && (
              <div>
                <p className="description-text">
                  Cultivo: Prefere sol parcial e solo úmido.<br/><br/>
                  Colheita: Colha as folhas antes da floração.<br/><br/>
                  Armazenamento: Seque as folhas à sombra.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="detail-bottom">
        <button className="add-button">Adicionar à Coleção</button>

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
