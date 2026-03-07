# EletricaPRO — Guia de Deploy Completo
## Cloud Functions + 3 Planos PRO (Mensal / Anual / Vitalício)

---

## 📁 Estrutura do Projeto

```
eletricapro_v2/
├── firebase.json              ← config Firebase (hosting, functions, emulator)
├── firestore.rules            ← regras de segurança atualizadas
├── firestore.indexes.json     ← índices compostos necessários
├── functions/
│   ├── package.json           ← dependências Node.js
│   └── index.js               ← 6 Cloud Functions
└── public/
    ├── pro.html               ← tela PRO com 3 planos (cole no seu app)
    └── admin.html             ← painel admin com aprovação 1 clique
```

---

## ⚙️ PASSO 1 — Configurar Firebase Console

### A) Authentication
1. Acesse console.firebase.google.com → seu projeto
2. Authentication → Sign-in method → **Google → Ativar**

### B) Cloud Firestore
1. Firestore Database → **Criar banco**
2. Escolha modo Produção
3. Região recomendada: **southamerica-east1 (São Paulo)**

### C) Cloud Functions
1. Faça upgrade para plano **Blaze (pay-as-you-go)**
   - Necessário para Cloud Functions
   - Uso do gratuito é muito amplo para esse app (sem custo real)

---

## ⚙️ PASSO 2 — Descobrir seu UID Admin

1. Acesse o app, faça login com Google
2. Abra DevTools → Console → execute:
   ```js
   firebase.auth().currentUser.uid
   ```
   OU veja em Authentication → Users no console Firebase
3. Copie seu UID

---

## ⚙️ PASSO 3 — Substituir configurações nos arquivos

### Em `functions/index.js` (linha 20):
```js
adminUids: ["COLE_SEU_UID_AQUI"],
```

### Em `public/admin.html` e `public/pro.html`:
Substitua o bloco `firebaseConfig` com seus dados reais:
```js
const firebaseConfig = {
  apiKey:            "...",
  authDomain:        "...",
  projectId:         "...",
  storageBucket:     "...",
  messagingSenderId: "...",
  appId:             "..."
};
```

### Em `public/pro.html` — links do PicPay:
```js
const PICPAY_LINKS = {
  monthly:  "https://picpay.me/seunome/19.90",
  annual:   "https://picpay.me/seunome/149.90",
  lifetime: "https://picpay.me/seunome/299.90"
};
```

---

## ⚙️ PASSO 4 — Instalar Firebase CLI e fazer deploy

```bash
# Instalar Firebase CLI (uma vez)
npm install -g firebase-tools

# Login
firebase login

# Entrar na pasta do projeto
cd eletricapro_v2

# Instalar dependências das Functions
cd functions && npm install && cd ..

# Deploy completo (rules + indexes + functions + hosting)
firebase deploy

# OU deploy separado:
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only hosting
```

---

## ⚙️ PASSO 5 — Aplicar Firestore Rules e Indexes

Ao rodar `firebase deploy`, as rules e indexes são aplicadas automaticamente.

Se quiser aplicar manualmente no console:
- Rules: Firestore → Rules → cole o conteúdo de `firestore.rules`
- Indexes: são criados automaticamente via `firebase deploy --only firestore:indexes`

---

## 🔔 Cloud Functions implantadas

| Function | Tipo | Descrição |
|---|---|---|
| `approvePro` | Callable (admin) | Aprova solicitação e ativa PRO |
| `rejectPro` | Callable (admin) | Rejeita solicitação com motivo |
| `revokeProManual` | Callable (admin) | Revoga PRO de um usuário |
| `renewPro` | Callable (admin) | Renova plano de um usuário |
| `checkProExpiry` | Scheduled (01h BRT) | Expira assinaturas mensais/anuais |
| `onProRequest` | Firestore trigger | Notifica admin em nova solicitação |

---

## 💰 Planos PRO

| Plano | Preço | Duração | Campo no Firestore |
|---|---|---|---|
| Mensal | R$ 19,90 | 30 dias | `proUntil = now + 30d` |
| Anual | R$ 149,90 | 365 dias | `proUntil = now + 365d` |
| Vitalício | R$ 299,90 | Permanente | `proUntil = null, proType = lifetime` |

---

## 🗄️ Estrutura do Firestore

### `users/{uid}`
```json
{
  "email":       "usuario@gmail.com",
  "photo":       "https://...",
  "pro":         true,
  "proType":     "monthly",        // "monthly" | "annual" | "lifetime"
  "proUntil":    Timestamp,        // null para vitalício
  "proSince":    Timestamp,
  "createdAt":   Timestamp,
  "updatedAt":   Timestamp
}
```

### `pro_requests/{docId}`
```json
{
  "uid":        "uid_do_usuario",
  "email":      "usuario@gmail.com",
  "plan":       "annual",          // "monthly" | "annual" | "lifetime"
  "status":     "pending",         // "pending" | "approved" | "rejected"
  "createdAt":  Timestamp,
  "approvedAt": Timestamp,
  "approvedBy": "uid_admin",
  "reason":     "Pagamento não confirmado"  // só em rejected
}
```

### `admin_notifications/{docId}`
```json
{
  "type":       "pro_request",
  "requestId":  "docId",
  "uid":        "uid_usuario",
  "email":      "usuario@gmail.com",
  "plan":       "lifetime",
  "planLabel":  "R$ 299,90 único",
  "read":       false,
  "createdAt":  Timestamp
}
```

---

## 📱 Fluxo completo

```
Usuário abre pro.html
  → Clica "Entrar com Google"
  → Escolhe plano (Mensal / Anual / Vitalício)
  → App abre PicPay no valor correto
  → Cria pro_requests/{docId} com status "pending"
  → Usuário envia comprovante (WhatsApp, e-mail, etc.)

Admin recebe notificação
  → Abre admin.html
  → Vê solicitação pendente com nome, e-mail, plano
  → Clica "✅ Aprovar"
  → Cloud Function approvePro() executa:
      - Seta users/{uid}.pro = true
      - Seta users/{uid}.proType = plan
      - Seta users/{uid}.proUntil = agora + dias do plano
      - Marca pro_requests como "approved"

App do usuário detecta mudança (onSnapshot) em tempo real
  → Status muda para "PRO ATIVO ✓"
  → localStorage.eletricapro_trial.isPro = true
  → Todos os recursos desbloqueados
```

---

## 🔄 Expiração automática

Todo dia às 01h (horário de Brasília), a função `checkProExpiry` roda e:
- Busca usuários com `pro = true` e `proType in [monthly, annual]`
- Filtra os com `proUntil <= agora`
- Seta `pro = false` e `expiredAt = agora`

O app detecta a mudança via `onSnapshot` e bloqueia automaticamente.

---

## 🛡️ Segurança

- Nenhum cliente pode modificar `users/{uid}` diretamente
- Somente Cloud Functions com Admin SDK alteram o status PRO
- Admin autenticado com UID validado no servidor (não no cliente)
- Regras do Firestore validam plano, uid e email na criação da solicitação
