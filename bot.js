const fs = require('fs');

// ---------- Настройки ----------
const CHAT_IDS = ['1330106113', '7975052871']; 
// Дата старта: 17 сентября текущего года
const START = new Date(new Date().getFullYear(), 8, 17);

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------- Токен ----------
let token = process.env.BOT_TOKEN || null;
if (!token) {
  try {
    const m = fs.readFileSync('.env', 'utf8').match(/^BOT_TOKEN\s*=\s*(.+)$/m);
    token = m ? m[1].trim() : null;
  } catch {}
}
if (!token) {
  console.error('Нет токена: не задан BOT_TOKEN (и нет .env).');
  process.exit(1);
}
const API = `https://api.telegram.org/bot${token}/`;

function dayCount() {
  const now = new Date();
  return Math.max(1, Math.floor(
    (now - new Date(START.getFullYear(), START.getMonth(), START.getDate())) / DAY_MS
  ));
}

// ---------- Промпты для генерации ИИ-артов ----------
const IMAGE_PROMPTS = [
    "gigachad muscular man training in dark hardcore gym, heavy barbell, cinematic lighting, 8k",
    "stoic spartan warrior standing in rain looking at sunrise over mountains, epic dark lighting, 8k",
    "cyberpunk samurai walking away from neon bar in rain, discipline and focus, masterpiece, 8k",
    "heavy iron dumbbells on gym floor with chalk dust in air, dramatic spotlight, brutal gym aesthetic",
    "fighter in boxing ring wrapping hands, intense gaze, dark background, sweat and grit, 8k",
    "lone wolf standing on snowy mountain peak under night sky, powerful epic wallpaper, 8k"
];

// ---------- Тексты и склонения ----------
function ru(n, one, few, many) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n100 > 4 && n100 < 20) return n + ' ' + many;
  if (n10 === 1) return n + ' ' + one;
  if (n10 >= 2 && n10 <= 4) return n + ' ' + few;
  return n + ' ' + many;
}

function duration(day) {
  const months = Math.floor(day / 30);
  const weeks = Math.floor((day % 30) / 7);
  const days = day % 7;
  const parts = [
    months ? ru(months, 'месяц', 'месяца', 'месяцев') : '',
    weeks ? ru(weeks, 'неделя', 'недели', 'недель') : '',
    days ? ru(days, 'день', 'дня', 'дней') : '',
  ].filter(Boolean);
  return parts.join(' и ');
}

const MILESTONES = {
  1: '🥂 Первый день без! Начат — и каждая трезвая часика сейчас стоит дороже.',
  7: '🔥 Целая неделя без! 168 часов. Первая волна тяги уже позади, ты в деле.',
  14: '🔥 Две недели без! 336 часов. Держись, самое сложное уже прошло.',
  30: '🦾 Месяц чистоты! 30 дней железной воли. Твой организм и разум говорят спасибо.',
  60: '⚡️ Два месяца! Форма крепчает, дисциплина на высоте.',
  90: '👑 3 месяца! Настоящий титан. Срыв уже не имеет над тобой власти.'
};

function getMessageText(day) {
  let quote = MILESTONES[day] || `💪 День ${day} (${duration(day)}). Идем дальше без задний ног! Трезвость — твой выбор и сила.`;
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  // Если пятница или суббота — добавляем предупреждение от срыва
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    quote += `\n\n⚠️ *Внимание, выходные!* Главная ловушка недели. Перетерпи этот вечер, завтра скажешь себе спасибо.`;
  }

  const money = (day * 350).toLocaleString('ru-RU');
  
  return [
    `🔥 *ЧЕЛЛЕНДЖ: ДЕНЬ ${day}* 🔥`,
    `⏱ Срок: *${duration(day)}*`,
    ``,
    `💬 _${quote}_`,
    ``,
    `📊 *Профит:* Сэкономлено ~*${money} ₽*`,
    `Ни шагу назад. Держим строй! ✊`
  ].join('\n');
}

async function fetchImageBuffer(day) {
    const prompt = encodeURIComponent(IMAGE_PROMPTS[day % IMAGE_PROMPTS.length]);
    const aiUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&seed=${day * 777}`;
    
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(aiUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch (e) {
        console.log('ИИ-генератор недоступен, шлю без фото.');
    }
    return null;
}

// ---------- Основной запуск ----------
async function main() {
  const day = dayCount();
  const text = getMessageText(day);
  const imgBuffer = await fetchImageBuffer(day);

  for (const chatId of CHAT_IDS) {
    try {
      if (imgBuffer) {
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('caption', text);
        formData.append('parse_mode', 'Markdown');
        formData.append('photo', new Blob([imgBuffer], { type: 'image/jpeg' }), 'motivation.jpg');

        const res = await fetch(API + 'sendPhoto', { method: 'POST', body: formData });
        const data = await res.json();
        if (!data.ok) throw new Error(JSON.stringify(data));
      } else {
        const res = await fetch(API + 'sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(JSON.stringify(data));
      }
      console.log(`✅ Успешно отправлено в чат ${chatId}`);
    } catch (e) {
      console.error(`❌ Ошибка отправки для ${chatId}:`, e.message);
    }
  }
}

main();
