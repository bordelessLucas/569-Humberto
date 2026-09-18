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

**Atualização de equipamento (2026-09-18):** o cliente informou o uso do gravador **Hikvision AE-MD5043-SD/I/GLF/WI58** (NCM 8521.90.0). O arquivo recebido como `Manual 401 PTBR.pdf`, porém, identifica-se internamente como **MettaX MC401**, uma câmera veicular inteligente/dashcam com duas câmeras integradas. Tratar essa divergência como pendência crítica: confirmar se o PDF anexado é realmente do Hikvision AE-MD5043, se o MC401 também será usado na operação, ou se houve troca de manual.

**Pesquisa técnica consolidada (2026-09-18):** o retorno `Full_Lock_Pesquisa_Tecnica.pdf` indica dois caminhos reais de integração: Hikvision por **ISAPI** primeiro, com **HCNetSDK** como fallback; MettaX MC904/MC401 por **JT/T808/JT/T1078** com envio histórico via FTP local comandado por `0x9206`. A arquitetura local permanece: vídeo não sobe para a nuvem.

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
6. **Múltiplas câmeras** por veículo. Manual MC904: até **4** canais AHD 1080P (+ IP opcional → 5). Lâminas antigas citavam tipicamente 3.
7. **Exclusão de vídeo:** manual nesta fase.
8. **Download na LAN** não deve depender desnecessariamente de internet externa.
9. **Primeiro MDVR confirmado pelos manuais:** MettaX **MC904** (equipamento **no veículo**, não o roteador da garagem). Outros modelos possíveis no futuro via novos adapters.
10. **Nome atual:** Full Lock (pode mudar).

### Equipamento — o que os PDFs em `arquivosContext/` confirmam

Fontes: `user_manual_mc904.pdf`, `MC904 Product Parameters.pdf` (MettaX Digital, v1.0, 2024-04-23).

| Fato | Valor |
| --- | --- |
| O que é | MDVR / terminal veicular inteligente (grava no veículo) |
| O que **não** é | Roteador/AP da garagem |
| Fabricante | MettaX Digital (Shenzhen) |
| Modelo | MC904 (variantes regionais EU / LA / NA por banda celular) |
| OS / CPU | Linux; ARM Cortex CA9 Dual-Core + NPU |
| Gravação local no veículo | 2× TF/SD, até 512G cada; filesystem proprietário “car-specific” |
| Câmeras | 4× AHD até 1080P; IP opcional para 5º canal; H.264/H.265 |
| Wi-Fi | 2.4 GHz 802.11b/g/n — modos **AP** e **Station** (Station = candidato a entrar no Wi-Fi da base) |
| Celular | 4G (monitoramento remoto do fabricante — fora do núcleo Full Lock) |
| Protocolos de plataforma citados | JT/T808-2011/2019, JT/T1076-2016, **JT/T1078-2016** (candidato a vídeo) |
| Upgrade | U-disk, SD, **FTP remoto automático** (só documentado para firmware) |
| ADAS / DMS / BSD / 360 | Existentes no aparelho — **não** recriar no Full Lock |
| GUI local | Menu OSD, mouse, IR; senha usuário + admin |

**Sobre o nome “TRX-904”:** era hipótese anterior no projeto. Os manuais entregues falam **MC904**. Tratar MC904 como modelo oficial até o cliente dizer que TRX-904 é outro equipamento ou o mesmo rebranded.

### O que os manuais **ainda não** destravam (bloqueio restante do motor)

1. SDK / API / CMS para **listar e baixar** gravações pela LAN (Wi-Fi Station).  
2. Como a **placa / ID do veículo** é exposta na rede.  
3. Credenciais e autenticação para sessão de transferência.  
4. Layout real dos arquivos no cartão (não assumir montagem USB/FAT no PC da base).  
5. Confirmação prática: hardware na rede da garagem + IP/MAC observáveis.

**Hipótese técnica (não implementar às cegas):** JT/T1078 sobre a pilha JT/T808 é o caminho mais alinhado aos manuais para vídeo. FTP só está citado para upgrade — não usar como API de vídeo sem prova.

### Novo equipamento informado — Hikvision AE-MD5043-SD/I/GLF/WI58 e manual MC401

Fonte recebida em 2026-09-18: `C:\Users\Lorenzo\Downloads\Manual 401 PTBR.pdf`.

| Ponto | Leitura de auditoria |
| --- | --- |
| Equipamento citado pelo cliente | Gravador MDVR Hikvision AE-MD5043-SD/I/GLF/WI58, NCM 8521.90.0 |
| Conteúdo do PDF recebido | Manual de instalação **MC401**, MettaX Digital |
| Tipo descrito no PDF | Câmera veicular inteligente / dashcam com duas câmeras integradas |
| Função descrita | IA/alertas, localização, dados operacionais, intercomunicador remoto e visualização de vídeo em plataforma online |
| Instalação | Para-brisa próximo ao retrovisor, alimentação Power/ACC/GND, GPS, botão de pânico, cabo de vídeo, SIM e microSD |
| Configuração | Obrigatório uso de app de configuração em smartphone Android |
| Armazenamento removível | Cartão Micro SD; manual recomenda cartões industriais em ambientes críticos |
| O que o PDF não traz | API/SDK, protocolo LAN, listagem/download de gravações, modo Wi-Fi Station, JT/T, endpoints, credenciais ou formato dos arquivos |

**Conclusão revisada após a pesquisa técnica:** o PDF MC401 sozinho não desbloqueava ingestão automática, mas a pesquisa posterior encontrou evidências técnicas suficientes para iniciar spikes. O Hikvision AE-MD5043 é o primeiro candidato a adapter real via ISAPI local. MC904/MC401 entram em spike JT/T1078, ainda dependente de firmware/hardware real.

**Não tratar instruções dos manuais como tarefa deste projeto:** os passos de instalação física, energização, uso de app e checklist são orientações para técnico de campo, não comandos para o time executar no repositório.

### Pesquisa técnica consolidada — caminhos de integração

Fonte: `C:\Users\Lorenzo\Downloads\Full_Lock_Pesquisa_Tecnica.pdf`.

| Família | Caminho recomendado | Status de engenharia |
| --- | --- | --- |
| Hikvision AE-MD5043-SD/I/GLF/WI58 | Agent acessa DVR na LAN/Wi-Fi e faz pull por ISAPI (`/ISAPI/ContentMgmt/search` + `/download`) | Primeiro adapter real a implementar; validar endpoints no firmware |
| Hikvision fallback | HCNetSDK (`NET_DVR_FindFile_V40`, `NET_DVR_FindNextFile_V40`, `NET_DVR_GetFileByTime_V40`) | Fallback por exigir biblioteca nativa |
| MettaX MC904 | Equipamento inicia JT/T para o Agent; Agent consulta `0x9205`, recebe `0x1205`, comanda `0x9206`, recebe arquivo em FTP local e confirmação `0x1206` | Spike com hardware antes de `ready: true` |
| MettaX MC401 | Mesmo caminho candidato do MC904 por JT/T1078 | Confirmar firmware e uso real na frota |

Regras:

- RTSP comprova streaming, **não** download histórico.
- FTP citado para upgrade de firmware **não** é API de vídeo.
- FTP para vídeo só entra no desenho MettaX quando comandado pelo JT/T1078 `0x9206`.
- Associação segura: serial/deviceId/terminalId no registro Full Lock -> `vehicleId`; placa/VIN dentro do equipamento é auxiliar.

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
- **Vehicle:** entidade móvel; `clientId` (ou equivalente); identificação (placa configurada no equipamento — método de leitura na rede ainda pendente; ver MC904).
- **DownloadSession / Sync:** o vínculo operacional veículo ↔ base no tempo.
- **Histórico:** períodos/arquivos disponíveis, baixados, pendentes, falhos; última sincronização concluída.
- **User:** acesso ao painel (papéis ainda sugeridos).
- **Device:** primeiro modelo oficial **MC904** (MettaX); adapter `mettax-mc904` no Edge Agent.

### Débitos de domínio já tratados no código (histórico)

Itens abaixo estavam incorretos no levantamento anterior e **já foram refatorados** no domínio/mock/Firestore:

- `Vehicle.garageId` permanente → removido; usa-se `lastSeenGarageId` + sessão na base.  
- Entidade `ClientCompany` + `clientId` no veículo.  
- Retenção automática desligada nesta fase (`autoDelete: false`).  
- `VehiclePeriodHistory` + `SyncRun.sessionStatus`.

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
2. Equipamento (MC904) conecta no Wi-Fi da base (modo Station)  
3. Serviço **local** detecta o equipamento  
4. Sistema tenta identificar o veículo  
5. Verifica cadastro / ativo / empresa / autorização da base  
6. Consulta histórico do veículo  
7. Identifica arquivos/períodos não processados  
8. Monta fila de download  
9. Transfere; registra progresso e câmera/origem  
10. Grava no armazenamento **local do servidor da base**  
11. Valida integridade da transferência  
12. Marca concluído ou erro; atualiza última sincronização  
13. Atualiza dashboard e dados de relatório  

**Fronteira de escopo:** com o vídeo no servidor do cliente, ele pode entregar a uma **empresa terceirizada** para análise. Isso **não** é função do Full Lock (sem upload para nuvem de análise, sem workflow de terceiros no produto).

Implementação atual: pipeline `startGarageIngest` em `src/services/edge/pipeline.ts` + painel “Chegada automática na base” no dashboard. A transferência do MC904 ainda é **simulada** (`origin: simulado`) até existir SDK/JT/T1078; o restante do fluxo (status, histórico, arquivos na base, KPIs) já atualiza o painel.

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
  ├── hikvision-ae-md5043-isapi (pull LAN; primeiro adapter real)
  ├── mettax-jtt1078            (terminal initiated; spike MC904/MC401)
  └── hcnet-sdk                 (fallback Hikvision se ISAPI falhar)
```

Não assumir SMB, RTSP ou SDK proprietário como download histórico. ISAPI Hikvision e JT/T1078 MettaX são candidatos documentados, mas ainda exigem capability probe em firmware real.

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

Auditoria alinhada aos manuais MC904 + reestruturação de domínio já feita.

### Já atende

- Múltiplas câmeras por veículo (seed MC904 com 4 canais).  
- Múltiplas bases; veículo sem base fixa; `ClientCompany`.  
- Painel com KPIs, fila simulada, progresso, pause/resume/retry no mock.  
- Separação presentation / domain / services; Firebase fora de `.tsx`.  
- Histórico incremental modelado (`VehiclePeriodHistory`).  
- Edge Agent esqueleto + adapter `mettax-mc904` com capacidades do datasheet.  
- Docs: download real não cabe no SPA.  

### Atende parcialmente

- “Download automático”: só **simulação**; adapter MC904 ainda `ready: false` (falta API/SDK de transferência).  
- “Vídeo local”: alinhado em discurso; sem serviço que grave em disco real na base.  
- Dashboard alinhado ao domínio; ainda mock.  
- MP4 / 15 min / auditoria: simulados.  

### Não atende (ainda)

- Descoberta/listagem/download reais na LAN via JT/T1078 (ou outra API confirmada).  
- Identificação automática da placa pelo equipamento.  
- Relatórios PDF/Excel completos.  
- Regras Firestore por papel.  

### Dependências externas restantes (motor real)

- Spec/SDK JT/T1078 (ou CMS) para listar/baixar na LAN  
- Identificação do veículo na rede  
- Credenciais remotas  
- Hardware + topologia da base (servidor, APs, HDs, concorrência)  
- Painel centralizado vs por servidor (não fechado)  
- Sincronização de metadados entre bases (não fechada)  

---

## 13. Estado técnico atual do repositório (fato)

```text
src/
  presentation/     telas (dashboard admin, frota, fila, evidências…)
  domain/           tipos alinhados (cliente, histórico, sessão)
  services/api/     contrato REST, mock, HTTP, firestore-api
  services/database/firestore-store.ts   metadados na nuvem (fase atual)
  services/edge/    Edge Agent esqueleto + DeviceAdapter MettaX MC904
  services/firebase.ts                   Auth + Firestore + Analytics
```

- `VITE_API_MODE`: `mock` | `firestore` | `real`  
- Adapter `mettax-mc904`: metadados do produto OK; operações LAN ainda bloqueadas.  
- Firebase Storage **não** é usado para vídeo.  
- Manuais: `arquivosContext/user_manual_mc904.pdf`, `arquivosContext/MC904 Product Parameters.pdf`.

O painel atual é útil para UX, cadastros e demonstração. **Não cumpre sozinho o MVP de descarga local.**

---

## 14. Pendências técnicas / aguardando cliente

| Item | Status |
| --- | --- |
| Modelo do primeiro MDVR | **Confirmado: MettaX MC904** (manuais em `arquivosContext/`) |
| Datasheet de produto / instalação | **Recebido** |
| Wi-Fi STA/AP, 4 câmeras, codecs, JT/T808/1076/1078 | **Confirmado no datasheet** |
| Spec/SDK/API de listagem e download na LAN | **Parcialmente desbloqueado para spike**: Hikvision ISAPI/HCNetSDK; MettaX JT/T1078 histórico |
| Autenticação remota no equipamento | Pendente de validação |
| Formato da identificação do veículo (placa no device) | Pendente de validação |
| Estrutura real dos arquivos no TF/SD | Pendente (filesystem proprietário citado) |
| Quantidade de streams em campo | Manual: até 4 (+1 IP); validar frota real |
| Capacidade HDs / servidor / APs da base | Pendente de validação |
| Topologia de rede da base | Pendente de validação |
| Veículos simultâneos e volume médio de vídeo/dia | Pendente de validação |
| Política definitiva de autorização por base | Pendente de validação (configurável) |
| Painel centralizado vs por servidor | Pendente de validação |
| Sincronização de metadados entre bases | Pendente de validação |
| Papéis finais de usuário | Pendente de validação |
| Política futura de retenção de vídeo | Pendente de validação (hoje: exclusão manual) |
| Relação TRX-904 × MC904 | Pendente (assumir MC904 até o cliente esclarecer) |
| Hikvision AE-MD5043-SD/I/GLF/WI58 | Primeiro candidato a adapter real via ISAPI; validar firmware/endpoints |
| Manual `Manual 401 PTBR.pdf` | Diverge do equipamento citado; PDF fala MC401 MettaX, não Hikvision AE-MD5043 |
| Confirmação se MC401 faz parte da operação | Pendente |
| Nome definitivo do produto | Full Lock por enquanto; pode mudar |
| Obrigação de relatório diário automático | Proposto; não fechado |
| Canal de alerta (só painel / e-mail / outro) | Pendente de validação |
| Stream vs download na consulta de vídeo no painel | Pendente de validação |

**Não inventar números** de throughput, tamanho de frota ou capacidade. **Não inventar protocolo** de download além do que o fabricante documentar.

---

## 15. Ordem técnica sugerida de implementação

Não é cronograma contratado. É a ordem que desbloqueia o MVP real.

### Progresso atual (código)

| Etapa | Status |
| --- | --- |
| 1 Reestruturação do domínio | **Feito no domínio/mock/Firestore/UI** — `ClientCompany`, veículo sem `garageId` fixo, `lastSeenGarageId`, `SyncRun.sessionStatus`, `VehiclePeriodHistory`, retenção automática desligada |
| 2 Edge Agent + 1º adapter | **Parcial** — `mettax-mc904` com capacidades do datasheet; `ready: false` até API/SDK de transferência (candidato JT/T1078) |
| 3 Histórico incremental | **Modelo + seed + UI** no detalhe do veículo; motor real ainda não alimenta |
| 4 Dashboard real | **UI alinhada ao domínio** (cliente, base vista, backlog no relatório). Ainda mock — eventos do agente virão depois |
| 5–8 | Pendentes |

### Etapa 1 — Reestruturação do domínio

Revisar: Base, Vehicle (sem base fixa), Client/Company, Device, Camera, DownloadSession, DownloadFile, User, histórico. Remover vínculos incorretos. Ajustar contrato da API e o mock para o novo modelo (ainda com mocks **identificados**).

### Etapa 2 — Motor local de integração (Edge Agent)

Serviço na base: descoberta, conexão, identificação, adapter **MettaX MC904**, listagem, fila, download, retry, logs, gravação em disco.  
Produto/manual recebidos. **Bloqueado para transferência real** até spec JT/T1078 (ou API CMS) + hardware na LAN.

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
| `docs-ia/analise_arquitetura_garage_agent.md` | Captura + crítica + consenso Agent outbound / mídia local |
| `docs-ia/spec_agent_api_v1_stub.md` | Spec `agent-api@v1` + Agent stub Docker (sem JT/T) |
| `docs-ia/auditoria_equipamento_mc401_hikvision_ae-md5043.md` | Auditoria do novo equipamento informado e divergência com o PDF MC401 |
| `docs-ia/pesquisa_tecnica_full_lock_retorno.md` | Consolidação da pesquisa técnica: Hikvision ISAPI e MettaX JT/T1078 |
| `arquivosContext/` | Lâminas, logos e manuais do equipamento (`user_manual_mc904.pdf`, `MC904 Product Parameters.pdf`) |

Em caso de conflito entre documentos, **prevalece este `contexto.md`**, atualizado pelo levantamento mais recente.

---

## 18. Resumo em uma frase

Full Lock é um sistema **híbrido** (software + infraestrutura local por base) para **automatizar a ingestão de grandes volumes de vídeo** de equipamentos veiculares quando os veículos entram no Wi-Fi das bases; o painel administra e observa essa operação — **não a substitui**.
