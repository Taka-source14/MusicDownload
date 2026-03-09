const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const ffmpegStatic = require('ffmpeg-static');

// ffprobe-static usually exports the path directly
let ffprobePath;
try {
    ffprobePath = require('ffprobe-static').path;
} catch (e) {
    // Fallback for pkg
    ffprobePath = path.join(__dirname, 'node_modules', 'ffprobe-static', 'bin', 'win32', 'x64', 'ffprobe.exe');
}

// Configuration
const IS_PKG = typeof process.pkg !== 'undefined';
const COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    red: "\x1b[31m"
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function printHeader() {
    process.stdout.write('\x1Bc'); // Clear console
    console.log(`${COLORS.cyan}${COLORS.bright}`);
    console.log(`  █████╗ ██╗     ████████╗ █████╗ ██╗`);
    console.log(` ██╔══██╗██║     ╚══██╔══╝██╔══██╗██║`);
    console.log(` ███████║██║        ██║   ███████║██║`);
    console.log(` ██╔══██║██║        ██║   ██╔══██║██║`);
    console.log(` ██║  ██║███████╗   ██║   ██║  ██║██║`);
    console.log(` ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝`);
    console.log(`\n    --- ALTAI MUSIC DOWNLOADER ---`);
    console.log(`      Premium & Standalone Edition`);
    console.log(`${COLORS.reset}`);
}

// Correct Binary path handling for pkg
function getBinaryPath(fileName, bundledSource) {
    const binFolder = 'yardimci-araclar';
    // Ensure we are getting the directory of the executable
    const appDir = IS_PKG ? path.dirname(process.execPath) : process.cwd();
    const targetDir = path.join(appDir, binFolder);

    // Create folder if it doesn't exist
    if (!fs.existsSync(targetDir)) {
        try {
            fs.mkdirSync(targetDir, { recursive: true });
        } catch (e) {
            console.error(`${COLORS.red}❌ Klasör oluşturulamadı: ${targetDir}${COLORS.reset}`);
        }
    }

    const localPath = path.join(targetDir, fileName);
    if (!fs.existsSync(localPath)) {
        try {
            if (fs.existsSync(bundledSource)) {
                fs.copyFileSync(bundledSource, localPath);
                console.log(`${COLORS.green}✅ ${fileName} dosyası '${binFolder}' klasörüne hazırlandı.${COLORS.reset}`);
            }
        } catch (e) {
            console.error(`${COLORS.red}❌ ${fileName} ayıklanırken hata: ${e.message}${COLORS.reset}`);
        }
    }
    return localPath;
}

console.log(`${COLORS.yellow}⚙️ Sistem dosyaları kontrol ediliyor, lütfen bekleyin...${COLORS.reset}`);
const currentFFmpegPath = getBinaryPath('ffmpeg.exe', ffmpegStatic);
const currentFFprobePath = getBinaryPath('ffprobe.exe', ffprobePath);
const getYtDlpPath = () => getBinaryPath('yt-dlp.exe', path.join(__dirname, 'yt-dlp.exe'));

async function mainMenu() {
    printHeader();
    console.log(`${COLORS.bright}Lütfen bir işlem seçin:${COLORS.reset}`);
    console.log(`${COLORS.green}1)${COLORS.reset} Müzik İndir`);
    console.log(`${COLORS.yellow}2)${COLORS.reset} Sistem Dosyalarını Temizle (Uninstall)`);
    console.log(`${COLORS.red}3)${COLORS.reset} Çıkış\n`);

    rl.question(`${COLORS.cyan}Seçiminiz (1-3): ${COLORS.reset}`, async (answer) => {
        if (answer === '1') {
            await startDownloadFlow();
        } else if (answer === '2') {
            await handleUninstall();
        } else if (answer === '3') {
            console.log(`\n${COLORS.magenta}Güle güle! Altai Squad iyi günler diler.${COLORS.reset}`);
            process.exit(0);
        } else {
            console.log(`${COLORS.red}Geçersiz seçim. Tekrar deneyin.${COLORS.reset}`);
            setTimeout(mainMenu, 1000);
        }
    });
}

async function startDownloadFlow() {
    printHeader();
    console.log(`${COLORS.bright}--- Müzik İndirme Paneli ---${COLORS.reset}\n`);

    rl.question(`${COLORS.blue}YouTube URL: ${COLORS.reset}`, (url) => {
        if (!url || !url.includes('http')) {
            console.log(`${COLORS.red}\nHata: Geçerli bir YouTube linki girin!${COLORS.reset}`);
            return setTimeout(startDownloadFlow, 2000);
        }

        console.log(`\n${COLORS.bright}Format Seçin:${COLORS.reset}`);
        console.log(`1) MP3 (Standart)`);
        console.log(`2) WAV (Kayıpsız)`);
        console.log(`3) FLAC (Yüksek Kalite)`);
        console.log(`4) M4A (Apple)`);

        rl.question(`\n${COLORS.cyan}Seçiminiz (1-4): ${COLORS.reset}`, (formatChoice) => {
            const formats = { '1': 'mp3', '2': 'wav', '3': 'flac', '4': 'm4a' };
            const format = formats[formatChoice] || 'mp3';

            downloadMusic(url, format);
        });
    });
}

function downloadMusic(url, format) {
    console.log(`\n${COLORS.yellow}İşlem başlatılıyor, lütfen bekleyin...${COLORS.reset}\n`);

    const appDir = IS_PKG ? path.dirname(process.execPath) : process.cwd();
    const outputTemplate = path.join(appDir, '%(title)s.%(ext)s');
    const binDir = path.join(appDir, 'yardimci-araclar');

    const args = [
        '--rm-cache-dir',
        '--newline',
        '-o', outputTemplate,
        '--ffmpeg-location', binDir,
        '-x', '--audio-format', format, '--audio-quality', '0'
    ];

    const child = spawn(getYtDlpPath(), args.concat(url));

    child.stdout.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/\[download\]\s+(\d+\.\d+)%/);
        if (match) {
            const percent = match[1];
            process.stdout.write(`\r${COLORS.cyan}🚀 İndiriliyor: ${COLORS.bright}${percent}%${COLORS.reset}      `);
        }
    });

    child.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg.includes('ERROR:')) {
            console.log(`\n${COLORS.red}Hata: ${msg}${COLORS.reset}`);
        }
    });

    child.on('close', (code) => {
        if (code === 0) {
            console.log(`\n\n${COLORS.green}✅ BAŞARILI: Müzik klasörünüze kaydedildi!${COLORS.reset}`);
        } else {
            console.log(`\n\n${COLORS.red}❌ HATA: İndirme başarısız oldu (Kod: ${code})${COLORS.reset}`);
        }

        console.log(`\n${COLORS.blue}Ana menüye dönülüyor... (3sn)${COLORS.reset}`);
        setTimeout(mainMenu, 3000);
    });
}

function handleUninstall() {
    printHeader();
    console.log(`${COLORS.red}${COLORS.bright}!!! DİKKAT !!!${COLORS.reset}`);
    console.log(`Bu işlem 'yardimci-araclar' klasörünü ve varsa kırıntı dosyaları SİLECEKTİR.`);

    rl.question(`\n${COLORS.yellow}Devam etmek istiyor musunuz? (e/h): ${COLORS.reset}`, (answer) => {
        if (answer.toLowerCase() === 'e') {
            const appDir = IS_PKG ? path.dirname(process.execPath) : process.cwd();
            const binFolder = path.join(appDir, 'yardimci-araclar');

            try {
                // Delete yardimci-araclar
                if (fs.existsSync(binFolder)) {
                    fs.rmSync(binFolder, { recursive: true, force: true });
                }

                // CRITICAL: Clean up root binaries if they exist (Legacy cleanup)
                ['ffmpeg.exe', 'ffprobe.exe', 'yt-dlp.exe'].forEach(bin => {
                    const rootBin = path.join(appDir, bin);
                    if (fs.existsSync(rootBin)) {
                        fs.unlinkSync(rootBin);
                    }
                });

                // Delete media files
                const files = fs.readdirSync(appDir);
                files.forEach(file => {
                    if (['.mp3', '.wav', '.flac', '.m4a', '.webm'].includes(path.extname(file).toLowerCase())) {
                        fs.unlinkSync(path.join(appDir, file));
                    }
                });

                console.log(`\n${COLORS.green}✅ Temizlik tamamlandı! 5 saniye içinde kapanıyor...${COLORS.reset}`);
                setTimeout(() => process.exit(0), 5000);
            } catch (e) {
                console.log(`${COLORS.red}Temizlik sırasında hata: ${e.message}${COLORS.reset}`);
                setTimeout(mainMenu, 3000);
            }
        } else {
            mainMenu();
        }
    });
}

// Start the app
mainMenu();
