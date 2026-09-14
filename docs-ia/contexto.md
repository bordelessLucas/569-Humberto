# Contexto do projeto — Full Lock

Documento gerado na auditoria do levantamento do cliente (`arquivosContext/INFOS.docx` e as três referências visuais). Este arquivo é a fonte das decisões de plataforma, dos limites do Firebase e do memory bank em `docs-ia/`.

## Revisão de arquitetura

O painel não fala com o Firestore a partir das telas. A fronteira continua o contrato REST. O Firestore é só o banco desta fase.

```text
React
  → TanStack Query
  → API client
  → mesmos contratos REST
  → agora: adaptador em memória, persistido no Firestore
  → depois: o mesmo contrato → PostgreSQL (e então backend, Redis, FFmpeg, Storage, DeviceAdapter, TRX-904)
```

Trocar o banco não muda telas nem hooks. Firestore entra com `VITE_API_MODE=firestore`. O PostgreSQL substitui `src/services/database/`, não as páginas. O modo `real` continua o caminho do backend em `VITE_API_BASE_URL`.

Auth desta fase é o Firebase Auth (e-mail e senha). A senha não é gravada no Firestore. Autorização de produção fica no backend.

O Modo Demonstração não entra no contrato de produção. Ele existe no adaptador local (mock e Firestore) e encena a chegada do Caminhão 17 até o arquivo disponível, incluindo interrupção, retomada, MP4, corte de 15 minutos, auditoria e uma lacuna. No Firestore, o reinício da demonstração regrava o cenário inicial.

A única parte que continua bloqueada é a comunicação com o TRX-904. O restante do escopo funcional dos dois blocos do cliente está representado no painel, como simulação.

## Decisão de plataforma

**Web. Não mobile.**

O entregável pedido é um painel operacional de mesa: sidebar, tabelas, KPIs, relatórios e configuração. As duas lâminas de arquitetura mostram o produto em um notebook, não em um aplicativo de campo. Não há requisito de câmera do celular, GPS do operador, push nativo ou uso fora da rede do escritório/garagem.

Stack do painel:

- Vite + React + TypeScript estrito
- Firebase (Auth, Firestore, Analytics; Storage apenas como destino secundário)
- Clean Architecture de frontend: `src/presentation`, `src/domain`, `src/services`
- Firebase nunca importado em `.tsx`

O build estático do Vite é compatível com hospedagem do SPA (Netlify ou Firebase Hosting). Isso não substitui o servidor da garagem.

## O que o cliente pediu

Produto apresentado nas lâminas como **Full Lock**. Repositório e projeto Firebase: **Humberto** (`humberto-f88f5`). Até o cliente unificar o nome, a interface usa Full Lock e o projeto técnico permanece Humberto.

Fluxo de negócio descrito pelo cliente:

1. Cada caminhão grava com MDVR/Dashcam (3 câmeras nas lâminas; o cadastro precisa aceitar N câmeras).
2. Ao entrar no Wi-Fi da garagem, o equipamento é identificado.
3. Os arquivos são baixados automaticamente, com fila, prioridade e retomada.
4. São convertidos para MP4 e cortados em blocos de 15 minutos (padrão Enel).
5. Ficam organizados por garagem, veículo, data, câmera e horário.
6. Um painel mostra concluídos, baixando, pendentes, com erro e o total, em tempo real.

O documento do cliente já separa o escopo em dois blocos. Eles não são sprints de implementação; são o inventário funcional:

- Captura automática e gerenciamento de vídeos
- Processamento, auditoria e consulta

## O que o painel web faz

O React é o plano de controle:

- Login e usuários
- Cadastro de garagens, veículos, placas, equipamentos e câmeras
- Visualização da frota, fila, progresso, falhas e histórico
- Consulta e relatórios sobre metadados
- Configuração de retenção, proteção de arquivo e alertas de capacidade

## O que o painel web não faz

Estes itens conflitam com React + SDK cliente do Firebase. Não devem ser implementados no SPA.

| Pedido do cliente | Por que não cabe no SPA | Onde deve viver |
| --- | --- | --- |
| Monitorar o Wi-Fi da garagem e associar IP/MAC | O browser não vê a LAN nem o tráfego dos caminhões | Agente local na garagem |
| Baixar os arquivos do MDVR e retomar transferência | Volume, protocolo do equipamento e sessão de longa duração | Agente local |
| Converter para MP4 e cortar em 15 minutos | Exige FFmpeg. Cloud Functions estoura tempo, memória e custo em horas de vídeo | Servidor de processamento da garagem, como a própria lâmina descreve |
| Arquivo primário na ordem de terabytes (a lâmina cita 2,45 TB) | Firestore não guarda binário. Firebase Storage como arquivo único dessa frota é custo e egresso inadequados | Storage de alta capacidade da garagem. O Firestore guarda o índice |

O agente escreve status, progresso e metadados no Firestore. O painel só lê e configura. A UI nunca chama o equipamento.

## Bloqueio externo

A conversa anexada deixa explícito que **não há documentação pública confiável do TRX-904** (SDK, API, protocolo ou CMS). Sem datasheet, foto do equipamento ou software de servidor do fabricante, a sprint de captura automática não pode ser dada como viável. O painel e o modelo de dados podem avançar com um contrato de eventos. A integração com o gravador fica bloqueada até essa confirmação.

## Compatível com Firebase

- Autenticação administrativa e controle de usuários (Auth + custom claims)
- Cadastros e histórico (Firestore)
- Indicadores em tempo real (listeners), desde que o agente publique os eventos
- Relatórios simples, se os totais forem pré-agregados. Firestore não é um data warehouse
- Analytics web, inicializado só quando o browser suporta

## Lacunas do levantamento

Não inventar valor para estes pontos. Confirmar com o cliente antes da sprint correspondente:

- Prazo da política de retenção
- Formato da exportação
- Canal do alerta (somente no painel, e-mail, outro)
- Quem pode proteger um arquivo contra exclusão
- Um administrador vê todas as garagens ou só as suas
- Consulta de vídeo é stream, download ou os dois
- Auditoria de quem assistiu um vídeo (recomendado; não foi pedido)
- Papel além de administrador. O texto só cita login administrativo e controle de usuários. Operador é uma inferência, não um requisito fechado

## Estrutura alvo

```text
src/
  presentation/   telas e componentes puros
  domain/         tipos e regras sem I/O
  services/       Firebase e, no futuro, contrato do agente
```

Serviços previstos, ainda não implementados: `auth.service.ts`, `database.service.ts`, e um adaptador do agente de garagem. Nenhum deles entra na UI.
