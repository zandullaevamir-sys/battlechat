const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './data/battlechat.db';
const absoluteDbPath = path.resolve(process.cwd(), dbPath);
fs.mkdirSync(path.dirname(absoluteDbPath), { recursive: true });

const db = new Database(absoluteDbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id TEXT PRIMARY KEY,
    name TEXT,
    username TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bloggers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    photo_url TEXT,
    category TEXT NOT NULL,
    social_link TEXT,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS battles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blogger_a_id INTEGER NOT NULL,
    blogger_b_id INTEGER NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    winner_id INTEGER,
    FOREIGN KEY(blogger_a_id) REFERENCES bloggers(id),
    FOREIGN KEY(blogger_b_id) REFERENCES bloggers(id)
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    battle_id INTEGER NOT NULL,
    blogger_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, battle_id)
  );
`);

const SAMPLE_BLOGGERS = [
  { name: 'Sardor Qayumov', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80', category: 'qo\'siqchi', social_link: 'https://t.me/sardor' },
  { name: 'Nigora Aliyeva', photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80', category: 'qo\'siqchi', social_link: 'https://instagram.com/nigora' },
  { name: 'Doston Yo\'ldoshev', photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', category: 'qiziqchi', social_link: 'https://youtube.com/@doston' },
  { name: 'Jasur Yusupov', photo_url: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80', category: 'qiziqchi', social_link: 'https://tiktok.com/@jasur' },
  { name: 'Aziza Rahimova', photo_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80', category: 'yutuber', social_link: 'https://youtube.com/@aziza' },
  { name: 'Rasul Karimov', photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', category: 'brendfeys', social_link: 'https://instagram.com/rasul' }
];

function getAdminIds() {
  const raw = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map((item) => item.trim()).filter(Boolean);
  return raw;
}

function initializeDatabase() {
  const count = db.prepare('SELECT COUNT(*) AS total FROM bloggers').get()?.total || 0;
  if (count === 0) {
    const insert = db.prepare(`INSERT INTO bloggers (name, photo_url, category, social_link, wins, losses) VALUES (?, ?, ?, ?, 0, 0)`);
    for (const blogger of SAMPLE_BLOGGERS) {
      insert.run(blogger.name, blogger.photo_url, blogger.category, blogger.social_link);
    }

    const bloggers = db.prepare('SELECT id, name FROM bloggers ORDER BY id ASC LIMIT 2').all();
    if (bloggers.length >= 2) {
      const start = new Date();
      const end = new Date(start.getTime() + 12 * 60 * 60 * 1000);
      db.prepare(`
        INSERT INTO battles (blogger_a_id, blogger_b_id, starts_at, ends_at, status, winner_id)
        VALUES (?, ?, ?, ?, 'active', NULL)
      `).run(bloggers[0].id, bloggers[1].id, start.toISOString(), end.toISOString());
    }
  }
}

function getBloggers() {
  return db.prepare('SELECT * FROM bloggers ORDER BY wins DESC, name ASC').all();
}

function getBloggerById(id) {
  return db.prepare('SELECT * FROM bloggers WHERE id = ?').get(id);
}

function getBattleById(id) {
  return db.prepare('SELECT * FROM battles WHERE id = ?').get(id);
}

function getBattleVotingSummary(battleId) {
  const battle = getBattleById(battleId);
  if (!battle) {
    return { votes: { a: 0, b: 0 }, total: 0 };
  }

  const summary = db.prepare(`
    SELECT
      SUM(CASE WHEN blogger_id = ? THEN 1 ELSE 0 END) AS aVotes,
      SUM(CASE WHEN blogger_id = ? THEN 1 ELSE 0 END) AS bVotes
    FROM votes
    WHERE battle_id = ?
  `).get(battle.blogger_a_id, battle.blogger_b_id, battleId) || { aVotes: 0, bVotes: 0 };

  return {
    votes: {
      a: Number(summary.aVotes || 0),
      b: Number(summary.bVotes || 0)
    },
    total: Number(summary.aVotes || 0) + Number(summary.bVotes || 0)
  };
}

function getActiveBattleData() {
  const battle = db.prepare(`SELECT * FROM battles WHERE status = 'active' ORDER BY starts_at DESC LIMIT 1`).get();
  if (!battle) return null;

  const a = getBloggerById(battle.blogger_a_id);
  const b = getBloggerById(battle.blogger_b_id);
  const summary = getBattleVotingSummary(battle.id);
  const total = summary.total || 1;

  return {
    id: battle.id,
    starts_at: battle.starts_at,
    ends_at: battle.ends_at,
    status: battle.status,
    blogger_a: {
      ...a,
      vote_count: summary.votes.a,
      percent: Math.round((summary.votes.a / total) * 100)
    },
    blogger_b: {
      ...b,
      vote_count: summary.votes.b,
      percent: Math.round((summary.votes.b / total) * 100)
    }
  };
}

function getLeaderboard() {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const rows = db.prepare(`
    SELECT b.category, b.name, b.id,
      COUNT(CASE WHEN ba.winner_id = b.id AND ba.starts_at >= ? THEN 1 END) AS points
    FROM bloggers b
    LEFT JOIN battles ba ON ba.winner_id = b.id
    GROUP BY b.id, b.category, b.name
    ORDER BY b.category ASC, points DESC, b.name ASC
  `).all(weekStart.toISOString());

  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = [];
    grouped[row.category].push({ id: row.id, name: row.name, points: Number(row.points || 0) });
  }

  return Object.entries(grouped).map(([category, items]) => ({ category, items }));
}

function getFinishedBattles() {
  const rows = db.prepare(`
    SELECT b.id, b.starts_at, b.ends_at, b.status, b.winner_id,
      a.name AS blogger_a_name,
      c.name AS blogger_b_name,
      w.name AS winner_name
    FROM battles b
    LEFT JOIN bloggers a ON a.id = b.blogger_a_id
    LEFT JOIN bloggers c ON c.id = b.blogger_b_id
    LEFT JOIN bloggers w ON w.id = b.winner_id
    WHERE b.status = 'completed'
    ORDER BY b.ends_at DESC
  `).all();

  return rows.map((row) => ({
    id: row.id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    status: row.status,
    winner_id: row.winner_id,
    blogger_a_name: row.blogger_a_name,
    blogger_b_name: row.blogger_b_name,
    winner_name: row.winner_name || 'Durang'
  }));
}

function upsertUser({ telegram_id, name, username }) {
  if (!telegram_id) return null;
  const existing = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id);
  if (existing) {
    db.prepare('UPDATE users SET name = ?, username = ? WHERE telegram_id = ?')
      .run(name || existing.name, username || existing.username, telegram_id);
    return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id);
  }

  db.prepare('INSERT INTO users (telegram_id, name, username) VALUES (?, ?, ?)')
    .run(telegram_id, name || null, username || null);
  return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id);
}

function createOrUpdateBlogger(payload) {
  const name = String(payload.name || '').trim();
  const category = String(payload.category || '').trim();
  const photoUrl = String(payload.photo_url || '').trim();
  const socialLink = String(payload.social_link || '').trim();

  if (!name || !category) {
    throw new Error('Ism va kategoriya majburiy.');
  }

  const existingId = Number(payload.id || 0);
  if (existingId) {
    db.prepare(`
      UPDATE bloggers
      SET name = ?, photo_url = ?, category = ?, social_link = ?
      WHERE id = ?
    `).run(name, photoUrl || null, category, socialLink || null, existingId);
    return getBloggerById(existingId);
  }

  const result = db.prepare(`
    INSERT INTO bloggers (name, photo_url, category, social_link, wins, losses)
    VALUES (?, ?, ?, ?, 0, 0)
  `).run(name, photoUrl || null, category, socialLink || null);
  return getBloggerById(result.lastInsertRowid);
}

function createBattle(payload) {
  const bloggerAId = Number(payload.blogger_a_id || payload.bloggerAId);
  const bloggerBId = Number(payload.blogger_b_id || payload.bloggerBId);
  const startsAt = payload.starts_at || payload.startsAt;
  const endsAt = payload.ends_at || payload.endsAt;

  if (!bloggerAId || !bloggerBId || bloggerAId === bloggerBId) {
    throw new Error('Ikki xil blogger tanlang.');
  }
  if (!startsAt || !endsAt) {
    throw new Error('Boshlanish va tugash vaqti kerak.');
  }

  const a = getBloggerById(bloggerAId);
  const b = getBloggerById(bloggerBId);
  if (!a || !b) {
    throw new Error('Tanlangan blogger topilmadi.');
  }

  const result = db.prepare(`
    INSERT INTO battles (blogger_a_id, blogger_b_id, starts_at, ends_at, status, winner_id)
    VALUES (?, ?, ?, ?, 'active', NULL)
  `).run(bloggerAId, bloggerBId, new Date(startsAt).toISOString(), new Date(endsAt).toISOString());

  return getBattleById(result.lastInsertRowid);
}

function recordVote({ userId, battleId, bloggerId }) {
  const battle = getBattleById(battleId);
  if (!battle) {
    return { ok: false, error: 'Jang topilmadi.' };
  }
  if (battle.status !== 'active') {
    return { ok: false, error: 'Bu jang allaqachon yopilgan.' };
  }

  if (bloggerId !== battle.blogger_a_id && bloggerId !== battle.blogger_b_id) {
    return { ok: false, error: 'Yaroqsiz blogger tanlovi.' };
  }

  const existing = db.prepare('SELECT * FROM votes WHERE user_id = ? AND battle_id = ?').get(String(userId), battleId);
  if (existing) {
    return { ok: false, error: 'Siz allaqachon ovoz bergansiz.' };
  }

  db.prepare('INSERT INTO votes (user_id, battle_id, blogger_id) VALUES (?, ?, ?)')
    .run(String(userId), battleId, bloggerId);

  return { ok: true };
}

function closeBattleIfExpired(battleId = null, winnerIdOverride = null) {
  const whereQuery = battleId ? 'WHERE id = ? AND status = \'active\'' : 'WHERE status = \'active\' AND ends_at <= ?';
  const params = battleId ? [battleId] : [new Date().toISOString()];
  const rows = db.prepare(`SELECT * FROM battles ${whereQuery} ORDER BY id ASC`).all(...params);

  for (const battle of rows) {
    const summary = getBattleVotingSummary(battle.id);
    let winnerId = winnerIdOverride;
    if (winnerIdOverride === null || winnerIdOverride === undefined) {
      winnerId = summary.votes.a > summary.votes.b ? battle.blogger_a_id : summary.votes.b > summary.votes.a ? battle.blogger_b_id : null;
    }

    db.prepare('UPDATE battles SET status = ?, winner_id = ? WHERE id = ?').run('completed', winnerId, battle.id);

    const a = getBloggerById(battle.blogger_a_id);
    const b = getBloggerById(battle.blogger_b_id);
    if (a && b) {
      const aWins = winnerId === a.id ? 1 : 0;
      const bWins = winnerId === b.id ? 1 : 0;
      db.prepare('UPDATE bloggers SET wins = wins + ?, losses = losses + ? WHERE id = ?').run(aWins, aWins ? 0 : 1, a.id);
      db.prepare('UPDATE bloggers SET wins = wins + ?, losses = losses + ? WHERE id = ?').run(bWins, bWins ? 0 : 1, b.id);
    }
  }

  if (battleId) {
    return getBattleById(battleId);
  }

  return rows;
}

module.exports = {
  db,
  initializeDatabase,
  getAdminIds,
  getBloggers,
  getBloggerById,
  getActiveBattleData,
  getLeaderboard,
  getFinishedBattles,
  getBattleById,
  getBattleVotingSummary,
  createOrUpdateBlogger,
  createBattle,
  recordVote,
  closeBattleIfExpired,
  upsertUser
};
