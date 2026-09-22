# Auditoria - Agent local leve + nuvem do cliente

Data: 2026-09-22.

## Decisao atual

O cliente nao tera servidor local para armazenamento definitivo. A garagem precisa ter somente um Agent local leve porque os equipamentos veiculares entram na rede Wi-Fi local. O destino final dos videos passa a ser object storage/cloud storage contratado e controlado pelo cliente.

Fluxo alvo:

```text
equipamento do veiculo -> Wi-Fi da garagem -> Agent local -> cloud storage do cliente
                                             -> backend/dashboard Full Lock (metadados)
```

O dashboard Full Lock nao armazena video e nao deve trafegar arquivos grandes por Firestore/Functions/API quando isso puder ser evitado.

## Estado atual do projeto

REAPROVEITAR:

- `agent/`: Agent Docker, ativacao, heartbeat, long-poll de comandos, eventos e API mock.
- `agent/src/devices/types.ts`: interface `DeviceAdapter`.
- `agent/src/devices/hikvision/adapter.ts`: adapter candidato Hikvision ISAPI, ainda pendente de validacao em firmware real.
- `agent/src/devices/mettax/jtt1078-spike.ts`: spike MettaX MC904/MC401 via JT/T808+JT/T1078+FTP, pendente de hardware/configuracao.
- `src/domain/types.ts`: entidades atuais de frota, garagem, equipamento, gravacao, sessao, transferencia e arquivo.
- `src/presentation/`: dashboard operacional, frota, evidencias, operacoes e admin.

ADAPTAR:

- `agent/src/media/local-media-store.ts`: deve ser tratado como spool temporario, nao storage final.
- `agent/src/sim/arrival.ts`: simulacao precisa emitir download, upload, verificacao e conclusao de sync.
- `src/domain/types.ts`: precisa representar status separado de download do equipamento, upload para nuvem e verificacao.
- `src/services/api/mock/*`: demo e seed precisam parar de comunicar "storage local definitivo".
- `docs-ia/contexto.md` e `docs-ia/spec_agent_api_v1_stub.md`: contem premissas antigas de video local/no cloud.

CRIAR:

- `CloudStorageProvider` abstrato.
- Implementacao mock/fake de cloud storage para desenvolvimento.
- Campos de metadados cloud: `cloudObjectKey`, `uploadedAt`, `expiresAt`, `uploadedSize`, `checksum`, `verificationStatus`.
- Configuracoes: `retentionDays`, `maxConcurrentVehicles`, `maxConcurrentDownloads`, `maxConcurrentUploads`.

BLOQUEADO POR INFORMACAO EXTERNA:

- Provedor cloud contratado pelo cliente.
- Mecanismo seguro de upload direto: signed URL, credencial temporaria, STS, SAS, etc.
- Multipart/resumable upload real.
- Lifecycle policy nativa do provedor.
- Bitrate real por camera, codec, fps efetivo e tamanho medio dos arquivos.
- Protocolo real de download/listagem nos equipamentos MC904, Hikvision e MC401.

## Dados confirmados pelo cliente nesta revisao

- 12 horas de video por camera por dia.
- 3 cameras por carro.
- 720p 30fps.
- Retencao de 7 dias.
- Nao ha servidor local de armazenamento definitivo.

O bitrate ainda precisa ser confirmado para dimensionamento real. A estimativa deve manter `bitrateMbps` como variavel.

## Implementado nesta passada

- `agent/src/storage/cloud-storage.ts`: `CloudStorageProvider` + `MockCloudStorageProvider`.
- `agent/src/types.ts`: configuracoes de retencao/concorrencia e `CloudObjectRef`.
- `agent/src/env.ts` e `agent/src/mock-api.ts`: `RETENTION_DAYS=7` e limites de concorrencia configuraveis.
- `agent/src/sim/arrival.ts`: fluxo simulado agora usa spool temporario, faz upload mock, verifica e apaga arquivo local.
- `src/domain/types.ts`: novos status e metadados opcionais de cloud em transferencias/arquivos.
- `src/services/api/mock/seed.ts` e `demo.ts`: demo inclui upload/validacao e retencao de 7 dias.
- `src/presentation/components/GarageArrivalPanel.tsx`: texto alinhado a Agent local + nuvem do cliente.

## Riscos principais

- Banda de upload por garagem pode ser o gargalo principal.
- Upload grande precisa ser resumivel/multipart no provedor escolhido.
- Se o veiculo sair da garagem antes do download terminar, o Agent deve manter estado de pendencia e retomar.
- Sem checksum do equipamento, a validacao fica limitada a tamanho/objeto remoto.
- Credenciais de cloud nao podem ir para frontend nem ficar hardcoded no Agent.
- Retencao deve preferir lifecycle nativo do storage, com metadados refletidos no backend.

