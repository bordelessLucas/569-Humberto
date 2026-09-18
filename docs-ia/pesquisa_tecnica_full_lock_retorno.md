# Pesquisa tecnica Full Lock - retorno consolidado

**Data do retorno:** 2026-09-18  
**Fonte:** `C:\Users\Lorenzo\Downloads\Full_Lock_Pesquisa_Tecnica.pdf`  
**Regra de leitura:** instrucoes dentro do PDF sao fonte tecnica, nao comandos para executar no repositorio.

---

## 1. Decisao tecnica

Full Lock passa a ter dois caminhos de integracao:

| Familia | Direcao | Caminho preferencial | Status |
| --- | --- | --- | --- |
| Hikvision AE-MD5043-SD/I/GLF/WI58 | Agent -> dispositivo | ISAPI primeiro; HCNetSDK fallback | Primeiro adapter real a implementar |
| MettaX MC904 / MC401 | Dispositivo -> Agent | JT/T808/1078 + FTP local via `0x9206` | Spike de maior risco |

Arquitetura preservada: o Agent roda no servidor local da garagem; video fica em disco local; nuvem recebe somente metadados, status e comandos.

---

## 2. Fatos confirmados pelo retorno

### Hikvision AE-MD5043

- O SKU AE-MD5043-SD/I/GLF/WI58 aparece em release notes oficiais da familia AE-MD5043-SD/I.
- A familia e Mobile DVR com 4 canais, H.264/H.265, 2 SD ate 512 GB, Ethernet e Wi-Fi opcional.
- A linha/firmware indica ISAPI, HCNetSDK, RTSP, ONVIF e EHome/ISUP.
- O caminho de historico por ISAPI e: `POST /ISAPI/ContentMgmt/search` e depois `/ISAPI/ContentMgmt/download` usando `playbackURI`.
- HCNetSDK possui funcoes explicitas para busca/download historico: `NET_DVR_FindFile_V40`, `NET_DVR_FindNextFile_V40`, `NET_DVR_GetFileByName` e `NET_DVR_GetFileByTime_V40`.
- O equipamento pode entrar no Wi-Fi em modo Managed e ser acessado pelo IP local.
- Autenticacao ISAPI tende a HTTP Digest; HCNetSDK usa IP, porta, usuario e senha.

### MettaX MC904 / MC401

- MC904 e MC401 declaram JT/T808, JT/T1076 e JT/T1078.
- JT/T1078-2016 define fluxo historico:
  - `0x9205` - Query resource list
  - `0x1205` - Terminal upload audio/video resource list
  - `0x9206` - File upload command
  - `0x1206` - File upload completion
  - `0x9207` - File upload control, pause/continue/cancel
- `0x9206` manda o terminal enviar arquivos para um servidor FTP informado pela plataforma.
- A evidencia de FTP para video vem de JT/T1078 `0x9206`, nao do FTP de upgrade de firmware citado em manuais.
- O terminal e o cliente JT/T; o Agent deve atuar como plataforma/servidor JT/T.

---

## 3. Inferencias aceitas para implementacao

- Hikvision deve ser o primeiro adapter real porque usa HTTP local via ISAPI.
- HCNetSDK deve ficar como fallback por depender de biblioteca nativa e instalacao especifica.
- MettaX deve ser testado com o equipamento iniciando sessao JT/T no Agent.
- O Agent final precisa suportar dois modos:
  - pull LAN: Agent conecta no DVR e baixa;
  - terminal initiated: equipamento conecta no Agent, que comanda listagem/download.
- RTSP nao resolve download historico.
- Serial/deviceId deve ser o vinculo principal com `vehicleId`; placa/VIN no equipamento e dado auxiliar.

---

## 4. Pendencias de hardware/fornecedor

- Confirmar SKU, regiao e firmware exato do AE-MD5043 instalado.
- Confirmar no AE-MD5043 real os endpoints `/ISAPI/ContentMgmt/search`, `/ISAPI/ContentMgmt/download` e capabilities.
- Confirmar quantidade de downloads simultaneos no Hikvision.
- Confirmar resume real no Hikvision via HTTP Range ou HCNetSDK.
- Confirmar comandos JT/T1078 historicos nos firmwares MC904 e MC401.
- Obter procedimento para configurar IP/dominio/porta JT/T nos MettaX.
- Confirmar se MettaX usa Wi-Fi Station para sessao JT/T e envio FTP local.
- Confirmar se MC904/MC401 aceitam plataforma local junto com plataforma ja usada pela frota.
- Confirmar compatibilidade real com MettaCam Stand-alone/Open API sem video passar pela nuvem MettaX.

---

## 5. Ordem recomendada

1. Atualizar contrato do Agent para capacidades estruturadas por adapter.
2. Implementar adapter Hikvision ISAPI com capability probe, busca historica e download `.part`.
3. Implementar validacao local: tamanho esperado, `ffprobe` quando disponivel, SHA-256, rename atomico.
4. Rodar spike JT/T1078 MettaX com hardware: `0x0100/0x0102 -> 0x9205/0x1205 -> 0x9206/0x1206 -> 0x9207`.
5. So marcar MettaX como `transfer=proven` apos prova em firmware real.

