# Mini Microservice

NestJS REST API va React admin paneldan iborat ElevenLabs device gateway. Backend
device’ni tekshiradi, `.env`dagi conversation URL’ni qaytaradi va so‘rov natijasini audit
qiladi. React production build ham NestJS tomonidan serve qilinadi; UI va API bitta
`9596` portda ishlaydi. Audio va WebSocket oqimi mikroservis orqali o‘tmaydi.

## Talablar

- Node.js 22+
- npm 10+
- Full-stack browser test uchun Chrome yoki Chromium

## Sozlash

```bash
cp .env.example .env
npm install
```

`.env` ichidagi `ELEVENLABS_AGENT_URL` va token secretlarni real production qiymatlariga
almashtiring. Default admin credential:

```text
login: admin
password: admin!@#
```

`#` dotenv formatida comment belgisi bo‘lgani uchun parol `.env` ichida albatta
`ADMIN_PASSWORD="admin!@#"` ko‘rinishida qo‘shtirnoq bilan yoziladi.

## Ishga tushirish

Build va start bitta komanda bilan:

```bash
npm start
```

- Admin panel: `http://localhost:9596`
- REST API: `http://localhost:9596/api`
- Health: `http://localhost:9596/api/health`
- Swagger UI: `http://localhost:9596/api/swagger`
- OpenAPI JSON: `http://localhost:9596/api/openapi.json`
- OpenAPI YAML: `http://localhost:9596/api/openapi.yaml`

Frontend uchun alohida HTTP port yoki Vite server ochilmaydi.

Swagger va OpenAPI fayllari public: ularni ochish uchun token talab qilinmaydi. Admin
CRUD endpointlarini Swagger’dan bajarish uchun avval `/api/auth/login` orqali access
token olib, `Authorize` oynasidagi `access-token` maydoniga kiriting. Conversation URL
endpointi uchun `device-id` maydoniga device ID yoziladi.

## Development watch

Birinchi terminal React build’ni kuzatadi:

```bash
npm run dev:frontend
```

Ikkinchi terminal NestJS’ni kuzatadi va frontend build’ni serve qiladi:

```bash
npm run dev:backend
```

Frontend o‘zgarishidan keyin brauzerni refresh qilish kifoya. Development manzili ham
`http://localhost:9596`.

## Build va to‘liq verifikatsiya

```bash
npm run build
npm run verify
```

`verify` format, TypeScript build, bitta `9596` portdagi static SPA/REST ajratilishi va
headless Chrome orqali React login/CRUD/analytics/logout integratsiyasini tekshiradi.
Browser test screenshoti `test-artifacts/full-stack.png`ga yoziladi.

## Device request

```bash
curl -X POST http://localhost:9596/api/devices/esp32-01/conversation-url \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: esp32-01' \
  -d '{"deviceApiKey":"device-secret"}'
```

`X-API-Key` ichida aynan `deviceId` yuboriladi. Body’dagi `deviceApiKey` alohida secret.
Ikkalasi to‘g‘ri va device enabled bo‘lsa response’da `.env`dagi
`ELEVENLABS_AGENT_URL` keladi.

## Data fayllari

- `data/devices.json` — device CRUD holati.
- `data/refresh-tokens.json` — refresh token hash va revoke holati.
- `data/analytics.json` — URL so‘rov auditi.

JSON storage bitta backend process uchun xavfsiz navbat va atomic rename ishlatadi.
Horizontal scale kerak bo‘lsa ushbu qatlamni transactional database bilan almashtirish
lozim.

To‘liq talablar va acceptance mezonlari [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
faylida, barcha fayllarning yozilish tartibi esa
[IMPLEMENTATION_SEQUENCE.md](./IMPLEMENTATION_SEQUENCE.md) faylida yozilgan.
