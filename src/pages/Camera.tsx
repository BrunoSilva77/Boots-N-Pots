import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Image, RotateCcw } from 'lucide-react';
import './Camera.css';

export default function Camera() {
  const navigate = useNavigate();

  return (
    <div className="camera-container">
      <div className="camera-preview">
        <div className="camera-top">
          <button className="back-button-camera" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} color="white" />
          </button>
          <span className="camera-instruction">Alinhe a planta aqui</span>
          <button className="camera-icon-button">
            <Zap size={20} color="white" />
          </button>
        </div>

        <div className="guide-frame">
          <div className="corner top-left"></div>
          <div className="corner top-right"></div>
          <div className="corner bottom-left"></div>
          <div className="corner bottom-right"></div>
        </div>

        <div className="camera-bottom">
          <button className="camera-icon-button">
            <Image size={24} color="white" />
          </button>

          <div className="capture-section">
            <p className="capture-text">Toque no botão para capturar e identificar.</p>
            <button className="capture-button" onClick={() => navigate('/plant-detail')}>
              <div className="capture-inner">
                <span>Capturar</span>
              </div>
            </button>
          </div>

          <button className="camera-icon-button">
            <RotateCcw size={24} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
