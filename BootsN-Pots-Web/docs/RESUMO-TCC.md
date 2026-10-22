# Boots'N Pots - Resumo do Projeto

## Visão Geral
Aplicação web para **identificação de plantas** usando captura de fotos, permitindo ao usuário descobrir, catalogar e aprender sobre espécies botânicas.

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React | 19.2.8 |
| **Linguagem** | TypeScript | 6.0.2 |
| **Build Tool** | Vite | 8.2.0 |
| **Roteamento** | React Router DOM | 7.18.2 |
| **Ícones** | Lucide React | 1.32.0 |
| **Linter** | OxLint | 1.75.0 |

## Funcionalidades

1. **Tela de Boas-vindas** (`/`) - Apresentação do app com carousel de 4 páginas
2. **Login** (`/login`) - Autenticação com email/senha e login social (Google/Apple)
3. **Tela Principal** (`/home`) - Dashboard com últimas descobertas, plantas populares e busca
4. **Busca** (`/search`) - Pesquisa por nome ou espécie com filtros por categorias
5. **Câmera** (`/camera`) - Captura de fotos para identificação de plantas
6. **Coleção** (`/collection`) - Organização em pastas (Minhas Plantas, Favoritas, Medicinais)
7. **Perfil** (`/profile`) - Dados do usuário e configurações
8. **Detalhes da Planta** (`/plant-detail`) - Informações completas: rega, luz solar, temperatura, uso

## Arquitetura

```
BootsN-Pots-Web/
├── src/
│   ├── App.tsx              # Roteamento principal (HashRouter)
│   ├── AnimatedLayout.css   # Animações de transição entre páginas
│   ├── index.css            # Estilos globais e theme
│   ├── main.tsx             # Entry point
│   └── pages/               # 8 páginas (componentes React)
│       ├── Welcome.tsx/css
│       ├── Login.tsx/css
│       ├── Home.tsx/css
│       ├── Search.tsx/css
│       ├── Camera.tsx/css
│       ├── Collection.tsx/css
│       ├── Profile.tsx/css
│       └── PlantDetail.tsx/css
├── public/                  # Assets estáticos (favicon, ícones)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .oxlintrc.json           # Configuração do linter
```

## Design Patterns

- **Componentes funcionais** com hooks (`useState`, `useEffect`, `useRef`)
- **CSS Modules** (arquivos `.css` separados por componente)
- **Layout responsivo** com simulação de frame de celular (max-width: 430px)
- **Animações** de transição slide entre páginas
- **Navegação inferior** fixa com botão central de câmera

## Deploy

- **Plataforma:** Render (Hospedagem estática)
- **Repositório:** GitHub
- **Build:** `tsc -b && vite build`
- **Roteamento:** HashRouter (compatível com hospedagem estática)

## Banco de Dados (Planejado)
- Atualmente usa dados mockados (hardcoded)
- Futuro: integração com API de identificação de plantas
- Banco de dados para coleção de plantas

## Funcionalidades Futuras
- Autenticação real com backend
- API de identificação por IA (machine learning)
- Banco de dados para persistência
- Sistema de favoritos
- Notificações
