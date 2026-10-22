import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Folder, User, Home as HomeIcon, Search as SearchIcon,
  ArrowLeft, Droplets, Bell, BellOff, Trash2, Check,
} from 'lucide-react';
import { lerSessao } from '../services/api';
import { listarColecao, abrirFotoDaColecao } from '../services/colecao';
import type { PlantaSalva } from '../services/colecao';
import {
  criarLembrete, listarLembretes, removerLembrete, temPermissao, pedirPermissao,
  type Lembrete,
} from '../services/lembretes';
import './Reminders.css';

const navItems = [
  { path: '/home', icon: HomeIcon, label: 'Início' },
  { path: '/search', icon: SearchIcon, label: 'Busca' },
  { path: '/camera', icon: Camera, label: 'Câmera', isCamera: true },
  { path: '/collection', icon: Folder, label: 'Coleção' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

/** Opções de frequência de rega (dias). */
const FREQUENCIAS = [
  { rotulo: 'Todo dia', dias: 1 },
  { rotulo: 'A cada 2 dias', dias: 2 },
  { rotulo: 'A cada 3 dias', dias: 3 },
  { rotulo: 'Semanal', dias: 7 },
  { rotulo: 'Quinzenal', dias: 15 },
];

/** Formata epoch ms → "dd/mm às hh:mm". */
function formatarQuando(ms: number): string {
  const d = new Date(ms);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes} às ${hora}:${min}`;
}

/** Dias restantes até o próximo aviso. */
function diasRestantes(ms: number): number {
  return Math.max(0, Math.ceil((ms - Date.now()) / 86400000));
}

export default function Reminders() {
  const navigate = useNavigate();

  const [plantas, setPlantas] = useState<Array<{ id: number } & PlantaSalva>>([]);
  const [lembretes, setLembretes] = useState<Lembrete[]>(listarLembretes());
  const [fotos, setFotos] = useState<Record<number, string>>({});
  const [permissao, setPermissao] = useState(temPermissao());
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [aberto, setAberto] = useState<number | null>(null); // painel aberto p/ agendar

  useEffect(() => {
    // usa a posição na coleção como id estável p/ amarrar o lembrete
    const lista = listarColecao().map((p, i) => ({ id: i, ...p }));
    setPlantas(lista);
    // carrega as fotos locais (async)
    let ativo = true;
    lista.forEach((planta) => {
      if (!planta.foto) return;
      void abrirFotoDaColecao(planta).then((foto) => {
        if (ativo && foto) setFotos((anterior) => ({ ...anterior, [planta.id]: foto }));
      });
    });
    return () => {
      ativo = false;
    };
  }, []);

  const sessao = lerSessao();

  // indice lembrete por planta (idPlanta), p/ mostrar status na lista
  const lembretePorPlanta = useMemo(() => {
    const mapa = new Map<number, Lembrete>();
    for (const l of lembretes) {
      if (!mapa.has(l.idPlanta)) mapa.set(l.idPlanta, l);
    }
    return mapa;
  }, [lembretes]);

  async function garantirPermissao(): Promise<boolean> {
    if (permissao) return true;
    const ok = await pedirPermissao();
    setPermissao(ok);
    if (!ok) setAviso('Autorize as notificações para receber lembretes.');
    return ok;
  }

  async function agendar(planta: { id: number } & PlantaSalva, dias: number): Promise<void> {
    if (ocupado) return;
    const ok = await garantirPermissao();
    if (!ok) return;
    setOcupado(true);
    try {
      const nome = planta.nome || planta.nomeCientifico;
      // remove lembrete antigo da mesma planta (re-agendar)
      const antigo = lembretePorPlanta.get(planta.id);
      if (antigo) removerLembrete(antigo.id);
      await criarLembrete(planta.id, nome, `💧 Hora de regar sua ${nome}!`, dias, dias);
      setLembretes(listarLembretes());
      setAberto(null);
      setAviso(`Lembrete criado: ${nome}, ${dias === 1 ? 'todo dia' : `a cada ${dias} dias`}. 🌱`);
    } catch {
      setAviso('Não foi possível criar o lembrete.');
    } finally {
      setOcupado(false);
    }
  }

  function cancelar(id: string): void {
    removerLembrete(id);
    setLembretes(listarLembretes());
    setAviso('Lembrete cancelado.');
  }

  return (
    <div className="reminders-container">
      <div className="reminders-scroll">
        <header className="reminders-header">
          <button type="button" className="reminders-voltar" onClick={() => navigate('/profile')}>
            <ArrowLeft size={22} color="#2d7d46" />
          </button>
          <div>
            <h1 className="reminders-title">Lembretes de rega</h1>
            <p className="reminders-subtitle">
              {sessao ? `Olá, ${sessao.usuario.nome.split(' ')[0]}! ` : ''}
              Escolha as plantas e a frequência de rega.
            </p>
          </div>
        </header>

        {!permissao && (
          <div className="permissao-card">
            <BellOff size={20} color="#c62828" />
            <div>
              <strong>Notificações desativadas</strong>
              <p>Ative para os avisos de rega aparecerem.</p>
            </div>
            <button type="button" onClick={() => void garantirPermissao()}>Ativar</button>
          </div>
        )}

        {aviso && <p className="reminders-aviso">{aviso}</p>}

        {plantas.length === 0 ? (
          <div className="reminders-vazio">
            <Droplets size={48} color="#a5d6a7" />
            <h2>Nenhuma planta salva ainda</h2>
            <p>Salve plantas na Coleção para poder lembrar de regá-las.</p>
            <button type="button" onClick={() => navigate('/camera')}>Descobrir plantas</button>
          </div>
        ) : (
          <ul className="reminders-lista">
            {plantas.map((planta) => {
              const lembrete = lembretePorPlanta.get(planta.id);
              const estaAberto = aberto === planta.id;
              const foto = fotos[planta.id] ?? null;
              return (
                <li key={planta.id} className="reminder-item">
                  <div className="reminder-linha">
                    <div className="reminder-foto">
                      {foto ? <img src={foto} alt={planta.nome} /> : <Droplets size={22} color="#2d7d46" />}
                    </div>
                    <div className="reminder-info">
                      <h3>{planta.nome || planta.nomeCientifico}</h3>
                      {lembrete ? (
                        <p className="reminder-status">
                          <Bell size={13} color="#2d7d46" /> Rega {diasRestantes(lembrete.quando)} dia(s) ·{' '}
                          {formatarQuando(lembrete.quando)}
                        </p>
                      ) : (
                        <p className="reminder-status off"><BellOff size={13} color="#999" /> Sem lembrete</p>
                      )}
                    </div>
                    {lembrete ? (
                      <button
                        type="button"
                        className="reminder-acao cancelar"
                        onClick={() => cancelar(lembrete.id)}
                        aria-label="Cancelar lembrete"
                      >
                        <Trash2 size={18} color="#c62828" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="reminder-acao"
                        onClick={() => setAberto(estaAberto ? null : planta.id)}
                        aria-label="Agendar lembrete"
                      >
                        <Bell size={18} color="#2d7d46" />
                      </button>
                    )}
                  </div>

                  {estaAberto && !lembrete && (
                    <div className="reminder-opcoes">
                      <p className="reminder-opcoes-titulo">Com que frequência regar?</p>
                      <div className="reminder-frequencias">
                        {FREQUENCIAS.map((f) => (
                          <button
                            key={f.dias}
                            type="button"
                            onClick={() => void agendar(planta, f.dias)}
                            disabled={ocupado}
                          >
                            <Check size={14} /> {f.rotulo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              className={`nav-item ${item.isCamera ? 'camera-button' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <div className={item.isCamera ? 'camera-circle' : 'nav-circle'}>
                <Icon size={24} color={item.isCamera ? 'white' : undefined} />
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
