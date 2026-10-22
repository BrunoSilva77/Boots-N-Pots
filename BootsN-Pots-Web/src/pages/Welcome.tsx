import { useNavigate } from 'react-router-dom';
import './Welcome.css';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <img src="/logoTCC.png" alt="Boots'N Pots Logo" className="welcome-logo" />
        
        <h1 className="welcome-title">Bem-vindo ao Boots'N Pots</h1>
        
        <p className="welcome-description">
          Identifique plantas com uma foto. 
          Toque, fotografe e descubra o nome e as características de qualquer planta.
        </p>

        <div className="welcome-features">
          <div className="feature-item">
            <span className="feature-icon">📸</span>
            <span className="feature-text">Fotografe plantas</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔍</span>
            <span className="feature-text">Identifique instantaneamente</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📚</span>
            <span className="feature-text">Aprenda sobre cada espécie</span>
          </div>
        </div>
      </div>
      
      <button className="welcome-button" onClick={() => navigate('/login')}>
        Começar
      </button>
    </div>
  );
}
