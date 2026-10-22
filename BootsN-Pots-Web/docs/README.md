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

## App Android (Capacitor)

O projeto web foi convertido em app Android com [Capacitor 8](https://capacitorjs.com) — todo o código React é reaproveitado.

### Estrutura

```
BootsN-Pots-Web/
├── android/               # Projeto Android nativo (gerado pelo Capacitor)
├── capacitor.config.ts    # Configuração (appId: com.bootsnpots.app)
└── dist/                  # Build web copiado para o Android
```

### Requisitos (build do APK)

- Node.js 18+
- JDK 21 (ex.: [Temurin](https://adoptium.net))
- Android SDK (cmdline-tools, platform 36, build-tools 36)

### Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run app:sync` | Build web + sincroniza com o projeto Android |
| `npm run app:apk` | Gera o APK debug em `android/app/build/outputs/apk/debug/` |
| `npm run app:apk:release` | Gera o APK release (requer keystore configurado) |
| `npm run app:open` | Abre o projeto no Android Studio |

### Instalação no celular

1. Copie o `.apk` para o celular
2. Toque no arquivo e permita "fontes desconhecidas" se solicitado
3. Abra o app **Boots'N Pots**

### Ícones e Splash

Gerados a partir de `public/logoTCC.png` com `@capacitor/assets`:

- Assets-fonte em `assets/` (`icon.png`, `icon-foreground.png`, `icon-background.png`, `splash.png`)
- Para regerar após mudar o logo: `npx capacitor-assets generate --android`

### Câmera nativa

- Plugin `@capacitor/camera` — captura fotos reais no app Android (abre a câmera nativa)
- Botão de galeria escolhe foto existente; após capturar, há opção de repetir ou confirmar
- A foto capturada aparece no topo da tela de detalhe da planta
- No navegador (demo web), o comportamento é mantido sem plugin (fallback)

### Assinatura do release (APK assinado)

- Keystore: `android/keystore/bootsnpots.keystore` (alias `bootsnpots`, validade ~27 anos)
- Senhas em `android/key.properties` — **ambos estão no `.gitignore` e NUNCA devem ser versionados ou perdidos** (sem eles não é possível publicar atualizações do mesmo app)
- `npm run app:apk:release` gera o release assinado em `android/app/build/outputs/apk/release/`

> Nota: o APK debug serve para testes/demonstração. Para publicar na Play Store é necessário o release assinado (acima) e, eventualmente, gerar um `.aab` com `gradlew bundleRelease`.

## Desenvolvedores

- **Boots'N Pots Team** - TCC Fatec
