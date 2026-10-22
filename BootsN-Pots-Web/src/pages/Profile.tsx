import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Folder, User, Home as HomeIcon, Settings, Bell, Shield, LogOut, ChevronRight, Search as SearchIcon, Pencil, Check, X } from 'lucide-react';
import { carregarPerfil, atualizarPerfil, lerSessao, sair, ErroApi, type ResumoPerfil } from '../services/api';
import { listarColecao } from '../services/colecao';
import * as pastasLocal from '../services/pastas-local';
import { AVATARES, avatarPorCodigo } from '../services/avatares';
import { pedirPermissao, temPermissao, listarLembretes } from '../services/lembretes';
import './Profile.css';

const navItems = [
  { path: '/home', icon: HomeIcon, label: 'Início' },
  { path: '/search', icon: SearchIcon, label: 'Busca' },
  { path: '/camera', icon: Camera, label: 'Câmera', isCamera: true },
  { path: '/collection', icon: Folder, label: 'Coleção' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();

  const sessao = lerSessao();
  const [resumo, setResumo] = useState<ResumoPerfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // edição de perfil
  const [avatarAtual, setAvatarAtual] = useState<string | null>(sessao?.usuario.avatar ?? null);
  const [nomeAtual, setNomeAtual] = useState<string>(sessao?.usuario.nome ?? 'Visitante');
  const [escolhendoAvatar, setEscolhendoAvatar] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeRascunho, setNomeRascunho] = useState<string>(sessao?.usuario.nome ?? '');
  const [ocupado, setOcupado] = useState(false);
  const [permissaoNotif, setPermissaoNotif] = useState<boolean>(temPermissao());
  const [totalLembretes, setTotalLembretes] = useState<number>(listarLembretes().length);

  // mantém o contador de lembretes do menu em sincronia com o storage
  useEffect(() => {
    const atualizar = () => setTotalLembretes(listarLembretes().length);
    atualizar();
    window.addEventListener('focus', atualizar);
    return () => window.removeEventListener('focus', atualizar);
  }, []);

  // Sem login: números do armazenamento LOCAL (em vez de "—")
  const [locais] = useState(() => {
    if (lerSessao()) return null;
    const plantas = listarColecao();
    return {
      plantas: plantas.length,
      pastas: pastasLocal.listarPastas().length,
      comLocal: plantas.filter((planta) => planta.latitude != null).length,
    };
  });

  useEffect(() => {
    if (!sessao) return;
    let ativo = true;
    void carregarPerfil()
      .then((dados) => {
        if (!ativo) return;
        setResumo(dados.resumo);
        setAvatarAtual(dados.usuario.avatar ?? null);
        setNomeAtual(dados.usuario.nome);
      })
      .catch((e: unknown) => {
        if (ativo) setErro(e instanceof ErroApi ? e.message : 'Falha ao carregar o perfil.');
      });
    return () => {
      ativo = false;
    };
  }, [sessao]);

  // ---------------------------------------------------- editar perfil

  /** Salva o avatar escolhido no servidor (se logado). */
  async function salvarAvatar(codigo: string): Promise<void> {
    if (ocupado) return;
    setOcupado(true);
    setErro(null);
    setAvatarAtual(codigo);
    setEscolhendoAvatar(false);
    if (sessao) {
      try {
        const usuario = await atualizarPerfil({ avatar: codigo });
        setAvatarAtual(usuario.avatar ?? codigo);
        setAviso('Avatar atualizado!');
      } catch (e) {
        setErro(e instanceof ErroApi ? e.message : 'Falha ao salvar o avatar.');
      }
    } else {
      setAviso('Avatar aplicado (faça login para manter).');
    }
    setOcupado(false);
  }

  /** Salva o nome editado no servidor (se logado). */
  async function salvarNome(): Promise<void> {
    const limpo = nomeRascunho.trim();
    if (!limpo) {
      setErro('O nome não pode ficar vazio.');
      return;
    }
    if (ocupado) return;
    setOcupado(true);
    setErro(null);
    setNomeAtual(limpo);
    setEditandoNome(false);
    if (sessao) {
      try {
        const usuario = await atualizarPerfil({ nome: limpo });
        setNomeAtual(usuario.nome);
        setAviso('Nome atualizado!');
      } catch (e) {
        setErro(e instanceof ErroApi ? e.message : 'Falha ao salvar o nome.');
      }
    } else {
      setAviso('Nome aplicado (faça login para manter).');
    }
    setOcupado(false);
  }

  /** Pede permissão de notificação. */
  async function ativarNotificacoes(): Promise<void> {
    const ok = await pedirPermissao();
    setPermissaoNotif(ok);
    setAviso(ok ? 'Notificações ativadas! 🌱' : 'Permissão negada nas configurações do aparelho.');
  }

  const menuItems = [
    { icon: Settings, label: 'Configurações', description: 'Preferências do app' },
    {
      icon: Bell,
      label: 'Notificações e lembretes',
      description: permissaoNotif
        ? totalLembretes > 0
          ? `${totalLembretes} lembrete(s) ativo(s)`
          : 'Ativadas · sem lembretes'
        : 'Ative para receber avisos de rega',
    },
    { icon: Shield, label: 'Privacidade', description: 'Segurança da conta' },
    {
      icon: LogOut,
      label: sessao ? 'Sair' : 'Entrar',
      description: sessao ? 'Encerrar sessão' : 'Entrar ou criar conta',
      danger: !!sessao,
    },
  ];

  const aoClicarNoMenu = (label: string) => {
    if (label === 'Sair') {
      sair();
      navigate('/login', { replace: true });
      return;
    }
    if (label === 'Entrar') {
      navigate('/login');
      return;
    }
    if (label === 'Notificações e lembretes') {
      if (!permissaoNotif) {
        void ativarNotificacoes();
      } else {
        navigate('/reminders');
      }
      return;
    }
    setAviso(`${label} em breve.`);
  };

  // nome exibido (visitante usa o rascunho local também)
  const nome = sessao ? nomeAtual : (nomeRascunho.trim() || 'Visitante');
  const email = sessao?.usuario.email ?? 'Faça login para sincronizar suas plantas';

  const estatisticas: Array<{ valor: string | number; rotulo: string }> = sessao
    ? [
        { valor: resumo?.total_plantas ?? '…', rotulo: 'Plantas' },
        { valor: resumo?.total_pastas ?? '…', rotulo: 'Coleções' },
        { valor: resumo?.total_com_local ?? '…', rotulo: 'Com local' },
      ]
    : [
        { valor: locais?.plantas ?? 0, rotulo: 'Plantas' },
        { valor: locais?.pastas ?? 0, rotulo: 'Coleções' },
        { valor: locais?.comLocal ?? 0, rotulo: 'Com local' },
      ];

  return (
    <div className="profile-container">
      <div className="profile-scroll">
        <div className="profile-header">
          <button
            type="button"
            className={`profile-avatar-large avatar-clickable ${avatarPorCodigo(avatarAtual) ? '' : 'visitante'}`}
            onClick={() => setEscolhendoAvatar(true)}
            aria-label="Trocar foto do perfil"
          >
            {avatarPorCodigo(avatarAtual) ? (
              <img src={avatarPorCodigo(avatarAtual)!.svg} alt="Avatar" className="profile-avatar-img" />
            ) : (
              <span className="profile-initial">{nome.trim().charAt(0).toUpperCase() || '?'}</span>
            )}
            <span className="avatar-edit-badge">
              <Pencil size={14} color="#ffffff" />
            </span>
          </button>

          {editandoNome ? (
            <div className="nome-editando">
              <input
                type="text"
                className="nome-input"
                value={nomeRascunho}
                autoFocus
                maxLength={60}
                onChange={(e) => setNomeRascunho(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void salvarNome();
                  if (e.key === 'Escape') setEditandoNome(false);
                }}
              />
              <button type="button" className="nome-btn confirmar" onClick={() => void salvarNome()} aria-label="Salvar nome">
                <Check size={18} color="#ffffff" />
              </button>
              <button type="button" className="nome-btn cancelar" onClick={() => setEditandoNome(false)} aria-label="Cancelar">
                <X size={18} color="#ffffff" />
              </button>
            </div>
          ) : (
            <button type="button" className="profile-name-editable" onClick={() => { setNomeRascunho(nome); setEditandoNome(true); }}>
              <h1 className="profile-name">{nome}</h1>
              <Pencil size={15} color="#999" />
            </button>
          )}

          <p className="profile-email">{email}</p>
        </div>

        <div className="stats-section">
          {estatisticas.map((estatistica) => (
            <div className="stat-card" key={estatistica.rotulo}>
              <span className="stat-number">{estatistica.valor}</span>
              <span className="stat-label">{estatistica.rotulo}</span>
            </div>
          ))}
        </div>

        {erro && <p className="profile-notice error">{erro}</p>}
        {aviso && !erro && <p className="profile-notice">{aviso}</p>}

        <div className="menu-section">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                className={`menu-item ${item.danger ? 'danger' : ''}`}
                onClick={() => aoClicarNoMenu(item.label)}
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

      {/* Modal: escolher avatar pré-definido */}
      {escolhendoAvatar && (
        <div className="avatar-modal-overlay" onClick={() => setEscolhendoAvatar(false)}>
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-modal-header">
              <h2>Escolha seu avatar</h2>
              <button type="button" onClick={() => setEscolhendoAvatar(false)} aria-label="Fechar">
                <X size={22} color="#555" />
              </button>
            </div>
            <div className="avatar-grid">
              {AVATARES.map((av) => (
                <button
                  key={av.codigo}
                  type="button"
                  className={`avatar-opcao ${avatarAtual === av.codigo ? 'selecionado' : ''}`}
                  onClick={() => void salvarAvatar(av.codigo)}
                  disabled={ocupado}
                >
                  <img src={av.svg} alt={av.nome} />
                  {avatarAtual === av.codigo && (
                    <span className="avatar-check">
                      <Check size={14} color="#ffffff" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
              <div className={item.isCamera ? 'camera-circle' : 'nav-circle'}>
                <Icon size={24} color={item.isCamera || isActive ? 'white' : undefined} />
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
