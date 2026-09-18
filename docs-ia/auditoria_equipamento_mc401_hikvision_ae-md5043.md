# Auditoria - novo equipamento informado e manual MC401

**Data:** 2026-09-18  
**Pedido do cliente:** considerar o gravador **Hikvision AE-MD5043-SD/I/GLF/WI58** (NCM 8521.90.0) na operação.  
**Documento analisado:** `C:\Users\Lorenzo\Downloads\Manual 401 PTBR.pdf`.  
**Observação de escopo:** instruções de instalação no PDF são material de referência do fabricante; não são comandos para alterar o projeto.

---

## 1. Achado principal

Existe uma divergência relevante entre o equipamento citado e o manual anexado:

| Item | Informação |
| --- | --- |
| Equipamento citado na solicitação | Hikvision AE-MD5043-SD/I/GLF/WI58 |
| Manual recebido | Manual do Usuário de Instalação **MC401** |
| Fabricante no PDF | MettaX Digital (Shenzhen) Co., Ltd. |
| Tipo descrito | Câmera veicular inteligente / dashcam |
| Câmeras | Duas câmeras integradas |
| Papel operacional provável | Captura embarcada com IA, localização, vídeo online e dados operacionais |

**Impacto:** não dá para assumir que o PDF documenta o Hikvision AE-MD5043. Também não dá para assumir que o MC401 substitui o MC904 ou o novo Hikvision. A implementação precisa tratar isso como inventário pendente.

---

## 2. O que o PDF MC401 confirma

O documento é um guia de instalação física, não um manual de integração.

Confirma:

- MC401 é uma câmera veicular inteligente/dashcam com duas câmeras integradas.
- O equipamento transmite localização e dados operacionais para uma plataforma online.
- Suporta intercomunicador remoto e visualização de vídeo.
- Instalação perto do retrovisor, acima da linha central do para-brisa.
- Alimentação via Power/ACC/GND no veículo.
- Uso de antena GPS, botão de pânico, cabo de vídeo, Micro SIM e Micro SD.
- Configuração obrigatória via app em smartphone Android.
- Micro SD deve ser de boa procedência; em ambiente crítico, usar cartão industrial.

Não confirma:

- API, SDK ou protocolo para listar gravações.
- Download automático pela LAN.
- Wi-Fi Station/AP.
- JT/T808, JT/T1078, ISAPI, Hikvision SDK ou endpoint HTTP.
- Credenciais, autenticação, formato dos arquivos ou estrutura de armazenamento.
- Como identificar placa/veículo via rede.

---

## 3. Impacto na arquitetura Full Lock

A arquitetura oficial continua fazendo sentido:

```text
MDVR / câmera veicular -> LAN/Wi-Fi da garagem -> Garage Agent local
Garage Agent -> disco local da base
Garage Agent -> nuvem somente com metadados/status/comandos
```

O novo material reforça a necessidade de adapters por modelo:

| Adapter | Status recomendado |
| --- | --- |
| `mettax-mc904` | Mantém `transfer=unknown` até spike/API/JT/T comprovado |
| `hikvision-ae-md5043` | Criar como entrada planejada, mas sem implementação de download até manual técnico correto |
| `mettax-mc401` | Só criar se o cliente confirmar que o MC401 será usado na operação |

**Não alterar o motor para depender do MC401.** O manual não libera caminho técnico de ingestão.

---

## 4. Faz sentido para a implementação?

Sim, faz sentido continuar a implementação do **fluxo do Agent** e do **sistema que roda no servidor da garagem**, mas o novo PDF não muda a ordem técnica.

O que deve continuar agora:

1. Runtime local do Agent com ativação, heartbeat, fila de comandos e buffer de eventos.
2. Estado local persistente para sessões, arquivos, fila, retries e policy cache.
3. Contrato `agent-api@v1` com eventos abstratos (`device.seen`, `session.progress`, `file.indexed`).
4. Estrutura de `DeviceAdapter` por fabricante/modelo.
5. Simulador/stub sem fingir download real.

O que não deve ser implementado ainda:

- Download real para Hikvision AE-MD5043.
- Download real para MC401.
- Assumir FTP, pasta compartilhada, RTSP, ISAPI ou JT/T sem prova.
- Usar o app de configuração como dependência automática do Agent.
- Tratar Micro SD como storage montável automaticamente no servidor.

---

## 5. Plano recomendado

### Fase imediata - documentação e contrato

- Registrar o Hikvision AE-MD5043 como equipamento informado e pendente de integração.
- Registrar o PDF MC401 como divergente do equipamento citado.
- Manter o contrato do Agent independente de protocolo.
- Acrescentar `deviceModel`, `manufacturer`, `adapterId` e `capabilities.transfer` nos eventos/heartbeat quando o backend real for fechado.

### Fase de implementação do Agent

- Implementar o Agent stub com adapters `ready: false`.
- Criar interface de adapter com operações abstratas:
  - `detect`
  - `identify`
  - `listRecordings`
  - `downloadSegment`
  - `validateTransfer`
- Permitir que cada adapter declare:
  - `manufacturer`
  - `model`
  - `source`
  - `transfer: unknown | proven | unsupported`
  - `requiresManualBootstrap`

### Fase de laboratório

- Com hardware real na garagem ou bancada, validar:
  - IP/MAC observável.
  - Se o equipamento inicia conexão para plataforma.
  - Protocolo real de vídeo histórico.
  - Como configurar servidor/plataforma no equipamento.
  - Como mapear deviceId para veículo.
  - Como listar e baixar gravações sem depender do browser.

---

## 6. Perguntas para o cliente / fornecedor

### Sobre a divergência do manual

- O equipamento novo é Hikvision AE-MD5043-SD/I/GLF/WI58 mesmo?
- O `Manual 401 PTBR.pdf` foi enviado para esse Hikvision por engano?
- O MC401 também será instalado na frota?
- O MC401 é complementar ao MDVR ou substitui algum equipamento?

### Sobre integração

- Existe SDK/API do AE-MD5043 para download de gravações?
- O equipamento suporta Hikvision ISAPI, SDK nativo, JT/T808/JT/T1078, GB/T ou outro protocolo?
- O download histórico pode ocorrer pela LAN/Wi-Fi da garagem?
- Como configurar IP/domínio/porta da plataforma no equipamento?
- Qual identificador único do terminal aparece na rede/API?
- Como associar terminal a placa/veículo?
- Quais credenciais e permissões são usadas para acesso remoto/local?

### Sobre operação física

- O servidor da garagem será Windows ou Linux?
- O equipamento entra no Wi-Fi da garagem ou usa rede 4G/plataforma do fabricante?
- Há restrição de TI para outbound HTTPS/WSS?
- O armazenamento local será HD interno, NAS ou disco removível?

---

## 7. Decisão recomendada

Continuar a implementação do Garage Agent e do contrato `agent-api@v1` agora. O novo equipamento reforça a decisão de arquitetura por adapters, mas **não desbloqueia download real**.

Critério para avançar de `transfer=unknown` para `transfer=proven`:

1. manual técnico correto ou SDK/API do modelo certo;
2. hardware acessível em rede controlada;
3. prova de listagem de gravações;
4. prova de download de segmento;
5. validação de arquivo local e retomada após interrupção.

Até isso acontecer, o painel e o Agent devem continuar marcando origem como `simulado` ou `unknown`, nunca como integração final.
