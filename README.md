# BattleChat stage-1 MVP

BattleChat - Telegram Mini App bo'lib, unda O'zbek va Qaraqalpaq bloggerlari kunlik 1-vs-1 janglarda kurashadi va foydalanuvchilar ovoz beradi.

## Loyiha xususiyatlari

- Telegram WebApp autentifikatsiyasi
- Dark modern mobile-first interfeys
- SQLite + better-sqlite3 ma'lumotlar bazasi
- Express static backend + Vite React frontend
- 1-vs-1 janglar, ovoz berish, reyting va tarix
- Admin panel orqali bloggerlar va janglar boshqaruvi
- Render uchun mos ishlash

## Ishga tushirish

1. `.env` faylini yarating va `.env.example` ichidagi ma'lumotlarni kiriting.
2. Bog'lamalarni o'rnating:

```bash
npm install
```

3. Frontend buildini yarating:

```bash
npm run build
```

4. Serverni ishga tushiring:

```bash
npm start
```

## ENV o'zgaruvchilari

- `PORT` — ichki port, Render tomonidan beriladi
- `NODE_ENV` — `development` yoki `production`
- `DB_PATH` — SQLite DB fayli yo'li. Standart: `./data/battlechat.db`
- `TELEGRAM_BOT_TOKEN` — BotFather bilan yaratilgan bot tokeni
- `WEBAPP_URL` — Mini App ochiladigan URL
- `ADMIN_TELEGRAM_IDS` — admin Telegram IDlari, vergul bilan ajratiladi

## BotFather bilan bot yaratish

1. Telegramda `@BotFather` bilan habarlarni oching.
2. `/newbot` buyrug'ini yuboring.
3. Bot nomi va username kiriting.
4. Tokenni oling va `.env` faylga yozing.

## Render deploy qilish

Build Command:

```bash
npm install && npm run build
```

Start Command:

```bash
npm start
```

Environment variables bo'limida quyidagilarni kiriting:

- `PORT`
- `NODE_ENV=production`
- `DB_PATH=./data/battlechat.db`
- `TELEGRAM_BOT_TOKEN`
- `WEBAPP_URL`
- `ADMIN_TELEGRAM_IDS`

## Health check

```bash
curl https://your-app.onrender.com/health
```

## Xavfsizlik

- Barcha foydalanuvchi identifikatsiyasi Telegram `initData` orqali tekshiriladi
- HMAC hash serverda tekshiriladi
- `user_id` hech qachon klientdan ishonchsiz tarzda qabul qilinmaydi
- Ovoz berish endpointi rate-limited
- SQLite so'rovlari parametrik tarzda ishlatiladi

## Out of scope

- Super vote / to'lovli ovozlar
- Sponsor bannerlar
- Bot orqali ovoz tasdiqlash
