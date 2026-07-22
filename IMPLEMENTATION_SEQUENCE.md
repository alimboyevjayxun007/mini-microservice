# Mini Microservice — to‘liq implementatsiya ketma-ketligi

## Joriy runtime contract

```text
http://localhost:9596                  React admin panel
http://localhost:9596/api              NestJS REST API
http://localhost:9596/api/swagger      Public Swagger UI
http://localhost:9596/api/openapi.json Public OpenAPI JSON
http://localhost:9596/api/openapi.yaml Public OpenAPI YAML
```

Swagger sahifasi va OpenAPI fayllari tokensiz ochiladi. Protected admin endpointlarini
Swagger orqali bajarish uchun `/api/auth/login`dan olingan `accessToken` `Authorize`
oynasidagi `access-token` scheme’ga kiritiladi. Device conversation endpointida
`device-id` scheme orqali `X-API-Key` yuboriladi.

## Arxitektura

```text
Browser / Device
       │
       ▼
NestJS — 0.0.0.0:9596
  ├─ React SPA: /, /login, /devices, /analytics
  ├─ Swagger: /api/swagger, /api/openapi.json, /api/openapi.yaml
  └─ REST API: /api/*
       ├─ AuthModule ─────────── data/refresh-tokens.json
       ├─ DevicesModule ──────── data/devices.json
       ├─ AnalyticsModule ────── data/analytics.json
       └─ ElevenLabsModule ───── ELEVENLABS_AGENT_URL
```

## Fayllarni yozish ketma-ketligi

### Root loyiha

1. `IMPLEMENTATION_PLAN.md` — talablar, arxitektura, REST contract va acceptance mezonlari.
2. `package.json` — npm workspaces, `start`, `build`, `format`, `test:e2e` va `verify`.
3. `package-lock.json` — dependency versiyalarini deterministik lock qilish.
4. `.env.example` — barcha environment maydonlari va quoted admin password namunasi.
5. `.env` — real local config, JWT secretlar va ElevenLabs URL; permission `0600`.
6. `.gitignore` — secret, dependency, build, cache va test artifactlarini chiqarish.
7. `.prettierrc.json` — umumiy kod formati.
8. `.prettierignore` — runtime data va generated fayllarni formatterdan chiqarish.
9. `data/devices.json` — device CRUD storage.
10. `data/refresh-tokens.json` — refresh token hash, expiry va revoked storage.
11. `data/analytics.json` — device request audit storage.

`#` dotenv comment belgisi bo‘lgani sabab password quyidagicha yoziladi:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD="admin!@#"
```

### Backend foundation

12. `backend/package.json` — NestJS, JWT, validation, Swagger va static serving dependency’lari.
13. `backend/tsconfig.json` — strict TypeScript, decorators va ES2022 build.
14. `backend/nest-cli.json` — Nest source va build kataloglari.
15. `backend/src/config.ts` — `.env`, port, TTL, secret, data path, frontend dist va URL validatsiyasi.
16. `backend/src/common/crypto.ts` — `hash()`, `createSecret()`, timing-safe `equal()`.
17. `backend/src/common/json-store.ts` — `read()`, `write()`, `update()`, queue va atomic rename.
18. `backend/src/common/api-error.dto.ts` — standart Swagger error response modeli.

### Backend authentication

19. `backend/src/auth/auth.dto.ts` — login, refresh, token pair, me va logout DTO’lari.
20. `backend/src/auth/auth.service.ts` — `login()`, `refresh()`, `logout()`, token verify va issue.
21. `backend/src/auth/access.guard.ts` — Bearer access-token guard.
22. `backend/src/auth/auth.controller.ts` — login, refresh, logout va me REST/Swagger contracti.
23. `backend/src/auth/auth.module.ts` — auth dependency graph.

Auth endpointlari:

```text
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### Backend analytics

24. `backend/src/analytics/analytics.dto.ts` — event, device summary, overview va event-list DTO’lari.
25. `backend/src/analytics/analytics.service.ts` — `record()`, `overview()`, `devices()`, `byDevice()`.
26. `backend/src/analytics/analytics.controller.ts` — analytics REST va Swagger contracti.
27. `backend/src/analytics/analytics.module.ts` — analytics dependency graph.

Analytics endpointlari:

```text
GET /api/analytics/overview
GET /api/analytics/devices
GET /api/analytics/devices/:deviceId
```

### ElevenLabs integration

28. `backend/src/elevenlabs/elevenlabs.service.ts` — `.env` URL qaytaruvchi `conversationUrl()`.
29. `backend/src/elevenlabs/elevenlabs.module.ts` — service’ni Devices module uchun export qilish.

Mikroservis audio qabul qilmaydi, WebSocket proxy qilmaydi va ElevenLabs API key
saqlamaydi.

### Backend device CRUD

30. `backend/src/devices/device.types.ts` — internal `Device` va secretsiz `PublicDevice`.
31. `backend/src/devices/device.dto.ts` — create, update, credential va response DTO’lari.
32. `backend/src/devices/devices.repository.ts` — JSON `all()` va atomic `transaction()`.
33. `backend/src/devices/devices.service.ts` — list/get/create/update/remove/conversation logikasi.
34. `backend/src/devices/devices.controller.ts` — CRUD, validation, security va Swagger contracti.
35. `backend/src/devices/devices.module.ts` — Auth, Analytics va ElevenLabs integratsiyasi.

Device endpointlari:

```text
GET    /api/devices
GET    /api/devices/:deviceId
POST   /api/devices
PATCH  /api/devices/:deviceId
DELETE /api/devices/:deviceId
POST   /api/devices/:deviceId/conversation-url
```

Conversation tekshiruvi:

```text
path.deviceId mavjud
X-API-Key === path.deviceId
body.deviceApiKey === stored deviceApiKey
device.enabled === true
```

### Backend bootstrap va Swagger

36. `backend/src/health.dto.ts` — health Swagger response modeli.
37. `backend/src/health.controller.ts` — `GET /api/health`.
38. `backend/src/app.module.ts` — barcha backend modullari va React static serving.
39. `backend/src/main.ts` — global `/api`, validation, OpenAPI va `0.0.0.0:9596` listener.

`main.ts` quyidagilarni yaratadi:

- `access-token` Bearer security scheme;
- `device-id` X-API-Key security scheme;
- public Swagger UI;
- public OpenAPI JSON va YAML;
- Auth, Devices, Analytics va System taglari.

### Frontend foundation

40. `frontend/package.json` — React/Vite build va watch; alohida HTTP server yo‘q.
41. `frontend/tsconfig.json` — strict browser TypeScript.
42. `frontend/vite.config.ts` — React production bundle.
43. `frontend/src/vite-env.d.ts` — Vite type declaration.
44. `frontend/index.html` — React root, metadata, title va favicon.
45. `frontend/public/favicon.svg` — lokal favicon.

### Frontend API va auth

46. `frontend/src/api/client.ts` — relative `/api`, token storage, error va single-flight refresh.
47. `frontend/src/auth/AuthProvider.tsx` — session restore, login, refresh va logout.
48. `frontend/src/pages/LoginPage.tsx` — admin login formasi va error holatlari.

### Frontend sahifalari

49. `frontend/src/devices/DevicesPage.tsx` — create/read/update/key-update/enable/delete UI.
50. `frontend/src/analytics/AnalyticsPage.tsx` — counters, latency va device audit UI.
51. `frontend/src/App.tsx` — routes, auth navigation va public Swagger tugmasi.
52. `frontend/src/main.tsx` — React, BrowserRouter va AuthProvider bootstrap.
53. `frontend/src/styles.css` — responsive login, navigation, Swagger, CRUD va analytics UI.

Swagger tugmasi `/api/swagger`ni `target="_blank"` bilan yangi tabda ochadi va login
qilinmagan holatda ham ko‘rinadi.

### Test va operator hujjati

54. `tests/full-stack.e2e.test.mjs` — REST, OpenAPI va browser integration testi.
55. `README.md` — install, start, login, Swagger, device request va verification hujjati.

## Swagger qamrovi

OpenAPI specification 14 ta operationni qamrab oladi:

| Tag       | Operationlar | Security                               |
| --------- | -----------: | -------------------------------------- |
| System    |            1 | Public                                 |
| Auth      |            4 | Login/refresh/logout public, me Bearer |
| Devices   |            6 | CRUD Bearer, conversation device-id    |
| Analytics |            3 | Bearer                                 |

Swagger sahifasi public bo‘lishi biznes endpointlarining himoyasini olib tashlamaydi.

## Backend–frontend integration xaritasi

| Frontend harakati | Backend endpoint                | Auth               |
| ----------------- | ------------------------------- | ------------------ |
| Login             | `POST /api/auth/login`          | Public             |
| Session restore   | `GET /api/auth/me`              | Bearer             |
| Token refresh     | `POST /api/auth/refresh`        | Refresh token body |
| Logout            | `POST /api/auth/logout`         | Refresh token body |
| Device list       | `GET /api/devices`              | Bearer             |
| Device create     | `POST /api/devices`             | Bearer             |
| Device update     | `PATCH /api/devices/:deviceId`  | Bearer             |
| Device delete     | `DELETE /api/devices/:deviceId` | Bearer             |
| Analytics         | `GET /api/analytics/overview`   | Bearer             |
| Swagger button    | `GET /api/swagger`              | Public             |

Hardware integration:

| Client | Endpoint                                       | Auth                 |
| ------ | ---------------------------------------------- | -------------------- |
| Device | `POST /api/devices/:deviceId/conversation-url` | X-API-Key + body key |

## Automated verification

`tests/full-stack.e2e.test.mjs` quyidagilarni tekshiradi:

1. dotenv admin password parsing;
2. single-port React SPA;
3. REST API va SPA route ajratilishi;
4. public Swagger UI va OpenAPI;
5. barcha 14 OpenAPI operation;
6. Bearer va device-id security schema;
7. auth va refresh rotation;
8. to‘liq device CRUD;
9. conversation credential tekshiruvi;
10. analytics;
11. frontend automatic refresh;
12. Swagger tugmasining yangi tab ochishi;
13. Chrome login/CRUD/analytics/logout;
14. browser runtime error audit.

## Ishga tushirish

```bash
cd "/home/jayxun/Desktop/mini microservice"
npm start
```

```text
login: admin
password: admin!@#
```

```bash
npm run verify
```
