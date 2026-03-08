const { exec, spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');
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
const PORT = 3456;
const IS_PKG = typeof process.pkg !== 'undefined';

// Correct Binary path handling for pkg
function getBinaryPath(fileName, bundledSource) {
    if (!IS_PKG) return fileName; // Use global if not in pkg

    const localPath = path.join(path.dirname(process.execPath), fileName);
    if (!fs.existsSync(localPath)) {
        try {
            if (fs.existsSync(bundledSource)) {
                fs.copyFileSync(bundledSource, localPath);
                console.log(`✅ ${fileName} extracted to local folder.`);
            }
        } catch (e) {
            console.error(`❌ Failed to extract ${fileName}:`, e.message);
        }
    }
    return localPath;
}

const currentFFmpegPath = getBinaryPath('ffmpeg.exe', ffmpegStatic);
const currentFFprobePath = getBinaryPath('ffprobe.exe', ffprobePath);
// yt-dlp.exe is bundled in __dirname/yt-dlp.exe via pkg assets
const getYtDlpPath = () => getBinaryPath('yt-dlp.exe', path.join(__dirname, 'yt-dlp.exe'));

async function startGUIServer() {
    const server = http.createServer((req, res) => {
        let url = req.url === '/' ? '/index.html' : req.url;
        // Strip query params for static file serving
        url = url.split('?')[0];

        const filePath = path.join(__dirname, 'public', url);

        if (req.method === 'POST' && req.url === '/download') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    const { url: videoUrl, format } = JSON.parse(body);
                    handleDownload(videoUrl, format || 'mp3', res);
                } catch (e) {
                    res.writeHead(400);
                    res.end('Invalid JSON');
                }
            });
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not Found');
                return;
            }
            const ext = path.extname(filePath);
            const contentType = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'text/javascript',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.svg': 'image/svg+xml'
            }[ext] || 'text/plain';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });

    server.listen(PORT, () => {
        const localUrl = `http://localhost:${PORT}`;
        console.log(`\n🚀 GUI Server running at: ${localUrl}`);
        console.log('Press Ctrl+C to stop the application.');

        const start = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open');
        exec(`${start} ${localUrl}`);
    });
}

function handleDownload(url, format, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const send = (data) => res.write(JSON.stringify(data) + '\n');

    send({ type: 'log', message: `İşlem başlatılıyor... (${format.toUpperCase()})` });

    const outputDir = IS_PKG ? path.dirname(process.execPath) : process.cwd();
    const outputTemplate = path.join(outputDir, '%(title)s.%(ext)s');

    // Base arguments
    const binDir = IS_PKG ? path.dirname(process.execPath) : process.cwd();

    const args = [
        '--rm-cache-dir',
        '--newline',
        '-o', outputTemplate,
        '--ffmpeg-location', binDir
    ];

    // Audio extraction settings
    args.push('-x');
    args.push('--audio-format', format);
    args.push('--audio-quality', '0');

    send({ type: 'log', message: 'Veriler alınıyor...' });

    const ytDlpPath = getYtDlpPath();
    const child = spawn(ytDlpPath, args.concat(url));

    child.stdout.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/\[download\]\s+(\d+\.\d+)%/);
        if (match) {
            send({ type: 'progress', percent: parseFloat(match[1]) });
        } else {
            // Filter some noise
            const cleanMsg = output.trim();
            if (cleanMsg && !cleanMsg.includes('has already been downloaded')) {
                send({ type: 'log', message: cleanMsg });
            }
        }
    });

    child.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg && !msg.includes('WARNING')) {
            send({ type: 'log', message: `Bilgi: ${msg}` });
        }
    });

    child.on('close', (code) => {
        if (code === 0) {
            send({ type: 'success' });
        } else {
            send({ type: 'error', message: `Hata oluştu (Kod: ${code}).` });
        }
        res.end();
    });
}

async function runCLI(url, format = 'mp3') {
    const outputDir = IS_PKG ? path.dirname(process.execPath) : process.cwd();
    const outputTemplate = path.join(outputDir, '%(title)s.%(ext)s');
    const ytDlpPath = getYtDlpPath();
    const command = `"${ytDlpPath}" --rm-cache-dir -x --audio-format ${format} --audio-quality 0 -o "${outputTemplate}" --ffmpeg-location "${currentFFmpegPath}" "${url}"`;

    const child = exec(command);
    child.stdout.on('data', data => process.stdout.write(data));
    child.stderr.on('data', data => process.stderr.write(data));
    child.on('close', (code) => {
        if (code === 0) {
            console.log('\nBaşarılı! Dosya indirildi.');
        } else {
            console.error(`\nHata oluştu. Kod: ${code}`);
        }
        process.exit(code);
    });
}

// Entry point logic
const urlArg = process.argv[2];
const formatArg = process.argv[3] || 'mp3';

if (urlArg) {
    runCLI(urlArg, formatArg);
} else {
    startGUIServer();
}
