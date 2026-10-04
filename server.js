const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize app
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '.')));

// Rate limiting
const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { ok: false, error: 'Juda tez ovoz berdingiz. Biroz kutib, qayta urinib ko\'ring.' }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'battlechat', status: 'healthy', env: NODE_ENV });
});

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'battlechat', status: 'healthy' });
});

// Vote endpoint (rate limited)
app.post('/api/vote', voteLimiter, (req, res) => {
  const { blogger_id } = req.body;
  if (!blogger_id) {
    return res.status(400).json({ ok: false, error: 'Blogger ID talab qilinadi.' });
  }
  // TODO: implement voting logic with SQLite
  res.json({ ok: true, message: 'Ovoz qabul qilindi', blogger_id });
});

// Get active battle
app.get('/api/battle', (req, res) => {
  // TODO: fetch from SQLite
  res.json({
    ok: true,
    battle: {
      id: 1,
      blogger_a: { name: 'Blogger A', votes: 100 },
      blogger_b: { name: 'Blogger B', votes: 95 }
    }
  });
});

// Serve static files (fallback to index.html for SPA)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ ok: false, error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Bot initialization (optional, no error if token missing)
let bot = null;
if (process.env.TELEGRAM_BOT_TOKEN) {
  try {
    const { Bot } = require('grammy');
    bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
    
    bot.command('start', async (ctx) => {
      const webAppUrl = process.env.WEBAPP_URL || 'https://example.com';
      await ctx.reply("BattleChatga xush kelibsiz!", {
        reply_markup: {
          inline_keyboard: [[{ text: "Battle'ni ochish", web_app: { url: webAppUrl } }]]
        }
      });
    });

    if (NODE_ENV === 'production') {
      console.log('Bot webhook mode: production');
    } else {
      bot.start();
      console.log('Bot polling started in development mode');
    }
  } catch (err) {
    console.warn('Bot initialization failed:', err.message);
  }
} else {
  console.warn('TELEGRAM_BOT_TOKEN not set. Bot disabled.');
}

// Start server
app.listen(PORT, () => {
  console.log(`BattleChat server ishlamoqda: http://localhost:${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Bot status: ${bot ? 'enabled' : 'disabled'}`);
});
