import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Folder, User, Home as HomeIcon, Settings, Bell, Shield, LogOut, ChevronRight, Search as SearchIcon } from 'lucide-react';
import './Profile.css';

const navItems = [
  { path: '/home', icon: HomeIcon, label: 'Início' },
  { path: '/search', icon: SearchIcon, label: 'Busca' },
  { path: '/camera', icon: Camera, label: 'Câmera', isCamera: true },
  { path: '/collection', icon: Folder, label: 'Coleção' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

const menuItems = [
  { icon: Settings, label: 'Configurações', description: 'Preferências do app' },
  { icon: Bell, label: 'Notificações', description: 'Alertas e lembretes' },
  { icon: Shield, label: 'Privacidade', description: 'Segurança da conta' },
  { icon: LogOut, label: 'Sair', description: 'Encerrar sessão', danger: true },
];

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="profile-container">
      <div className="profile-scroll">
        <div className="profile-header">
          <div className="profile-avatar-large">
            <svg viewBox="0 0 80 80" width="80" height="80">
              <circle cx="40" cy="40" r="40" fill="#e0e0e0"/>
              <circle cx="40" cy="32" r="14" fill="#bdbdbd"/>
              <path d="M16 72c0-13.25 10.75-24 24-24s24 10.75 24 24" fill="#bdbdbd"/>
            </svg>
          </div>
          <h1 className="profile-name">Marina Silva</h1>
          <p className="profile-email">marina@email.com</p>
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <span className="stat-number">24</span>
            <span className="stat-label">Plantas</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">8</span>
            <span className="stat-label">Coleções</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">12</span>
            <span className="stat-label">Identificadas</span>
          </div>
        </div>

        <div className="menu-section">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button 
                key={index} 
                className={`menu-item ${item.danger ? 'danger' : ''}`}
              >
                <div className="menu-icon">
                  <Icon size={22} />
                </div>
                <div className="menu-text">
                  <h3>{item.label}</h3>
                  <p>{item.description}</p>
                </div>
                <ChevronRight size={20} color="#999" />
              </button>
            );
          })}
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
