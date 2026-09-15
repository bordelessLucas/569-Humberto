# Contexto do projeto — Full Lock

Documento mestre do produto. Fonte de verdade para agentes e desenvolvedores.

Atualizado após o novo levantamento com o cliente. Substitui a leitura anterior que tratava o entregável principalmente como “painel Firebase”. Informações antigas que continuam válidas foram preservadas; hipóteses não confirmadas foram rebaixadas a pendência ou removidas como requisito.

**Nome comercial atual:** Full Lock (o cliente pode alterar depois).  
**Repositório / projeto técnico:** Humberto (`humberto-f88f5`).  
**Marca visual:** logo oficial do cliente (Lock Brasil / Full Lock). Arquivos em tamanhos com e sem fundo — tratar como ativo de design; a interface pode usar o que já está em `public/` até receber o pacote completo.

---

## 1. Problema que o produto resolve

Quando um veículo chega a uma garagem/base e entra no Wi-Fi local, o sistema deve:

1. detectar o equipamento;
2. identificar o veículo;
3. validar se pode processar;
4. descobrir o que já foi baixado e o que ainda falta;
5. descarregar automaticamente os vídeos pendentes;
6. gravar nos discos do **servidor local daquela base**;
7. validar o resultado;
8. registrar histórico e status;
9. expor isso no painel e nos relatórios.

O painel administrativo **não é o produto sozinho**. Ele controla e observa um processo operacional cujo núcleo é a ingestão local de vídeo.

```text
veículo → Wi-Fi da base → identificação → validação → descoberta de pendências
       → download → armazenamento local → validação → histórico / status
```

**Prioridade máxima do MVP:** detectar → identificar → validar → descobrir pendências → baixar → armazenar localmente → validar → registrar histórico → exibir status.

---

## 2. O que é e o que não é este produto

### Full Lock (este projeto)

- Identificação na base
- Descoberta de arquivos no equipamento
- Controle do que já foi / o que falta
- Download e armazenamento **local**
- Fila, progresso, erro, retomada
- Histórico e relatórios operacionais
- Cadastros necessários à operação (bases, veículos, empresas, usuários, equipamentos)

### Plataforma do fabricante do equipamento (fora do núcleo)

Equipamentos tipicamente oferecem ADAS, DMS, GPS, gravação, Wi-Fi, alertas de sonolência, uso de telefone, fotos e clipes de alerta.

**Não recriar** o monitoramento online do fabricante no MVP. Não misturar ADAS/DMS com o motor de descarga.

### O painel web

Interface de acompanhamento e administração. Não executa o download binário no browser. Operações longas **não podem** depender da aba do navegador estar aberta.

---

## 3. Núcleo do MVP (obrigatório)

| # | Capacidade | Obrigatória no MVP |
| --- | --- | --- |
| 1 | Detectar equipamento na rede da base | Sim |
| 2 | Identificar veículo | Sim (método pendente de datasheet) |
| 3 | Validar autorização | Sim (regras configuráveis) |
| 4 | Descobrir arquivos/períodos e comparar com histórico | Sim |
| 5 | Download incremental (só o que falta) | Sim |
| 6 | Armazenar vídeo no disco local da base | Sim |
| 7 | Validar transferência (completo / erro / parcial) | Sim |
| 8 | Persistir histórico e última sincronização | Sim |
| 9 | Dashboard com status reais do motor | Sim |
| 10 | Relatório operacional (o que falhou / ficou pendente) | Sim |
| 11 | Cadastro de usuários (criar / desativar) | Sim (papéis ainda sugeridos) |
| 12 | Conversão MP4 + corte 15 min (padrão Enel nas lâminas) | Presente nas lâminas; tratar como etapa de processamento **local** após (ou junto) do download — **não** como substituto do motor de descarga |
| 13 | Upload de vídeo para nuvem | **Não** |
| 14 | Exclusão automática de vídeo | **Não** nesta fase (exclusão manual) |
| 15 | Recriar ADAS/DMS do fabricante | **Não** |

---

## 4. Decisões confirmadas pelo cliente

1. **Vídeos não vão para a nuvem.** Cada base tem servidor físico; arquivos nos HDs locais. Troca física de discos é cenário inicial aceito.
2. **Múltiplas bases** (ex.: Rio, Minas; ordem de grandeza citada ~10). Arquitetura multi-base desde o início; MVP pode validar em uma base.
3. **Veículo não pertence permanentemente a uma base.** Frota dinâmica: troca de garagem, venda, oficina, dias fora, retorno em outra base. A base processa qualquer veículo **autorizado** que chegar.
4. **Empresa/cliente no veículo** (ex.: Light, Enel), via atributo de dados — **não** por sufixo na placa (`PLACA-L` / `PLACA-E` descartados).
5. **Histórico persistente** de períodos baixados / pendentes; veículo pode ficar dias sem visitar a base e acumular backlog.
6. **Múltiplas câmeras** por veículo (lâminas e dashboard indicam acompanhamento individual; tipicamente 3).
7. **Exclusão de vídeo:** manual nesta fase.
8. **Download na LAN** não deve depender desnecessariamente de internet externa.
9. **Vários modelos** de câmera/MDVR possíveis no futuro; primeiro modelo real ainda a ser confirmado pelo cliente.
10. **Nome atual:** Full Lock (pode mudar).

Hipóteses técnicas levantadas em conversa (Firebase Blaze, Cloud Functions, custos de plano, etc.) **não** são requisitos do cliente. Escolha de infraestrutura segue o comportamento confirmado do produto.

---

## 5. Modelo conceitual (domínio)

### Relacionamentos corretos

```text
Client / Company  (Light, Enel, futuros)
       │
       └── Vehicle  (independente de base)
              │
              ├── Device(s) / MDVR
              │      └── Camera(s)  (1..N)
              │
              └── DownloadSession  (ocorrência: veículo X na base Y, em um momento)
                     ├── garageId / baseId
                     ├── status, progresso, erros
                     └── DownloadFile[]  (por câmera / período / arquivo)
```

- **Base (Garage):** local com Wi-Fi, servidor e discos. Não “dona” permanente do veículo.
- **Vehicle:** entidade móvel; `clientId` (ou equivalente); identificação (placa configurada no equipamento — método de leitura ainda pendente).
- **DownloadSession / Sync:** o vínculo operacional veículo ↔ base no tempo.
- **Histórico:** períodos/arquivos disponíveis, baixados, pendentes, falhos; última sincronização concluída.
- **User:** acesso ao painel (papéis ainda sugeridos).

### O que o código atual modela de forma incompatível

- `Vehicle.garageId` **obrigatório e permanente** em `src/domain/types.ts` — deve deixar de ser vínculo fixo; a base da sessão fica em `Connection` / `SyncRun` / `MediaFile.garageId` / futura `DownloadSession`.
- Não existe entidade `Client` / `Company` no domínio.
- Retenção automática (`StoragePolicy.autoDelete`, `runRetention`) contradiz exclusão manual desta fase.

### Estados recomendados (máquina simples e extensível)

Estados sugeridos para sessão/arquivo (nomes podem variar na implementação):

| Estado | Significado |
| --- | --- |
| `detectado` | Equipamento visto na rede |
| `aguardando_validacao` | Identificando / checando regras |
| `nao_autorizado` | Bloqueado; motivo registrado |
| `pendente` | Há conteúdo a baixar |
| `na_fila` | Agendado |
| `baixando` | Transferência ativa |
| `pausado` / `interrompido` | Parou; parcial preservado |
| `parcial` | Terminou a janela com falha parcial |
| `concluido` | Validado e registrado no histórico |
| `erro` | Falha; retry / investigação |

Transições de referência:

```text
detectado → aguardando_validacao → nao_autorizado
                              └→ pendente → na_fila → baixando → concluido
                                                 └→ interrompido → (retoma) baixando
                                                 └→ erro
```

O dashboard atual usa `concluido | baixando | pendente | erro | conectado | desconectado` no veículo — útil como resumo, mas o motor precisa dos estados de sessão/arquivo acima.

---

## 6. Fluxo operacional de referência (download)

1. Veículo entra na garagem  
2. Equipamento conecta no Wi-Fi  
3. Serviço **local** detecta o equipamento  
4. Sistema tenta identificar o veículo  
5. Verifica cadastro / ativo / empresa / autorização da base  
6. Consulta histórico do veículo  
7. Identifica arquivos/períodos não processados  
8. Monta fila de download  
9. Transfere; registra progresso e câmera/origem  
10. Grava no armazenamento local  
11. Valida integridade da transferência  
12. Marca concluído ou erro; atualiza última sincronização  
13. Atualiza dashboard e dados de relatório  

Necessidades técnicas (mesmo se ainda não implementadas): retomada, retries, saída da rede no meio, arquivo parcial, deduplicação, vários veículos em paralelo, várias câmeras no mesmo veículo.

---

## 7. Fluxos operacionais documentados

### Fluxo A — Primeira chegada

Conecta → detectado → identificação → validação → associação/cadastro se aplicável → listagem → comparação com histórico vazio → download → validação → conclusão.

### Fluxo B — Veículo recorrente

Detectado → histórico encontrado → só conteúdo novo → download incremental → atualizar histórico.

### Fluxo C — Vários dias fora

Detectado → comparar última sincronização → localizar backlog → fila cronológica → baixar faltantes → atualizar histórico.

### Fluxo D — Outra base

Base B detecta → identificação/histórico → autorização → processa → sessão registrada na Base B. **Sem** transferência cadastral manual de veículo entre bases.

### Fluxo E — Download interrompido

Baixando → perda de conexão → registrar parcial → manter pendência → retomar quando possível.

### Fluxo F — Não autorizado

Detectado → validação falha → download bloqueado → registrar motivo → dashboard/log.

### Fluxo G — Relatório diário

Consolidar sessões → concluídos / parciais / pendentes / erros → por base → exportação (PDF/Excel citados pelo cliente). Geração automática diária: **fluxo proposto**, não obrigação fechada do MVP até confirmação.

---

## 8. Dashboard operacional

Indicadores no topo (alinhados ao mock do cliente):

- Concluídos · Baixando · Pendentes · Com erro · Total  

Listagem: veículo, placa, cliente/empresa, base, câmera/equipamento, status, progresso, tempo/duração quando possível, última atualização, última descarga, arquivos (total / concluídos / pendentes), erros.

**Não inventar métricas.** O dashboard deve refletir o motor de download (hoje o painel ainda reflete o mock/simulação).

Relatórios: filtros por período, base, veículo, empresa, status, pendências, erros; exportação PDF/Excel desejada.

---

## 9. Usuários e acesso (sugestão — não decisão final)

| Papel | Sugestão |
| --- | --- |
| Administrador | Usuários, veículos, empresas, bases, regras; vê todas as operações |
| Operador | Acompanha downloads, consulta veículos/erros, gera relatórios |

O código atual também tem **Auditor** e **Gestor**. Tratar os quatro papéis como **implementação atual / sugestão de UX**, até o cliente validar o modelo definitivo. Cadastro e desativação de usuários foram citados como necessidade.

---

## 10. Arquitetura alvo (reavaliação)

O núcleo roda **dentro da rede local de cada base**. Frontend + Firebase **sozinhos** não executam o motor de download.

### Componentes

```text
┌─────────────────────────────┐
│ Painel (SPA)                │  acompanha, cadastra, reporta
│ React + TanStack Query      │  não baixa binário do MDVR
└─────────────┬───────────────┘
              │ API / eventos (metadados e comandos)
┌─────────────▼───────────────┐
│ Persistência operacional    │  veículos, sessões, arquivos,
│ (por base e/ou central)     │  histórico, erros, usuários
└─────────────┬───────────────┘
              │
┌─────────────▼───────────────┐
│ Edge Agent / serviço local  │  descoberta, DeviceAdapter,
│ (um por base)               │  fila, download, retry,
│                             │  validação, gravação em disco,
│                             │  logs e eventos
└─────────────┬───────────────┘
              │ LAN
         MDVR / câmeras
```

### Onde Firebase (ou nuvem) ainda pode fazer sentido

- Autenticação do painel  
- Metadados operacionais **se** a operação aceitar dependência de internet para o painel  
- Analytics do SPA  

### Onde Firebase / nuvem **não** resolve

- Download do MDVR  
- Escrita dos vídeos nos HDs da base  
- Fila e retomada enquanto a internet externa está fora  
- Descoberta na LAN  

### Separação obrigatória

| Tipo | Onde |
| --- | --- |
| Arquivo de vídeo | Disco local da base |
| Metadado do sistema | Persistência operacional (local e/ou sincronizada) — decisão de topologia ainda **pendente** |

### Modularidade de equipamento

```text
DeviceAdapter / CameraAdapter
  └── implementações por fabricante/modelo (após datasheet)
```

Não assumir FTP, SMB, HTTP, RTSP ou SDK proprietário até análise do hardware.

### Escalabilidade comercial (sem inflar o MVP)

Evitar: Light/Enel hardcoded; uma base hardcoded; um modelo de câmera hardcoded; veículo preso a uma base; regras por sufixo de placa; um HD/uma câmera no modelo; credenciais no código; caminhos de arquivo espalhados.

---

## 11. Princípios de implementação

1. Priorizar funcionamento real antes de mock.  
2. Não fingir comunicação com câmera sem hardware/protocolo.  
3. Mocks claramente identificados (`origin: simulado` / modo mock).  
4. Não misturar ADAS/DMS com motor de descarga.  
5. Transferência independente da UI; estado persistente.  
6. Operações longas não dependem da página aberta.  
7. Idempotência; evitar download duplicado.  
8. Recuperação após reinício do servidor da base.  
9. Hardware atrás de adapter.  
10. Vídeo = local; exclusão = manual nesta fase.  
11. Logs suficientes para diagnóstico.  

---

## 12. Impactos do novo levantamento no projeto atual

Auditoria factual do repositório em `c:\borderless\projetos\569-Humberto` (SPA + mock/Firestore). **Nenhuma alteração de código nesta atualização de contexto.**

### Já atende

- Múltiplas câmeras por veículo (domínio `Camera`, seed com 3 câmeras, UI).  
- Múltiplas bases no cadastro (`Garage`, seed com mais de uma).  
- Painel com KPIs, fila simulada, progresso, pause/resume/retry no mock.  
- Separação presentation / domain / services; Firebase fora de `.tsx`.  
- Metadados de mídia com `garageId` e paths “locais” no mock (sem upload Firebase Storage implementado).  
- Docs já diziam que download real não cabe no SPA.  

### Atende parcialmente

- “Download automático”: só **simulação** (demo Caminhão 17); sem agente local.  
- “Vídeo local”: alinhado em discurso; sem serviço que grave em disco real.  
- Multi-base no dashboard admin; mas veículo ainda tem `garageId` fixo.  
- Histórico/pendentes no modelo mock; sem backlog real entre visitas.  
- Painel observa **e** comanda a fila no mock; motor local inexistente.  
- MP4 / 15 min / auditoria de lacuna: simulados nas lâminas e no demo; processamento local real ausente.  

### Não atende

- Edge Agent / motor de download na LAN.  
- `DeviceAdapter` e protocolo real.  
- Entidade/atributo **empresa/cliente** no veículo.  
- Veículo independente de base (modelo atual contradiz).  
- Exclusão manual dedicada (há retenção automática simulada).  
- Operação de descarga offline na base.  
- Relatórios PDF/Excel completos; filtros por empresa.  
- Validação “não autorizado” com motivo no dashboard (fluxo F).  

### Deve ser removido / refatorado

| Item | Motivo |
| --- | --- |
| `Vehicle.garageId` permanente | Frota dinâmica; sessão na base |
| Retenção automática como regra default | Exclusão manual nesta fase |
| Ausência de `clientId` / Company | Light/Enel e futuros clientes |
| Tratar PostgreSQL/Firebase como “o” próximo passo do núcleo | O núcleo é o agente local; persistência é suporte |
| Qualquer expectativa de Firebase Storage para vídeo | Contradiz requisito confirmado |
| Hardcode futuro Light/Enel / um modelo TRX | Escalabilidade |

### Dependências externas (bloqueiam o motor real)

- Modelo do primeiro MDVR + datasheet  
- Protocolo, descoberta na rede, autenticação, listagem de arquivos  
- Como a identificação (placa) é exposta  
- Servidor, APs, HDs, topologia, volume/dia, concorrência  
- Painel centralizado entre bases vs painel por servidor (não fechado)  
- Sincronização de metadados entre bases (não fechada)  

---

## 13. Estado técnico atual do repositório (fato)

```text
src/
  presentation/     telas (dashboard admin, frota, fila, evidências…)
  domain/           tipos do painel/mock atual
  services/api/     contrato REST, mock, HTTP, firestore-api
  services/database/firestore-store.ts   metadados na nuvem (fase atual)
  services/firebase.ts                   Auth + Firestore + Analytics
```

- `VITE_API_MODE`: `mock` | `firestore` | `real`  
- Não existe pasta/serviço de Edge Agent.  
- Não existe `DeviceAdapter` implementado.  
- Firebase Storage **não** é usado no código de aplicação para vídeo.  
- Integração fabricante: `integrationStatus: 'aguardando_fabricante'` no seed.  

O painel atual é útil para UX, cadastros e demonstração. **Não cumpre sozinho o MVP de descarga local.**

---

## 14. Pendências técnicas / aguardando cliente

Marcar tudo abaixo como **Pendente de validação** até resposta confirmada:

| Item | Status |
| --- | --- |
| Modelo exato do primeiro MDVR/câmera | Pendente de validação |
| Datasheet(s); até dois modelos alternativos | Pendente de validação |
| Protocolo de comunicação e descoberta na rede | Pendente de validação |
| Autenticação no equipamento | Pendente de validação |
| Formato da identificação do veículo (placa no device etc.) | Pendente de validação |
| Estrutura de pastas/arquivos no equipamento | Pendente de validação |
| Quantidade de streams/câmeras por modelo | Pendente de validação (lâminas sugerem 3) |
| Capacidade e quantidade de HDs; servidor; CPU/RAM; NICs; APs | Pendente de validação |
| Topologia de rede da base | Pendente de validação |
| Veículos simultâneos e volume médio de vídeo/dia | Pendente de validação |
| Política definitiva de autorização por base | Pendente de validação (configurável) |
| Painel centralizado vs por servidor | Pendente de validação |
| Sincronização de metadados entre bases | Pendente de validação |
| Papéis finais de usuário | Pendente de validação |
| Política futura de retenção de vídeo | Pendente de validação (hoje: exclusão manual) |
| Pacote completo de logos (tamanhos / com e sem fundo) | Pendente de recebimento se incompleto |
| Nome definitivo do produto | Full Lock por enquanto; pode mudar |
| Obrigação de relatório diário automático | Proposto; não fechado |
| Canal de alerta (só painel / e-mail / outro) | Pendente de validação |
| Stream vs download na consulta de vídeo no painel | Pendente de validação |

**Não inventar números** de throughput, tamanho de frota ou capacidade.

---

## 15. Ordem técnica sugerida de implementação

Não é cronograma contratado. É a ordem que desbloqueia o MVP real.

### Progresso atual (código)

| Etapa | Status |
| --- | --- |
| 1 Reestruturação do domínio | **Feito no domínio/mock/Firestore/UI** — `ClientCompany`, veículo sem `garageId` fixo, `lastSeenGarageId`, `SyncRun.sessionStatus`, `VehiclePeriodHistory`, retenção automática desligada |
| 2 Edge Agent + 1º adapter | **Esqueleto** em `src/services/edge/` — contrato `DeviceAdapter`, registry, adapter `pending-first-mdvr` que falha até datasheet. Sem protocolo inventado |
| 3 Histórico incremental | **Modelo + seed + UI** no detalhe do veículo; motor real ainda não alimenta |
| 4 Dashboard real | **UI alinhada ao domínio** (cliente, base vista, backlog no relatório). Ainda mock — eventos do agente virão depois |
| 5–8 | Pendentes |

### Etapa 1 — Reestruturação do domínio

Revisar: Base, Vehicle (sem base fixa), Client/Company, Device, Camera, DownloadSession, DownloadFile, User, histórico. Remover vínculos incorretos. Ajustar contrato da API e o mock para o novo modelo (ainda com mocks **identificados**).

### Etapa 2 — Motor local de integração (Edge Agent)

Serviço na base: descoberta, conexão, identificação, adapter do **primeiro** modelo real, listagem, fila, download, retry, logs, gravação em disco. Bloqueado até datasheet/hardware. Código: contrato + placeholder apenas.

### Etapa 3 — Histórico e download incremental

Arquivo processado/pendente, última sincronização, backlog, deduplicação, retomada.

### Etapa 4 — Dashboard operacional real

Ligar UI aos eventos do motor: concluído, baixando, pendente, erro, progresso, veículo, base, câmera, última atualização. Remover métricas só-simuladas onde o motor já existir.

### Etapa 5 — Cadastros e regras

Veículos, clientes, bases, equipamentos, usuários, autorização, ativar/desativar.

### Etapa 6 — Relatórios

Filtros, resumo diário, pendências, erros, exportação Excel/PDF.

### Etapa 7 — Robustez operacional

Concorrência, desconexões, retries, arquivos incompletos, recuperação após reinício, performance, múltiplos veículos.

### Etapa 8 — Compatibilidade adicional

Novos adapters conforme novos modelos/datasheets; motor independente do fabricante.

**Paralelo permitido:** refinar UX do painel e cadastros (Etapas 1/5) **sem** fingir que o download real já existe.

---

## 16. Decisões de escalabilidade a tomar cedo (sem over-engineering)

1. Identificadores estáveis de veículo e empresa (não placa como PK).  
2. Sessão de download como fato histórico (base + tempo), não “mudança de dono” do veículo.  
3. Contrato de eventos do agente → persistência → painel.  
4. Adapter por fabricante.  
5. Metadados: só local por base vs réplica central (pendente).  
6. Comandos do painel (pausar/retomar) como mensagens ao agente, não como lógica de transferência no browser.  

---

## 17. Referências internas

| Documento | Papel |
| --- | --- |
| `docs-ia/contexto.md` | Este arquivo — fonte de verdade do produto |
| `docs-ia/escopo.md` | Inventário funcional legado; **rever** pontos de retenção automática e vínculo veículo-base |
| `docs-ia/checklist_sprints.md` | Checklist operacional; alinhar à ordem da seção 15 |
| `docs-ia/design_system.md` | UI |
| `docs-ia/plano_dashboard_admin.md` | Plano do dashboard admin (UX) |
| `arquivosContext/` | Lâminas e material do cliente |

Em caso de conflito entre documentos, **prevalece este `contexto.md`**, atualizado pelo levantamento mais recente.

---

## 18. Resumo em uma frase

Full Lock é um sistema **híbrido** (software + infraestrutura local por base) para **automatizar a ingestão de grandes volumes de vídeo** de equipamentos veiculares quando os veículos entram no Wi-Fi das bases; o painel administra e observa essa operação — **não a substitui**.
