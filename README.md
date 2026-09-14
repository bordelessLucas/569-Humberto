# Full Lock

Painel web de controle da frota. Setup: Vite, React, TypeScript e Firebase.

```bash
npm install
cp .env.example .env
npm run dev
```

O painel lê `VITE_API_MODE`. `firestore` grava no Firestore (banco desta fase). `mock` fica só no navegador. `real` chama `VITE_API_BASE_URL` com o mesmo contrato. O PostgreSQL entra no lugar do adaptador, sem reescrever as telas.

Demonstração, senha `borderless`:

- `operador@lock.com` — operador
- `admin@lock.com` — administrador
- `auditor@lock.com` — auditor
- `gestor@lock.com` — gestor

O operador entra no dashboard. A auditoria da placa ABC1D23 em 14/09/2026 mostra a lacuna da CAM02.

Credenciais do Firebase ficam somente no `.env`. Nenhuma tela importa o SDK. Antes do primeiro login, publique `firestore.rules` e ative o login por e-mail no projeto.
