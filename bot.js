// Укажи дату начала своего челленджа в формате ГГГГ-ММ-ДД:
const CHALLENGE_START = process.env.START_DATE || '2026-10-01';

// Подхватываем токен и ID чата из настроек GitHub Actions
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID || process.env.TELEGRAM_CHAT_ID || process.env.USER_ID;

if (!BOT_TOKEN || !CHAT_ID) {
    console.error('❌ Ошибка: Не найдены BOT_TOKEN или CHAT_ID в переменных окружения!');
    process.exit(1);
}

// База крутых сообщений на каждый день
const DAILY_QUOTES = [
    "Алкоголь — это кредит, который ты берешь у своего завтрашнего состояния под конский процент. Сегодня ты в плюсе.",
    "Пока кто-то сливает тестостерон и прогресс в банку пива, ты строишь лучшую версию себя. Продолжаем.",
    "Одна пьянка откатывает силовые и восстановление на неделю назад. Твой труд стоит дороже пары часов тумана в голове.",
    "Трезвость — это легальный чит-код. Больше энергии, чище голова, жестче дисциплина.",
    "Сорваться легко — для этого вообще ничего делать не надо. А вот держать слово перед самим собой — это уровень.",
    "Помни: еще ни один человек в мире не проснулся утром со словами «Блин, как жаль, что я вчера не нажрался».",
    "Дофамин от реальных побед и прогресса в разы мощнее дешевого кайфа со стакана.",
    "Каждый сухой день — это еще один кирпич в твой характер. Если контролируешь свои слабости, контролируешь всё.",
    "Спирт просто выключает мозг и крадет время. Ты выбрал играть в эту жизнь на максималках и с ясной башкой.",
    "Твоя нервная система, сон и форма сейчас восстанавливаются на 100%. Не тормози этот процесс.",
    "Слабый ищет повод выпить («устал», «стресс», «праздник»). Сильный просто делает то, что решил.",
    "Деньги, которые не ушли в бар и алкомаркет, работают на тебя, а не на чужой карман и твоё похмелье.",
    "Посмотри, сколько дней уже за спиной. Обнулить такой стрик ради пары часов мутного кайфа — вообще не вариант.",
    "Алкоголь не снимает стресс, он просто ставит проблемы на паузу и возвращает их утром с процентами.",
    "Когда пропадает мотивация — включается дисциплина. Мотивация — это эмоция, дисциплина — это решение."
];

// Особые сообщения для ПЯТНИЦЫ и СУББОТЫ (защита от срыва)
const WEEKEND_QUOTES = [
    "⚠️ ВНИМАНИЕ: Выходные — главная ловушка. Сегодня куча людей сольет свои бабки, форму и утро в унитаз. А ты завтра проснешься бодрым королем.",
    "🔥 Пятничный чекпоинт! Соблазн высокий, но именно в такие вечера проверяется настоящий характер. Перетерпи вечер — утром скажешь себе спасибо.",
    "🛡 Режим титана. Пока остальные уходят в алко-аут на выходные, ты сохраняешь фокус, тестостерон и прогресс.",
    "💣 Самый кайф трезвых выходных — проснуться утром без сушняка, головной боли и стыда. Не меняй это состояние на пару часов мутного угара."
];

// Промпты для генерации новой ИИ-картинки каждый день
const IMAGE_PROMPTS = [
    "gigachad muscular man training in dark hardcore gym, heavy barbell, cinematic lighting, 8k, discipline",
    "stoic spartan warrior standing in rain looking at sunrise over mountains, epic dark lighting, 8k",
    "cyberpunk samurai walking away from neon bar in rain, discipline and focus, masterpiece, 8k",
    "heavy iron dumbbells on gym floor with chalk dust in air, dramatic spotlight, brutal gym aesthetic",
    "fighter in boxing ring wrapping hands, intense gaze, dark background, sweat and grit, 8k",
    "lone wolf standing on snowy mountain peak under night sky, powerful epic wallpaper, 8k"
];

// Запасные атмосферные фото (зал, дисциплина, горы), если генератор долго думает
const FALLBACK_PHOTOS = [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080&q=80",
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1080&q=80",
    "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1080&q=80",
    "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1080&q=80",
    "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1080&q=80"
];

function getStatsAndCaption() {
    const start = new Date(CHALLENGE_START);
    const now = new Date();
    const days = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1);

    const moneySaved = (days * 350).toLocaleString('ru-RU');
    const caloriesSaved = (days * 250).toLocaleString('ru-RU');

    let badge = "👊 СТАРТ РЕЖИМА";
    if (days >= 90) badge = "🦾 ТИТАН (90+ ДНЕЙ)";
    else if (days >= 60) badge = "🔥 КРЕМЕНЬ (60+ ДНЕЙ)";
    else if (days >= 30) badge = "⚔️ СПАРТАНЕЦ (1+ МЕСЯЦ)";
    else if (days >= 14) badge = "🚀 НА ХОДУ (2+ НЕДЕЛИ)";
    else if (days >= 7) badge = "⚡️ НЕДЕЛЯ В КОПИЛКЕ";

    const dayOfWeek = now.getDay();
    const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6);
    const quoteList = isWeekend ? WEEKEND_QUOTES : DAILY_QUOTES;
    const quote = quoteList[days % quoteList.length];

    const caption = [
        `🔥 *ДЕНЬ ${days} БЕЗ АЛКОГОЛЯ* 🔥`,
        `Статус: *${badge}*`,
        ``,
        `💬 _«${quote}»_`,
        ``,
        `📊 *Твой профит за это время:*`,
        `💰 Не пропито бабок: ~*${moneySaved} ₽*`,
        `🏋️‍♂️ Минус пустых калорий: ~*${caloriesSaved} ккал*`,
        ``,
        `Ни шагу назад. Держим строй! ✊`
    ].join('\n');

    return { days, caption };
}

async function fetchImageBuffer(days) {
    const prompt = encodeURIComponent(IMAGE_PROMPTS[days % IMAGE_PROMPTS.length]);
    const aiUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&seed=${days * 777}`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(aiUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch (e) {
        console.log('ИИ-генератор занят, беру фото из запаса...');
    }

    const fallbackUrl = FALLBACK_PHOTOS[days % FALLBACK_PHOTOS.length];
    const res = await fetch(fallbackUrl);
    return Buffer.from(await res.arrayBuffer());
}

async function run() {
    const { days, caption } = getStatsAndCaption();
    console.log(`Генерирую мотивацию на день ${days}...`);

    try {
        const imgBuffer = await fetchImageBuffer(days);
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('caption', caption);
        formData.append('parse_mode', 'Markdown');
        formData.append('photo', new Blob([imgBuffer], { type: 'image/jpeg' }), 'motivation.jpg');

        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (!data.ok) throw new Error(JSON.stringify(data));
        console.log('✅ Успешно отправлено с фото!');
    } catch (err) {
        console.error('Ошибка отправки фото, шлю текстом:', err.message);
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: caption, parse_mode: 'Markdown' })
        });
    }
}

run();
