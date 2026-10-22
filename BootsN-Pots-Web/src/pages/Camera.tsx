import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Image, RotateCcw, Check, CameraOff, ShieldAlert } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CameraPreview } from '@capacitor-community/camera-preview';
import { identificarPlanta, ErroIdentificacao } from '../services/plantnet';
import './Camera.css';

const isNative = Capacitor.isNativePlatform();

type Permissao = 'pendente' | 'concedida' | 'negada';

/** Dimensões da tela em px CSS (largura × altura seguras em retrato e paisagem). */
function dimensaoTelaCheia() {
  return {
    width: Math.round(Math.max(window.innerWidth, window.screen.width)),
    height: Math.round(Math.max(window.innerHeight, window.screen.height)),
  };
}

export default function Camera() {
  const navigate = useNavigate();
  const [permissaoNativa, setPermissaoNativa] = useState<Permissao>('pendente');
  const permissao: Permissao = isNative ? permissaoNativa : 'concedida';
  const [previewAtivo, setPreviewAtivo] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [lanterna, setLanterna] = useState(false);
  const [identificando, setIdentificando] = useState(false);
  const [erroApi, setErroApi] = useState<string | null>(null);
  const dimensaoPreviewRef = useRef<{ width: number; height: number } | null>(null);
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  const pararPreview = useCallback(async () => {
    try {
      await CameraPreview.stop();
    } catch {
      // preview já estava parado
    }
    setPreviewAtivo(false);
  }, []);

  const iniciarPreview = useCallback(async () => {
    if (!isNative) return;
    const dimensao = dimensaoTelaCheia();
    // Encerra uma sessão anterior antes de iniciar outra (evita "camera already started").
    try {
      await CameraPreview.stop();
    } catch {
      // nenhum preview ativo
    }
    try {
      await CameraPreview.start({
        className: 'live-preview',
        // Tela inteira, sem deslocamento: x/y em 0 eliminam o erro de alinhamento
        // e toBack coloca o preview atrás da WebView, com a UI sobrepondo.
        x: 0,
        y: 0,
        ...dimensao,
        storeToFile: false,
        toBack: true,
        position: 'rear',
        enableZoom: true,
      });
      dimensaoPreviewRef.current = dimensao;
      setPreviewAtivo(true);
    } catch {
      setPermissaoNativa('negada');
    }
  }, []);

  // Pede a permissão da câmera ao abrir a tela e inicia o preview
  useEffect(() => {
    if (!isNative) return;
    let ativo = true;
    (async () => {
      try {
        const status = await CapCamera.requestPermissions({ permissions: ['camera'] });
        if (!ativo) return;
        if (status.camera === 'granted') {
          setPermissaoNativa('concedida');
          await iniciarPreview();
        } else {
          setPermissaoNativa('negada');
        }
      } catch {
        if (ativo) setPermissaoNativa('negada');
      }
    })();
    return () => {
      ativo = false;
      pararPreview();
    };
  }, [iniciarPreview, pararPreview]);

  // Rotação/mudança de tamanho: reinicia o preview para manter a cobertura da tela inteira
  useEffect(() => {
    if (!isNative) return;
    const aoRedimensionar = () => {
      if (!previewAtivo || foto) return;
      const dimensao = dimensaoTelaCheia();
      const anterior = dimensaoPreviewRef.current;
      if (anterior && anterior.width === dimensao.width && anterior.height === dimensao.height) {
        return;
      }
      void iniciarPreview();
    };
    window.addEventListener('resize', aoRedimensionar);
    window.addEventListener('orientationchange', aoRedimensionar);
    return () => {
      window.removeEventListener('resize', aoRedimensionar);
      window.removeEventListener('orientationchange', aoRedimensionar);
    };
  }, [previewAtivo, foto, iniciarPreview]);

  // No app nativo o preview fica atrás da WebView: deixa o fundo transparente
  // para a câmera aparecer por baixo da UI (fora da tela de câmera, restaura).
  useEffect(() => {
    if (!isNative || permissao !== 'concedida') return;
    document.body.classList.add('camera-fullscreen');
    return () => {
      document.body.classList.remove('camera-fullscreen');
    };
  }, [permissao]);

  const solicitarPermissao = async () => {
    try {
      const status = await CapCamera.requestPermissions({ permissions: ['camera'] });
      if (status.camera === 'granted') {
        setPermissaoNativa('concedida');
        await iniciarPreview();
      } else {
        setPermissaoNativa('negada');
      }
    } catch {
      setPermissaoNativa('negada');
    }
  };

  const capturar = async () => {
    if (!isNative) {
      // No navegador não há câmera nativa: abre o seletor de arquivos
      // para escolher uma foto e seguir o mesmo fluxo de identificação.
      inputArquivoRef.current?.click();
      return;
    }
    if (!previewAtivo) return;
    try {
      setOcupado(true);
      const resultado = await CameraPreview.capture({ quality: 80 });
      setFoto(`data:image/jpeg;base64,${resultado.value}`);
      await pararPreview();
    } catch {
      // captura cancelada
    } finally {
      setOcupado(false);
    }
  };

  const repetirFoto = async () => {
    setFoto(null);
    setLanterna(false);
    setErroApi(null);
    await iniciarPreview();
  };

  const escolherDaGaleria = async () => {
    if (!isNative) {
      inputArquivoRef.current?.click();
      return;
    }
    try {
      setOcupado(true);
      const photo = await CapCamera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        quality: 80,
        width: 1280,
      });
      if (photo.base64String) {
        setFoto(`data:image/jpeg;base64,${photo.base64String}`);
        await pararPreview();
      }
    } catch {
      // usuário cancelou
    } finally {
      setOcupado(false);
    }
  };

  /** Lê o arquivo escolhido no navegador (web) e mostra como foto capturada. */
  const aoEscolherArquivo = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    setErroApi(null);
    const leitor = new FileReader();
    leitor.onload = () => setFoto(String(leitor.result));
    leitor.onerror = () => setErroApi('Não foi possível ler o arquivo escolhido.');
    leitor.readAsDataURL(arquivo);
  };

  const alternarLanterna = async () => {
    if (!previewAtivo) return;
    try {
      const novo = !lanterna;
      const { result } = await CameraPreview.getSupportedFlashModes();
      if (!result || result.length === 0) return;
      await CameraPreview.setFlashMode({ flashMode: novo ? 'torch' : 'off' });
      setLanterna(novo);
    } catch {
      // lanterna não disponível neste aparelho
    }
  };

  const identificar = async () => {
    if (!foto || identificando) return;
    setErroApi(null);
    setIdentificando(true);
    try {
      const identificacao = await identificarPlanta(foto);
      navigate('/plant-detail', { state: { foto, identificacao } });
    } catch (erro) {
      setErroApi(
        erro instanceof ErroIdentificacao
          ? erro.message
          : 'Falha ao identificar a planta. Tente novamente.',
      );
    } finally {
      setIdentificando(false);
    }
  };

  // Tela de permissão negada
  if (permissao === 'negada') {
    return (
      <div className="camera-container">
        <div className="camera-preview">
          <div className="camera-top">
            <button className="back-button-camera" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} color="white" />
            </button>
            <span className="camera-instruction">Permissão necessária</span>
            <span style={{ width: 40 }} />
          </div>

          <div className="permission-box">
            <ShieldAlert size={56} color="#a5d6a7" />
            <h2>Libere o acesso à câmera</h2>
            <p>
              O Boots'N Pots precisa da câmera para fotografar e identificar
              plantas. Nada é enviado sem o seu consentimento.
            </p>
            <button className="permission-button primary" onClick={solicitarPermissao}>
              <CameraOff size={18} color="white" />
              Permitir câmera
            </button>
            <p className="permission-hint">
              Se o pedido não aparecer, ative manualmente em
              Configurações › Apps › Boots'N Pots › Permissões › Câmera.
            </p>
          </div>

          <div className="camera-bottom">
            <button className="camera-icon-button" onClick={() => navigate(-1)}>
              <ArrowLeft size={24} color="white" />
            </button>
            <div className="capture-section">
              <p className="capture-text">Aguardando permissão da câmera...</p>
            </div>
            <span style={{ width: 40 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`camera-container${isNative ? ' native' : ''}`}>
      <div className="camera-preview">
        <div className="camera-top">
          <button
            className="back-button-camera"
            onClick={() => navigate(-1)}
            disabled={identificando}
          >
            <ArrowLeft size={20} color="white" />
          </button>
          <span className="camera-instruction">
            {identificando
              ? 'Identificando...'
              : foto
                ? 'Foto capturada!'
                : 'Alinhe a planta aqui'}
          </span>
          <button
            className={`camera-icon-button ${lanterna ? 'active' : ''}`}
            onClick={alternarLanterna}
            disabled={!previewAtivo || foto !== null}
          >
            <Zap size={20} color={lanterna ? '#ffd54f' : 'white'} />
          </button>
        </div>

        <div className="preview-area" id="camera-preview-area">
          <div className="guide-frame">
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>
          </div>
          {isNative && !previewAtivo && !foto && (
            <p className="preview-loading">Preparando câmera...</p>
          )}
          {foto && <img src={foto} alt="Planta capturada" className="photo-preview" />}
        </div>

        {identificando && (
          <div className="identify-overlay">
            <div className="identify-spinner" />
            <p>Identificando a planta...</p>
            <small>Análise com a Pl@ntNet — leva poucos segundos</small>
          </div>
        )}

        <div className="camera-bottom">
          <button
            className="camera-icon-button"
            onClick={escolherDaGaleria}
            disabled={ocupado || identificando}
            title="Escolher da galeria"
          >
            <Image size={24} color="white" />
          </button>

          <div className="capture-section">
            <p className={erroApi ? 'capture-text capture-error' : 'capture-text'}>
              {erroApi ??
                (foto
                  ? 'Gostou da foto? Toque para identificar.'
                  : 'Toque no botão para capturar e identificar.')}
            </p>
            {foto ? (
              <div className="capture-actions">
                <button
                  className="capture-button secondary"
                  onClick={repetirFoto}
                  disabled={ocupado || identificando}
                  title="Repetir foto"
                >
                  <div className="capture-inner secondary">
                    <RotateCcw size={24} color="white" />
                  </div>
                </button>
                <button
                  className="capture-button"
                  onClick={identificar}
                  disabled={ocupado || identificando}
                >
                  <div className="capture-inner">
                    <Check size={28} color="white" />
                  </div>
                </button>
              </div>
            ) : (
              <button
                className="capture-button"
                onClick={capturar}
                disabled={ocupado || identificando || (isNative && !previewAtivo)}
              >
                <div className="capture-inner">
                  <span>{ocupado ? '...' : 'Capturar'}</span>
                </div>
              </button>
            )}
          </div>

          <button
            className="camera-icon-button"
            onClick={repetirFoto}
            disabled={ocupado || identificando || !foto}
            title="Repetir foto"
          >
            <RotateCcw size={24} color="white" />
          </button>
        </div>

        {/* Seletor de arquivos usado no navegador (web) */}
        <input
          ref={inputArquivoRef}
          type="file"
          accept="image/*"
          className="hidden-file-input"
          onChange={aoEscolherArquivo}
        />
      </div>
    </div>
  );
}
