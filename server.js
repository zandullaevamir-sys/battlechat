const TelegramBot = require('node-telegram-bot-api');

function initTelegramBot() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.log('Telegram bot disabled: set BOT_TOKEN in .env to enable live bot integration.');
    return null;
  }

  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      'BattleChat botga xush kelibsiz! Ovoz berish, admin va leaderboard uchun saytni oching.'
    );
  });

  console.log('Telegram bot started with polling enabled.');
  return bot;
}

module.exports = { initTelegramBot };
