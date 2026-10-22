# Boots'N Pots - Scripts de Inicialização

## Estrutura de Pastas

```
Boots'N Pots-Web/
├── scripts/           # Scripts de automação
│   ├── start.bat
│   ├── auto-start.bat
│   ├── setup.bat
│   ├── check-status.bat
│   ├── server-manager.ps1
│   └── start-on-login.ps1
├── docs/              # Documentação
│   ├── README.md
│   ├── README-SCRIPTS.md
│   └── RESUMO-TCC.md
├── src/               # Código fonte
├── public/            # Arquivos públicos
└── ...
```

## Scripts Disponíveis

### 1. start.bat
- **Uso**: Inicia o servidor de desenvolvimento
- **Comportamento**: Reinicia automaticamente se o servidor parar
- **Para parar**: Ctrl+C

### 2. auto-start.bat
- **Uso**: Servidor com monitoramento contínuo
- **Comportamento**: Verifica o servidor a cada 10 segundos e reinicia se necessário
- **Ideal para**: Manter o servidor online o tempo todo

### 3. server-manager.ps1 (PowerShell)
- **Uso**: Gerenciador avançado do servidor
- **Opções**:
  - Iniciar servidor
  - Parar servidor
  - Verificar status
- **Para usar**: `.\server-manager.ps1`

### 4. setup.bat
- **Uso**: Configuração inicial do projeto
- **Verifica**: Node.js, npm, dependências e logo

### 5. check-status.bat
- **Uso**: Verifica se o servidor está rodando
- **Mostra**: Status do servidor e porta

### 6. start-on-login.ps1
- **Uso**: Inicia automaticamente no login do Windows
- **Para usar**: Adicionar ao Task Scheduler

## Como Usar

### Para iniciar o servidor pela primeira vez:
1. Execute `scripts/setup.bat` para configurar o ambiente
2. Execute `scripts/start.bat` ou `scripts/auto-start.bat`

### Para iniciar o servidor normalmente:
- Execute `scripts/start.bat` (mais simples)
- Ou execute `scripts/auto-start.bat` (mais robusto)

### Para gerenciar o servidor:
- Execute `scripts/server-manager.ps1` para opções avançadas

### Para verificar status:
- Execute `scripts/check-status.bat`

## URLs de Acesso

- **Local**: http://localhost:5173/
- **Rede**: http://192.168.0.228:5173/

## Solução de Problemas

### Se o servidor não iniciar:
1. Verifique se o Node.js está instalado: `node --version`
2. Execute `scripts/setup.bat` para reinstalar dependências
3. Verifique se a porta 5173 está livre

### Para parar todos os processos:
```powershell
Get-Process -Name "node" | Stop-Process -Force
```
