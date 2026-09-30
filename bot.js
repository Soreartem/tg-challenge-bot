'use strict';

const fs = require('fs');

// ---------- Настройки ----------
const CHAT_ID = '1330106113';
// дата старта: 17 сентября текущего года (день 0 = 17.09, день 1 = 18.09)
const START = new Date(new Date().getFullYear(), 8, 17);
const DAY_LIMIT = 100;

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY100 = new Date(START.getTime() + DAY_LIMIT * DAY_MS);

// ---------- Токен: из переменной BOT_TOKEN или из .env ----------
let token = process.env.BOT_TOKEN || null;
if (!token) {
  try {
    const m = fs.readFileSync('.env', 'utf8').match(/^BOT_TOKEN\s*=\s*(.+)$/m);
    token = m ? m[1].trim() : null;
  } catch {}
}
if (!token) {
  console.error('Нет токена: не задан BOT_TOKEN (и нет .env). Локально — в .env, в GitHub Actions — в Secrets.');
  process.exit(1);
}
const API = `https://api.telegram.org/bot${token}/`;

function dayCount() {
  const now = new Date();
  return Math.floor(
    (now - new Date(START.getFullYear(), START.getMonth(), START.getDate())) / DAY_MS
  );
}

function todayKey(d) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

// ---------- Тексты ----------
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
  21: '💪 Три недели без. Сильнейшая треть пути позади.',
  30: '🎉 ЦЕЛЫЙ МЕСЯЦ без! 720 часов трезвости. Уже месяц — это мощно.',
  60: '🚀 Два месяца без. 1440 часов чёткой головы, и ты всё ещё идёшь.',
  90: '🌟 Три месяца — 90 дней! До финиша всего 10 дней. Почти там!',
  99: '🏁 Один день до победы! Завтра 100/100. Держись до финишной прямой!',
  100:
    '🏆\n\n🎉 100/100 — ЧЕЛЛЕНДЖ ПРОЙДЕН!\n\n100 дней без капли — 2400 часов трезвости. Это не просто стрик, это новая жизнь. Ты победил цель — 100-дневный челлендж официально завершен.\n\nС днём 100-й трезвости! Ты на это заслуженно заработал 🥳🔥',
  101:
    '🥇\n\nОдин день за финишной прямой. Челлендж закончен, а ты — всё ещё держишься.\n\nДалее уже не «декад», а просто жизнь без алкоголя. Никаких дней и процентов — просто так и живётся. Ты выиграл. Настоящего, по-настоящему. 🏆🔥',
};

const FACTS = [
  (d) => `${d} дней трезвости — уже ${d * 24} часов чёткой головы.`,
  (d) => `Дней до финиша: ${DAY_LIMIT - d}. Часов до него: ${(DAY_LIMIT - d) * 24}.`,
  'Система вознаграждения мозга восстанавливается по расписанию: через неделю стабильнее сон, через 2–3 недели — вкус и энергия.',
  'Печень начинает восстанавливаться сразу: уже 1 день трезвости снижает нагрузку.',
  'Кишечные бактерии начинают перестраиваться с момента, как алкоголь ушёл из организма — трезвость помогает микробиому.',
  'Алкоголь обезвоживает: ~200 мл воды на бокал вина. Полный день трезвости = 576 таких бокалов.',
  'С алкоголем нарушается сон REM-фазы; через несколько дней трезвости сон становится глубже и ты просыпаешься бодрее.',
  'ГАМК и дофамин перестраиваются за 1–3 недели без алкоголя — настроение перестаёт «качаться».',
  'Каждые 2 часа трезвости — это больше кислорода и питательных веществ, чем дало бы бокал.',
  'В 100 днях тебя ждёт 2400 часов трезвости. Это 100 полных дней, 100 полных ночей — почти целые лето и осень.',
];

function fact(day) {
  const f = FACTS[Math.floor(Math.random() * FACTS.length)];
  return typeof f === 'function' ? f(day) : f;
}

function buildMessage(day) {
  if (day === 101) return MILESTONES[101];
  if (day === 100) return MILESTONES[100];
  const ms = MILESTONES[day];
  if (ms) return `🔥 ${day}/100 · ${day}%\n${ms}`;
  return (
    `🔥 ${day}/100 · ${day}%\n` +
    `${duration(day)} без — уже ${day * 24} часов.\n\n` +
    fact(day)
  );
}

// ---------- Отправка ----------
async function send(text) {
  const res = await fetch(`${API}sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'ошибка от Telegram');
}

// ---------- Расписание ----------
function next6AM(now) {
  const d = new Date(now);
  d.setHours(6, 0, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  return d;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SENT_FILE = '.sentDays';
let sent = new Set();
try {
  sent = new Set(fs.readFileSync(SENT_FILE, 'utf8').split('\n').filter(Boolean));
} catch {}
function persistSent() {
  fs.writeFileSync(SENT_FILE, Array.from(sent).join('\n'));
}

async function main() {
  console.log(`Челлендж: старт 17.09.2025 → 100-й день: ${DAY100.toLocaleDateString('ru-RU')}`);
  const d0 = dayCount();
  console.log(`Сегодня: день ${d0}.`);

  // --once: отправить сообщение за сегодня и выйти (режим GitHub Actions)
  if (process.argv.includes('--once')) {
    if (d0 >= 1 && d0 <= 101) {
      await send(buildMessage(d0));
      console.log(`День ${d0} отправлен ✓`);
    } else if (d0 > 101) {
      console.log('Челлендж завершён, сообщений больше не отправляем.');
    }
    process.exit(0);
  }

  // --test: отправить за сегодня, помечить как отправленный и выйти (для проверки)
  if (process.argv.includes('--test')) {
    await send(buildMessage(d0));
    if (d0 >= 1 && d0 <= 101) {
      sent.add(todayKey(new Date()));
      persistSent();
    }
    console.log('Тестовое сообщение отправлено ✓ (сегодняшний день помечен как отправленный)');
    process.exit(0);
  }

  process.on('SIGINT', () => {
    console.log('\nБот остановлен, прогресс сохранён.');
    process.exit(0);
  });

  for (;;) {
    const now = new Date();
    const d = dayCount();
    const tk = todayKey(now);

    if (d > 101) {
      console.log('Готово: все сообщения отправлены, челлендж завершён. Выключаю.');
      break;
    }
    if (d >= 1 && !sent.has(tk)) {
      try {
        await send(buildMessage(d));
        sent.add(tk);
        persistSent();
        console.log(`День ${d} отправлен ✓`);
      } catch (e) {
        console.error('Не отправилось (будет повтор):', e.message);
      }
    }

    const target = next6AM(now);
    const failed = d >= 1 && d <= 101 && !sent.has(tk);
    const waitMs = failed ? Math.min(15 * 60000, target - now) : target - now;
    console.log('Следующая проверка: ' + new Date(now + waitMs).toLocaleString('ru-RU'));
    await sleep(waitMs);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
