# Boots'N Pots - Web

Aplicação web para identificação de plantas utilizando inteligência artificial.

## Funcionalidades

- **Splash Screen** - Tela de apresentação com logo animada
- **Welcome Screen** - Tela de boas-vindas com funcionalidades do app
- **Login** - Autenticação do usuário
- **Home** - Página principal
- **Search** - Busca de plantas
- **Camera** - Captura de fotos para identificação
- **Collection** - Coleção de plantas identificadas
- **Profile** - Perfil do usuário
- **Plant Detail** - Detalhes da planta identificada

## Tecnologias

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Estilo**: CSS puro com variáveis
- **Ícones**: Lucide React
- **Roteamento**: React Router DOM

## Estrutura do Projeto

```
Boots'N Pots-Web/
├── public/            # Arquivos públicos (logo, etc.)
├── src/
│   ├── components/    # Componentes reutilizáveis
│   ├── pages/         # Páginas do aplicativo
│   ├── assets/        # Imagens e recursos
│   ├── App.tsx        # Componente principal
│   ├── main.tsx       # Ponto de entrada
│   └── index.css      # Estilos globais
├── scripts/           # Scripts de automação
├── docs/              # Documentação
└── ...
```

## Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Passos

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Visualiza build de produção |
| `npm run lint` | Executa linting com Oxlint |

## Scripts de Automação

Na pasta `scripts/`:

| Script | Descrição |
|--------|-----------|
| `start.bat` | Inicia servidor com reinicialização automática |
| `auto-start.bat` | Servidor com monitoramento contínuo |
| `setup.bat` | Configuração inicial do ambiente |
| `check-status.bat` | Verifica status do servidor |
| `server-manager.ps1` | Gerenciador avançado (PowerShell) |

## Acesso

- **Local**: http://localhost:5173/
- **Rede**: http://192.168.0.228:5173/

## Documentação

- [Scripts de Inicialização](docs/README-SCRIPTS.md)
- [Resumo do TCC](docs/RESUMO-TCC.md)

## Desenvolvedores

- **Boots'N Pots Team** - TCC Fatec
