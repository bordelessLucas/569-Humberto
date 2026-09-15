# Escopo

## Objetivo

Painel de controle para a operação de descarregamento automático dos vídeos da frota. Quando o caminhão entra no Wi-Fi da garagem, os arquivos das câmeras devem ser baixados, validados, convertidos para MP4, cortados em blocos de 15 minutos e organizados por garagem, veículo, data e câmera. A equipe acompanha o que concluiu, o que está baixando, o que está pendente e o que falhou, sem retirar cartão nem operar o equipamento na mão.

O software web é o painel e o cadastro. A captura na rede, o download do gravador e o FFmpeg acontecem no servidor da garagem. O painel consome o status que esse agente publica.

## Regras de negócio

- A sincronização começa sozinha quando o equipamento entra na rede da garagem e segue se a conexão cair.
- A fila de download tem prioridade e registra progresso parcial, tentativas, falhas e reprocessamento.
- Todo arquivo recebido é conferido. Corrompido, incompleto ou com intervalo ausente vira inconsistência, não sucesso.
- O formato de trabalho é MP4. O original e o convertido ficam registrados.
- O vídeo é partido em blocos de 15 minutos, padrão Enel, com início, fim e sequência.
- A organização obrigatória é garagem, veículo, data e câmera. A busca também cobre placa, horário e status.
- Cada câmera é auditada à parte: sincronização, lacuna, histórico e alerta.
- Retenção é configurável. Arquivo marcado como protegido não entra na exclusão automática.
- Capacidade usada, disponível e crescimento disparam alerta. O número exibido no painel é o do storage da garagem, não um cálculo feito no browser.
- O painel atualiza status em tempo real. Ele não inicia download nem conversão por conta própria.

## Perfis

- **Administrador** — configura sistema, frota, usuários, equipamentos, storage e integrações. Vê as 21 telas.
- **Operador** — acompanha a chegada, a fila, a sincronização, as falhas e o processamento. Não entra em usuários nem configurações. Pode pausar, retomar e tentar de novo um download. Não converte MP4 na mão.
- **Auditor** — investiga gravação, integridade, câmera, histórico e relatório. Leitura na operação. Área principal: auditoria de câmeras.
- **Gestor** — indicadores, frota e vídeos. Não vê fila técnica, processamento, rede nem configuração.

A placa é atributo do veículo, não um módulo.

## Funcionalidades core

### Cadastro e frota

- Login administrativo e controle de usuários
- Cadastro de garagens, veículos, placas e equipamentos MDVR/Dashcam
- Associação veículo, equipamento e câmeras
- Lista da frota com última conexão, última sincronização, status operacional e histórico de atividades

### Captura (orquestrada pelo agente, visualizada no painel)

- Entrada e saída do equipamento na rede
- Associação do equipamento ao veículo
- Consulta de vídeos disponíveis e identificação de pendentes
- Download automático, fila, prioridade, progresso e retomada
- Organização e indexação por garagem, veículo, data e câmera

### Processamento e auditoria

- Conversão e padronização para MP4
- Registro do arquivo original e do convertido
- Blocos de 15 minutos por câmera, com nomeação e horário
- Integridade: corrompido, incompleto, intervalo ausente, gravação faltante
- Auditoria por câmera e alertas operacionais

### Consulta, relatório e armazenamento

- Pesquisa por placa, veículo, data, horário, câmera, garagem e status
- Histórico de sincronização, download, processamento e falha
- Relatório por veículo e por período, com exportação
- Capacidade, retenção, exclusão automática, proteção de arquivo marcado e alerta de capacidade

### Painel

- Veículos conectados, sincronizados e pendentes
- Transferências em andamento e falhas
- Indicadores: concluídos, baixando, pendentes, com erro, total
- Atualização em tempo real

## Cobertura no MVP

Cada ponto dos dois blocos do cliente tem lugar no contrato e uma versão simulada no painel. Login, garagens, veículos, placas, MDVR, câmeras, IP/MAC, entrada e saída, conexões, consulta de gravações, pendentes, fila, prioridade, progresso, retomada, tentativas, histórico, organização, índice, MP4, original, corte de 15 minutos, nome, sequência, integridade, arquivo corrompido, lacunas, auditoria, pesquisa, relatórios, exportação, retenção, exclusão, arquivo protegido, alerta de capacidade e atualização da tela.

O que o MVP não faz, de propósito: detectar o Wi-Fi, baixar do TRX-904, converter com FFmpeg ou gravar no disco da garagem. Isso aparece como `origin: simulado`. Em produção a origem passa a ser o equipamento, no mesmo contrato.

## Fora do SPA

- Varredura de Wi-Fi, IP/MAC e protocolo do TRX-904
- Download binário e retomada no equipamento
- FFmpeg (conversão e corte)
- Disco primário dos vídeos

Esses itens dependem do agente da garagem e, hoje, da confirmação de SDK/API do fabricante. O modelo de dados do painel já prevê os eventos; a integração com o gravador não está liberada.

## Próximos passos

A lista fechada está em `docs-ia/checklist_sprints.md`. Pendente, nesta ordem: alinhar as lacunas com o cliente, endurecer o Firestore desta fase, trocar o adaptador para PostgreSQL e só então abrir a sprint do equipamento.
