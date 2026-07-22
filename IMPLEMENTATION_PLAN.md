# Mini Microservice — tasdiqlangan implementatsiya rejasi

## 1. Chegara va maqsad

Loyiha faqat `/home/jayxun/Desktop/mini microservice` katalogida joylashadi va quyidagi
vazifalarni bajaradi:

1. NestJS REST API orqali admin autentifikatsiyasi.
2. Access token va rotatsiyalanuvchi refresh token.
3. Backend hamda React admin panel orqali to‘liq device CRUD.
4. Device ma’lumotlarini `data/devices.json` faylida saqlash.
5. Device so‘rovida path `deviceId`, `X-API-Key` va body `deviceApiKey`ni tekshirish.
6. Credential’lar to‘g‘ri bo‘lsa `.env`dagi `ELEVENLABS_AGENT_URL`ni qaytarish.
7. URL so‘rovlarini device kesimida audit qilish va React analytics sahifasida ko‘rsatish.
8. Barcha REST endpointlarini public Swagger UI hamda OpenAPI JSON/YAML orqali hujjatlashtirish.

Mikroservis ElevenLabs audio oqimini qabul qilmaydi, WebSocket proxy qilmaydi, audio
saqlamaydi va ElevenLabs API’ga server-side request yubormaydi.

## 2. Arxitektura

```text
Browser — http://localhost:9596
  │
  ▼
NestJS HTTP server
  ├─ /, /devices, /analytics ── React static build + SPA fallback
  ├─ /api/swagger ───────────── Public Swagger UI
  ├─ /api/openapi.json|yaml ─── Public OpenAPI specification
  └─ /api/* ── REST API
       ├─ AuthModule ─────────── data/refresh-tokens.json
       ├─ DevicesModule ──────── data/devices.json
       ├─ AnalyticsModule ────── data/analytics.json
       └─ ElevenLabsModule ───── ELEVENLABS_AGENT_URL (.env)
          ▲
          │ POST /api/devices/:deviceId/conversation-url
          │ X-API-Key: <deviceId>
          │ { "deviceApiKey": "..." }
        Device
```

## 3. Backend rejasi

### 3.1. Config

Backend root `.env` faylini o‘qiydi. Ish katalogi repository root yoki `backend/`
bo‘lishidan qat’i nazar `DATA_DIR` repository rootga nisbatan resolve qilinadi.

Majburiy yoki default qiymatli maydonlar:

```env
PORT=9596
ADMIN_USERNAME=admin
ADMIN_PASSWORD="admin!@#"
ACCESS_TOKEN_SECRET=<kamida-32-belgi>
REFRESH_TOKEN_SECRET=<kamida-32-belgi>
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_SECONDS=604800
ELEVENLABS_AGENT_URL=https://elevenlabs.io/app/talk-to?agent_id=...&branch_id=...
DATA_DIR=./data
```

Startup vaqtida port, TTL, secret uzunligi va agent URL formati validatsiya qilinadi.
`frontend/dist` katalogi NestJS static module orqali shu `PORT`da serve qilinadi.

### 3.2. Auth

| Method | Endpoint            | Himoya        | Vazifa                        |
| ------ | ------------------- | ------------- | ----------------------------- |
| POST   | `/api/auth/login`   | Public        | Login va token pair olish     |
| POST   | `/api/auth/refresh` | Refresh token | Token pair rotatsiyasi        |
| POST   | `/api/auth/logout`  | Public        | Refresh tokenni revoke qilish |
| GET    | `/api/auth/me`      | Access token  | Joriy adminni tekshirish      |

Refresh tokenning o‘zi JSON faylga yozilmaydi; SHA-256 hash, `jti`, expiry va revoked
holati yoziladi. Har refreshdan keyin oldingi token ishlamaydi.

### 3.3. Device CRUD

| Method | Endpoint                 | Himoya       |
| ------ | ------------------------ | ------------ |
| GET    | `/api/devices`           | Access token |
| GET    | `/api/devices/:deviceId` | Access token |
| POST   | `/api/devices`           | Access token |
| PATCH  | `/api/devices/:deviceId` | Access token |
| DELETE | `/api/devices/:deviceId` | Access token |

Device modeli:

```json
{
  "deviceId": "esp32-01",
  "name": "Reception device",
  "deviceApiKey": "device-secret",
  "enabled": true,
  "createdAt": "2026-07-21T10:00:00.000Z",
  "updatedAt": "2026-07-21T10:00:00.000Z"
}
```

`deviceApiKey` faqat storage’da mavjud; CRUD response’larda frontendga qaytarilmaydi.
Key almashtirish `PATCH` orqali bajariladi.

### 3.4. Device conversation URL oqimi

```http
POST /api/devices/esp32-01/conversation-url
X-API-Key: esp32-01
Content-Type: application/json

{
  "deviceApiKey": "device-secret"
}
```

Tekshiruv tartibi:

1. Path’dan `deviceId` olinadi.
2. `X-API-Key` aynan path’dagi `deviceId` bilan timing-safe usulda solishtiriladi.
3. Device JSON storage’dan topiladi va `enabled` holati tekshiriladi.
4. Body’dagi `deviceApiKey` storage’dagi qiymat bilan timing-safe usulda solishtiriladi.
5. Muvaffaqiyatli bo‘lsa `.env`dagi yagona `ELEVENLABS_AGENT_URL` qaytariladi.
6. Natija va backend latency analytics storage’ga yoziladi.

Success response:

```json
{
  "deviceId": "esp32-01",
  "conversationUrl": "https://elevenlabs.io/app/talk-to?agent_id=...&branch_id=..."
}
```

### 3.5. JSON storage kafolatlari

- Har bir process ichidagi read-modify-write operatsiyasi navbat bilan bajariladi.
- Temporary file yozilib, keyin atomic rename qilinadi.
- Yozuv xatosi keyingi queue operatsiyalarini bloklab qo‘ymaydi.
- Fayllar `0600` permission bilan yaratiladi.
- Bu storage bir backend process uchun mo‘ljallangan; multi-instance deployment uchun
  database yoki distributed lock kerak.

## 4. Analytics rejasi

| Method | Endpoint                           | Natija                         |
| ------ | ---------------------------------- | ------------------------------ |
| GET    | `/api/analytics/overview`          | Umumiy counters va device map  |
| GET    | `/api/analytics/devices`           | Device kesimidagi summary list |
| GET    | `/api/analytics/devices/:deviceId` | Device eventlari               |

Event `success`, `rejected` yoki `error` bo‘ladi. `connect` — real ElevenLabs
WebSocket connection emas; backend muvaffaqiyatli conversation URL berganini anglatadi.

## 5. Frontend rejasi

- `/login` — admin autentifikatsiyasi.
- `/devices` — create, read/list, name/API key update, enable/disable va delete.
- `/analytics` — jami, success, rejected, error, device counters, latency va oxirgi
  so‘rov vaqti.
- Frontend API uchun relative `/api` manzilidan foydalanadi.
- UI va API bir origin/portda bo‘lgani uchun alohida CORS yoki frontend port kerak emas.
- Public Swagger tugmasi `/api/swagger`ni yangi tabda ochadi.
- Access token `Authorization: Bearer` orqali yuboriladi.
- 401 holatida refresh faqat bitta parallel request orqali rotatsiya qilinadi va original
  request bir marta qayta bajariladi.
- Reload vaqtida `/auth/me` orqali sessiya tekshiriladi.
- Har bir async UI action xatosi sahifada ko‘rsatiladi.

## 6. Verifikatsiya rejasi

`npm run verify` quyidagilarni avtomatik tekshiradi:

1. Prettier format check.
2. Backend TypeScript/Nest build.
3. Frontend TypeScript/Vite production build.
4. `.env.example` ichidagi maxsus belgili admin paroli dotenv orqali aynan o‘qilishi.
5. NestJS root’dan frontend HTML va SPA route fallback qaytarishi.
6. Swagger UI va OpenAPI JSON/YAML tokensiz ochilishi.
7. OpenAPI ichida barcha 14 REST operation va security scheme mavjudligi.
8. `/api/*` yo‘llari static fallbackga tushmasligi.
9. Unauthorized va noto‘g‘ri login holatlari.
10. Login, `/auth/me`, refresh rotation, logout va revoked token.
11. Device create/list/get/update/enable-disable/delete hamda duplicate conflict.
12. Noto‘g‘ri header, noto‘g‘ri key va disabled device rad etilishi.
13. To‘g‘ri device requestga `.env` URL aynan qaytishi.
14. Barcha analytics endpointlari va counters.
15. Headless Chrome’da NestJS serve qilgan React UI orqali login, CRUD, analytics va
    logout oqimi.
16. Swagger tugmasi yangi tab ochishi.
17. Browser console va page runtime errorlari mavjud emasligi.

## 7. Yakuniy acceptance mezonlari

- Backend va frontend build xatosiz tugaydi.
- UI va API faqat `9596` port orqali ishlaydi.
- JSON data repository ichidagi `data/` katalogida saqlanadi.
- Adminsiz CRUD va analytics ochilmaydi.
- Device faqat uchala credential sharti bajarilganda URL oladi.
- UI’dagi barcha ma’lumotlar REST API’dan keladi; static device yoki analytics yo‘q.
- Automated full-stack test barcha oqimlardan o‘tadi.
