# Design system

Marca: **Full Lock**. Proposta: rastreamento e monitoramento. A logo em `arquivosContext/FullLockLogo.png` é a fonte visual do produto. As lâminas de operação continuam valendo para densidade de painel e para o uso controlado do nome "Full Lock" na interface.

A marca é um cadeado de carvão com pin de localização e arco vermelho de sinal. Não é um alarme. A interface usa preto, branco e cinza. O vermelho só marca ação crítica, item ativo e erro.

## Cor

Amostradas da logo. O vermelho sólido da barra e do arco fica em `#E1262D`. O cadeado fica em torno de `#3A3A3A`.

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-brand` | `#E1262D` | Sinal, item ativo, erro, lacuna |
| `--color-brand-strong` | `#C31D24` | Hover da marca |
| `--color-charcoal` | `#3A3A3A` | Estrutura, cadeado, texto de marca |
| `--color-ink` | `#111111` | Texto principal |
| `--color-ink-muted` | `#6B6B6B` | Texto secundário |
| `--color-sidebar` | `#111111` | Navegação. A logo fica num quadro `#F7F7F7`, a mesma cor do arquivo |
| `--color-sidebar-text` | `#F8F8F8` | Texto da navegação |
| `--color-canvas` | `#F4F4F5` | Fundo da área de trabalho |
| `--color-surface` | `#FFFFFF` | Cards e tabelas |
| `--color-line` | `#E4E4E4` | Divisores |
| `--color-success` | `#2F9E4F` | Concluído, bloco coberto |
| `--color-info` | `#3D6F9A` | Baixando, conexão |
| `--color-warning` | `#C98232` | Pendente, pausado |
| `--color-danger` | `#E1262D` | Erro e lacuna. É o vermelho da marca, não um segundo vermelho |

## Cor

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-brand` | `#A90809` | Marca, item ativo da sidebar, ênfase |
| `--color-brand-strong` | `#8E0707` | Hover da marca |
| `--color-ink` | `#101010` | Texto principal e títulos |
| `--color-ink-muted` | `#5C5C5C` | Texto secundário |
| `--color-sidebar` | `#101018` | Fundo da navegação |
| `--color-sidebar-text` | `#F8F8F8` | Texto da navegação |
| `--color-canvas` | `#F8F8F8` | Fundo da área de trabalho |
| `--color-surface` | `#FFFFFF` | Cards e tabelas |
| `--color-line` | `#E0E0E0` | Divisores e borda de card |
| `--color-success` | `#48B05E` | Concluído |
| `--color-info` | `#3275BB` | Baixando / em progresso |
| `--color-warning` | `#C98232` | Pendente |
| `--color-danger` | `#A90809` | Erro, arquivo corrompido, alerta crítico |

Erro reutiliza o vermelho da marca. Não introduzir um segundo vermelho.

Status nunca depende só da cor. Todo chip leva rótulo: Concluído, Baixando, Pendente, Com erro.

## Tipografia

- Interface e títulos: `Inter`, a substituta livre da Söhne (fonte de produto da OpenAI), com a mesma pilha de sistema: `ui-sans-serif`, `system-ui`, `Segoe UI`
- Títulos em sentence case, peso 600. Sem condensada e sem caixa alta de display
- Não usar fonte display no corpo, em placa, em número de KPI secundário ou em formulário

Escala:

| Token | Tamanho | Uso |
| --- | --- | --- |
| `--text-display` | 32px / 700 | Título da página |
| `--text-title` | 20px / 650 | Título de card ou seção |
| `--text-body` | 14px / 400 | Texto e células |
| `--text-label` | 12px / 600 | Rótulo, coluna, chip. Pode ir em caixa alta com tracking curto |

## Espaço e forma

Base de 4px.

| Token | Valor |
| --- | --- |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |
| `--space-7` | 48px |

- Raio de card e input: 8px
- Raio de chip de status: 999px
- Sombra de card: nenhuma, ou `0 1px 2px rgb(16 16 16 / 6%)`. Separar com borda `--color-line`
- Sidebar fixa, cerca de 240px, item ativo com fundo da marca
- Conteúdo em coluna, com faixas de KPI no topo e tabela abaixo, como nas lâminas
- Largura útil do painel: preencher a viewport. Não centralizar como site institucional

## Componentes

A base visual do painel está em `src/presentation`. Seguem os tokens deste arquivo:

- Logo da Full Lock na placa branca da sidebar. Não redesenhar o cadeado em CSS
- Shell com grupos: Operação, Frota, Evidências, Sistema
- Tagline da marca: Rastreamento e monitoramento. Não repetir no título de cada tela
- Card de KPI com número, rótulo e participação
- Tabela operacional: veículo, placa, status, câmeras, duração, última atualização
- Chip de status
- Barra de progresso para item em download
- Donut apenas como resumo do total; a tabela é a fonte, o gráfico não substitui a lista
- Empty state e estado de erro de carregamento, sem ilustração decorativa

## Referências

- `arquivosContext/FullLockLogo.png` — logo Full Lock
- `public/logo-full-lock.png` — a mesma logo servida no painel
- `arquivosContext/WhatsApp Image 2026-09-10 at 17.52.35.jpeg` — arquitetura e dashboard
- `arquivosContext/WhatsApp Image 2026-09-10 at 17.52.36 (1).jpeg` — fluxo e painel de descarga

Não copiar o texto comercial das lâminas para a interface. A UI fala o estado da operação: placa, status, câmera, horário.
