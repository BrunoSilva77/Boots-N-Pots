import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Splash.css';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      <div className="splash-content">
        <img src="/logoTCC.png" alt="Boots'N Pots Logo" className="splash-logo" />
        <h1 className="splash-title">Boots'N Pots</h1>
        <p className="splash-subtitle">Explore o Mundo Verde</p>
      </div>
    </div>
  );
}
