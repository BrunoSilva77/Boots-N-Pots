import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, LoaderCircle } from 'lucide-react';
import { cadastrar, entrar, ErroApi } from '../services/api';
import './Login.css';

type Modo = 'entrar' | 'cadastrar';

export default function Login() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const trocarModo = (novo: Modo) => {
    setModo(novo);
    setErro(null);
    setAviso(null);
  };

  const enviar = async () => {
    if (ocupado) return;
    setErro(null);
    setAviso(null);

    if (modo === 'cadastrar' && nome.trim() === '') {
      setErro('Informe seu nome.');
      return;
    }
    if (email.trim() === '' || password === '') {
      setErro('Preencha e-mail e senha.');
      return;
    }
    if (modo === 'cadastrar' && password.length < 6) {
      setErro('A senha precisa de pelo menos 6 caracteres.');
      return;
    }

    setOcupado(true);
    try {
      if (modo === 'entrar') {
        await entrar(email.trim(), password);
      } else {
        await cadastrar(nome.trim(), email.trim(), password);
      }
      navigate('/home', { replace: true });
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Falha no acesso ao servidor.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <img src="/logoTCC.png" alt="Boots'N Pots Logo" className="login-logo" />
          <h1 className="login-title">
            {modo === 'entrar' ? 'Bem-vindo de volta!' : 'Criar sua conta'}
          </h1>
          <p className="login-subtitle">
            {modo === 'entrar'
              ? 'Entre na sua conta para continuar'
              : 'Cadastre-se para salvar suas descobertas'}
          </p>
        </div>

        <div className="login-form">
          {modo === 'cadastrar' && (
            <div className="input-group">
              <UserIcon className="input-icon" size={20} />
              <input
                type="text"
                className="login-input"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
          )}

          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              className="login-input"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              className="login-input"
              placeholder={modo === 'cadastrar' ? 'Senha (mín. 6 caracteres)' : 'Sua senha'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void enviar()}
            />
            <button
              className="eye-button"
              onClick={() => setShowPassword(!showPassword)}
              type="button"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {erro && <p className="login-error">{erro}</p>}
          {aviso && !erro && <p className="login-notice">{aviso}</p>}

          {modo === 'entrar' && (
            <button
              className="forgot-password"
              onClick={() => setAviso('Recuperação de senha em breve.')}
              type="button"
            >
              Esqueceu a senha?
            </button>
          )}

          <button className="login-button" onClick={() => void enviar()} disabled={ocupado} type="button">
            {ocupado ? (
              <span className="login-button-loading">
                <LoaderCircle size={18} className="spin" /> Aguarde...
              </span>
            ) : modo === 'entrar' ? (
              'Entrar'
            ) : (
              'Criar conta'
            )}
          </button>
        </div>

        <div className="login-divider">
          <span>ou continue com</span>
        </div>

        <div className="social-buttons">
          <button className="social-button google" onClick={() => setAviso('Login social em breve.')} type="button">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Google</span>
          </button>
          <button className="social-button apple" onClick={() => setAviso('Login social em breve.')} type="button">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#000"/>
            </svg>
            <span>Apple</span>
          </button>
        </div>

        <div className="login-footer">
          <p className="signup-text">
            {modo === 'entrar' ? (
              <>
                Não tem conta?{' '}
                <span className="signup-link" onClick={() => trocarModo('cadastrar')}>
                  Cadastre-se
                </span>
              </>
            ) : (
              <>
                Já tem conta?{' '}
                <span className="signup-link" onClick={() => trocarModo('entrar')}>
                  Entrar
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
