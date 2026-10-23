// generate-photos.js — запусти один раз: node generate-photos.js
const fs = require('fs');
const path = require('path');

const photosDir = path.join(__dirname, 'photos');
if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir);
}

// Промпты для генерации мощных мотивационных артов
const PROMPTS = [
    "gigachad muscular man training in dark hardcore gym, heavy barbell, cinematic lighting, hyperrealistic, 8k, discipline aesthetic",
    "stoic spartan warrior standing in rain looking at sunrise over mountains, epic dark atmospheric lighting, masterpiece",
    "cyberpunk samurai meditating in neon city rain,pouring out bottle of alcohol on the ground, glowing katana, 8k resolution",
    "muscular athlete running at 5am in foggy city street, hood up, intense focus, dark moodyナイキ style commercial photography",
    "two paths concept art: dark toxic neon bar on left vs bright epic mountain peak and gym on right, dramatic contrast, 8k",
    "close up of heavy iron dumbbells on gym floor with chalk dust in air, dramatic spotlight, brutal motivation aesthetic",
    "man in suit looking out of high-rise penthouse window at night city, holding cup of black coffee, success and clarity vibe",
    "ancient greek statue of hercules in dark neon lighting, synthwave aesthetic, strength and self-control, 8k",
    "fighter in boxing ring wrapping hands, intense gaze, dark background, sweat and grit, cinematic sports photography",
    "lone wolf standing on snowy cliff under aurora borealis, powerful epic wallpaper, photorealistic, 8k"
];

async function generateAndSavePhotos() {
    console.log("🚀 Начинаю генерацию и скачивание мотивационных фоток в папку ./photos...");

    for (let i = 0; i < PROMPTS.length; i++) {
        const seed = Math.floor(Math.random() * 100000);
        const prompt = encodeURIComponent(PROMPTS[i]);
        const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&seed=${seed}`;
        const filePath = path.join(photosDir, `motivation_${i + 1}.jpg`);

        try {
            console.log(`⏳ Генерю фото ${i + 1} из ${PROMPTS.length}...`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const buffer = Buffer.from(await response.arrayBuffer());
            fs.writeFileSync(filePath, buffer);
            console.log(`✅ Сохранено: photos/motivation_${i + 1}.jpg`);
        } catch (err) {
            console.error(`❌ Ошибка на фото ${i + 1}:`, err.message);
        }
    }

    console.log("🔥 Готово! Все фотки лежат в папке photos. Не забудь закоммитить их в GitHub!");
}

generateAndSavePhotos();
