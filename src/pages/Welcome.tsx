import { useNavigate } from 'react-router-dom';
import './Welcome.css';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1 className="welcome-title">Boots'N Pots - Explore</h1>
        <h2 className="welcome-subtitle">o Mundo Verde</h2>
        
        <div className="illustration-container">
          <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg">
            <rect width="280" height="280" fill="#f0f9f0" rx="20"/>
            <ellipse cx="140" cy="250" rx="80" ry="12" fill="#c8e6c9"/>
            <rect x="125" y="180" width="30" height="70" fill="#8d6e63" rx="5"/>
            <circle cx="140" cy="150" r="45" fill="#4caf50"/>
            <circle cx="110" cy="165" r="28" fill="#66bb6a"/>
            <circle cx="170" cy="165" r="28" fill="#66bb6a"/>
            <circle cx="140" cy="125" r="32" fill="#81c784"/>
            <circle cx="100" cy="145" r="22" fill="#a5d6a7"/>
            <circle cx="180" cy="145" r="22" fill="#a5d6a7"/>
            <circle cx="140" cy="100" r="18" fill="#c8e6c9"/>
          </svg>
        </div>
        
        <p className="welcome-description">
          Identifique plantas com uma foto.<br/>
          Toque, fotografe e descubra!
        </p>

        <div className="pagination-dots">
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
      
      <button className="welcome-button" onClick={() => navigate('/login')}>
        Começar
      </button>
    </div>
  );
}
