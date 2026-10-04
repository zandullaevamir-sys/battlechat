const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createBot, getWebhookPath } = require('./bot');
const {
  initializeDatabase,
  getActiveBattleData,
  getBloggers,
  getBloggerById,
  getLeaderboard,
  getFinishedBattles,
  createOrUpdateBlogger,
  createBattle,
  getBattleById,
  getBattleVotingSummary,
  recordVote,
  closeBattleIfExpired,
  getAdminIds,
  upsertUser
} = require('./db');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const rootDir = path.resolve(__dirname, '..');
const clientDist = path.join(rootDir, 'client', 'dist');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Juda tez ovoz berdingiz. Biroz kutib, qayta urinib ko\'ring.' }
});

function parseTelegramInitData(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const data = {};
  for (const chunk of raw.split('&')) {
    const index = chunk.indexOf('=');
    if (index === -1) continue;
    const key = decodeURIComponent(chunk.slice(0, index));
    const value = decodeURIComponent(chunk.slice(index + 1));
    data[key] = value;
  }
  return data;
}

function verifyTelegramInitData(raw, botToken) {
  if (!raw || !botToken) return null;
  const payload = parseTelegramInitData(raw);
  const hash = payload.hash;
  if (!hash) return null;

  const authDate = Number(payload.auth_date || 0);
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > 86400) return null;

  const checkString = Object.keys(payload)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  return signature === hash ? payload : null;
}

function getAuthenticatedUser(req) {
  const initData = req.headers['x-telegram-init-data'] || req.body?.initData || req.query?.initData;

  if (initData) {
    const validated = verifyTelegramInitData(initData, process.env.TELEGRAM_BOT_TOKEN || '');
    if (!validated) return null;

    const user = JSON.parse(validated.user || '{}');
    if (!user.id) return null;

    const userPayload = {
      id: String(user.id),
      name: user.first_name || user.username || 'Telegram foydalanuvchi',
      username: user.username || null,
      source: 'telegram'
    };

    upsertUser({
      telegram_id: userPayload.id,
      name: userPayload.name,
      username: userPayload.username
    });

    return userPayload;
  }

  if (!isProduction) {
    const guestId = req.headers['x-guest-id'] || req.body?.guest_id || req.query?.guest_id;
    if (guestId) {
      const guestUser = {
        id: String(guestId),
        name: 'Mehmon foydalanuvchi',
        username: null,
        source: 'guest'
      };

      upsertUser({
        telegram_id: guestUser.id,
        name: guestUser.name,
        username: guestUser.username
      });

      return guestUser;
    }
  }

  return null;
}

function requireAdmin(req, res, next) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Autentifikatsiya xatosi.' });
  }

  const adminIds = getAdminIds();
  const isAdmin = adminIds.includes(Number(user.id)) || adminIds.includes(String(user.id));
  if (!isAdmin) {
    return res.status(403).json({ ok: false, error: 'Bu bo\'lim faqat admin uchun.' });
  }

  req.user = user;
  next();
}

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'battlechat', status: 'healthy' });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'battlechat', status: 'healthy' });
});

app.get('/api/bloggers', (req, res) => {
  try {
    return res.json({ ok: true, bloggers: getBloggers() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Bloggerlar yuklanmadi.' });
  }
});

app.get('/api/bloggers/:id', (req, res) => {
  try {
    const blogger = getBloggerById(Number(req.params.id));
    if (!blogger) {
      return res.status(404).json({ ok: false, error: 'Blogger topilmadi.' });
    }
    return res.json({ ok: true, blogger });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Profil yuklanmadi.' });
  }
});

app.get('/api/battle', (req, res) => {
  try {
    return res.json({ ok: true, battle: getActiveBattleData() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Jang ma\'lumotlari yuklanmadi.' });
  }
});

app.get('/api/leaderboard', (req, res) => {
  try {
    return res.json({ ok: true, leaderboard: getLeaderboard() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Reyting yuklanmadi.' });
  }
});

app.get('/api/history', (req, res) => {
  try {
    return res.json({ ok: true, battles: getFinishedBattles() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Oldingi janglar yuklanmadi.' });
  }
});

app.post('/api/vote', voteLimiter, (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Telegram autentifikatsiyasi talab qilinadi.' });
    }

    const battleId = Number(req.body?.battle_id || req.body?.battleId);
    const bloggerId = Number(req.body?.blogger_id || req.body?.bloggerId);

    if (!battleId || !bloggerId) {
      return res.status(400).json({ ok: false, error: 'Yaroqsiz ma\'lumot.' });
    }

    const result = recordVote({ userId: user.id, battleId, bloggerId });
    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.error || 'Ovoz berish bajarilmadi.' });
    }

    const battle = getBattleById(battleId);
    const summary = getBattleVotingSummary(battleId);
    return res.json({ ok: true, battle, summary, votedFor: bloggerId, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Ovoz berish xatosi.' });
  }
});

app.post('/api/admin/bloggers', requireAdmin, (req, res) => {
  try {
    const blogger = createOrUpdateBlogger(req.body || {});
    return res.json({ ok: true, blogger });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ ok: false, error: error.message || 'Blogger saqlanmadi.' });
  }
});

app.post('/api/admin/battle', requireAdmin, (req, res) => {
  try {
    const battle = createBattle(req.body || {});
    return res.json({ ok: true, battle });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ ok: false, error: error.message || 'Jang yaratilmadi.' });
  }
});

app.post('/api/admin/battle/:id/close', requireAdmin, (req, res) => {
  try {
    const battleId = Number(req.params.id);
    const battle = getBattleById(battleId);
    if (!battle) {
      return res.status(404).json({ ok: false, error: 'Jang topilmadi.' });
    }

    const summary = getBattleVotingSummary(battleId);
    const winnerId = summary.votes.a > summary.votes.b
      ? battle.blogger_a_id
      : summary.votes.b > summary.votes.a
        ? battle.blogger_b_id
        : null;

    const updatedBattle = closeBattleIfExpired(battleId, winnerId);
    return res.json({ ok: true, battle: updatedBattle, winner_id: winnerId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Jang yopilmadi.' });
  }
});

const bot = createBot();

if (bot) {
  const webhookPath = getWebhookPath();
  if (isProduction && process.env.WEBAPP_URL) {
    bot.api.setWebhook(`${process.env.WEBAPP_URL}${webhookPath}`).catch((err) => console.error('Webhook xatosi:', err));
    app.post(webhookPath, (req, res) => {
      bot.handleUpdate(req.body, res);
    });
  } else {
    bot.start();
  }
}

app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/bot/')) {
    return next();
  }

  const indexFile = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }

  return res.status(404).send('BattleChat frontend topilmadi. `npm run build` bajaring.');
});

initializeDatabase();

setInterval(() => {
  closeBattleIfExpired();
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`BattleChat server ishlamoqda: http://localhost:${PORT}`);
});
