const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
let cloudinary = null;
try { cloudinary = require('cloudinary').v2; } catch {}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(cors());

const rootDir = __dirname;
const dataPath = path.join(rootDir, 'content.json');
const uploadsDir = path.join(rootDir, 'uploads');

const GH_TOKEN = process.env.GITHUB_TOKEN;
const GH_OWNER = process.env.GITHUB_OWNER;
const GH_REPO = process.env.GITHUB_REPO;
const GH_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GH_IMAGE_DIR = process.env.GITHUB_IMAGE_DIR || '';
const GH_CONTENT_PATH = process.env.GITHUB_CONTENT_PATH || 'content.json';
const USE_GITHUB_READ = !!(GH_OWNER && GH_REPO);
const USE_GITHUB_WRITE = !!(GH_TOKEN && GH_OWNER && GH_REPO);
const GH_API_BASE = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents`;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'uploads';
const USE_CLOUDINARY = !!(cloudinary && CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
if (USE_CLOUDINARY) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

function ensureDataFiles() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(dataPath)) {
    const initial = {
      texts: {
        header_line1: '全端工程師',
        header_line2: '遊戲工作室',
        header_line3: '網路安全專家',
        header_desc:
          '專注網站復刻、伺服器配置、滲透測試、記憶體分析與 AI 自動化。以合法與道德為前提，提供專業安全諮詢與技術解決方案。',
        service_1_title: '完美復刻網站架設',
        service_1_desc:
          '精準還原設計稿與互動，包含背景與響應式，提供穩定部署與最佳化。',
        service_2_title: '伺服器連接埠開啟技術',
        service_2_desc:
          '設定防火牆與連接埠轉發，強化安全性與可達性，提供可視化檢核流程。',
        service_3_title: '遊戲記憶體修改',
        service_3_desc:
          '分析結構、定位偏移與寫入策略，實作穩定模組化工具，兼顧安全風險評估。',
        service_4_title: 'AI 腳本設計',
        service_4_desc:
          '以自動化腳本與模型結合流程，支援監控、資料處理與互動控制。',
        works_web_title: '網頁復刻 · 作品展示',
        works_games_title: '小品遊戲',
        image_section_title: '伺服器端及遊戲修改 · 圖片展示',
        footer_copyright: '© 2024 YU_STUDIO.SYS',
      },
      popups: {
        web_instagram: {
          title: 'Instagram 復刻作品',
          content:
            '這是一個完美還原 Instagram UI 的全疊代項目，包含流式佈局與動態交互。',
          link: '',
          autoRedirect: false,
        },
        web_iphone17: {
          title: 'iPhone 17 預約頁面',
          content:
            '模擬原廠直營店的網頁設計，具有極致的轉場特效與高響應式結構。',
          link: '',
          autoRedirect: false,
        },
        web_line_login: {
          title: 'LINE 登入復刻',
          content: '安全性滲透測試專用的前端登入頁面模擬。',
          link: '',
          autoRedirect: false,
        },
        game_russian_roulette: {
          title: 'YU 的俄羅斯輪盤',
          content: '小品遊戲示範項目。',
          link: '',
          autoRedirect: false,
        },
        game_password: {
          title: '終極密碼 · YU 創作',
          content: '小品遊戲示範項目。',
          link: '',
          autoRedirect: false,
        },
        game_barrage: {
          title: '楓之谷風格彈幕躲避',
          content: '小品遊戲示範項目。',
          link: '',
          autoRedirect: false,
        },
        game_drink_roulette: {
          title: '暗黑風輪盤喝酒',
          content: '小品遊戲示範項目。',
          link: '',
          autoRedirect: false,
        },
      },
      images: [
        {
          id: 'sample-1',
          title: 'Game Engine Analysis',
          url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800',
          thumb: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400',
        },
        {
          id: 'sample-2',
          title: 'Memory Modding',
          url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
          thumb: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400',
        },
        {
          id: 'sample-3',
          title: 'Server Infrastructure',
          url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc48?w=800',
          thumb: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc48?w=400',
        },
      ],
    };
    fs.writeFileSync(dataPath, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

ensureDataFiles();

async function githubGetFile(fp) {
  const url = `${GH_API_BASE}/${encodeURI(fp)}`;
  const headers = { Accept: 'application/vnd.github+json' };
  if (GH_TOKEN) headers.Authorization = `Bearer ${GH_TOKEN}`;
  const resp = await axios.get(url, { headers, params: { ref: GH_BRANCH } });
  return resp.data;
}

async function githubPutFile(fp, base64Content, message, sha) {
  const url = `${GH_API_BASE}/${encodeURI(fp)}`;
  const body = { message, content: base64Content, branch: GH_BRANCH };
  if (sha) body.sha = sha;
  const resp = await axios.put(url, body, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
  });
  return resp.data;
}

async function githubDeleteFile(fp, message, sha) {
  const url = `${GH_API_BASE}/${encodeURI(fp)}`;
  const resp = await axios.delete(url, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
    data: { message, sha, branch: GH_BRANCH },
  });
  return resp.data;
}

async function readContent() {
  if (USE_GITHUB_READ) {
    try {
      const file = await githubGetFile(GH_CONTENT_PATH);
      const raw = Buffer.from(file.content, 'base64').toString('utf-8');
      return JSON.parse(raw);
    } catch (e) {
      const initial = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      const base64 = Buffer.from(JSON.stringify(initial, null, 2)).toString('base64');
      if (USE_GITHUB_WRITE) {
        await githubPutFile(GH_CONTENT_PATH, base64, 'init content.json');
      }
      return initial;
    }
  }
  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

async function writeContent(data) {
  if (USE_GITHUB_WRITE) {
    let sha = undefined;
    try {
      const file = await githubGetFile(GH_CONTENT_PATH);
      sha = file.sha;
    } catch {}
    const base64 = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    await githubPutFile(GH_CONTENT_PATH, base64, 'update content.json', sha);
    return;
  }
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, rootDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    const name = `${Date.now()}_${base}${ext}`;
    cb(null, name);
  },
});
const upload = USE_GITHUB_WRITE ? multer({ storage: multer.memoryStorage() }) : multer({ storage: diskStorage });

function isAdmin() { return true; }
function requireAdminApi(req, res, next) { next(); }

function toCdnUrl(remotePath) {
  return `https://cdn.jsdelivr.net/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/${remotePath}`;
}

function sanitizeTitleFromFilename(name) {
  const base = name.replace(/\.[^/.]+$/, '');
  return base.replace(/[._-]+/g, ' ').trim();
}
function titleFromPublicId(pid) {
  const base = pid.split('/').pop();
  return base.replace(/[._-]+/g, ' ').trim();
}

app.use('/uploads', express.static(uploadsDir));
app.use('/', express.static(rootDir));
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'ai_studio_code (4).html'));
});

app.get('/api/admin/check', (req, res) => res.json({ ok: true }));

app.get('/api/content', async (req, res) => {
  const data = await readContent();
  res.json(data);
});

app.put('/api/content/texts', requireAdminApi, async (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const data = await readContent();
  data.texts = { ...data.texts, ...payload };
  await writeContent(data);
  res.json({ ok: true, texts: data.texts });
});

app.put('/api/content/popups', requireAdminApi, async (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const data = await readContent();
  data.popups = { ...data.popups, ...payload };
  await writeContent(data);
  res.json({ ok: true, popups: data.popups });
});

app.post('/api/works/images', requireAdminApi, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file' });
  }
  const title = req.body.title || '';
  if (USE_CLOUDINARY) {
    try {
      const ext = path.extname(req.file.originalname) || '';
      const base = path.basename(req.file.originalname, ext).replace(/\s+/g, '_');
      const name = `${Date.now()}_${base}`;
      cloudinary.uploader.upload_stream({ folder: CLOUDINARY_FOLDER, public_id: name }, async (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Upload to Cloudinary failed' });
        }
        const url = result.secure_url;
        const data = await readContent();
        const id = `${Date.now()}`;
        const t = title || titleFromPublicId(result.public_id);
        data.images.push({ id, title: t, url, thumb: url });
        await writeContent(data);
        return res.json({ ok: true, image: { id, title: t, url } });
      }).end(req.file.buffer);
      return;
    } catch (e) {
      return res.status(500).json({ error: 'Upload to Cloudinary failed' });
    }
  }
  if (USE_GITHUB_WRITE) {
    try {
      const ext = path.extname(req.file.originalname) || '';
      const base = path.basename(req.file.originalname, ext).replace(/\s+/g, '_');
      const name = `${Date.now()}_${base}${ext}`;
      const remotePath = `${GH_IMAGE_DIR}/${name}`;
      const base64 = Buffer.from(req.file.buffer).toString('base64');
      await githubPutFile(remotePath, base64, `upload ${name}`);
      const cdnUrl = `https://cdn.jsdelivr.net/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/${remotePath}`;
      const data = await readContent();
      const id = `${Date.now()}`;
      data.images.push({
        id,
        title,
        url: cdnUrl,
        thumb: cdnUrl,
      });
      await writeContent(data);
      return res.json({ ok: true, image: { id, title, url: cdnUrl } });
    } catch (e) {
      return res.status(500).json({ error: 'Upload to GitHub failed' });
    }
  }
  const urlPath = `/${req.file.filename}`;
  const data = await readContent();
  const id = `${Date.now()}`;
  data.images.push({
    id,
    title,
    url: urlPath,
    thumb: urlPath,
  });
  await writeContent(data);
  res.json({ ok: true, image: { id, title, url: urlPath } });
});

app.delete('/api/works/images/:id', requireAdminApi, async (req, res) => {
  const { id } = req.params;
  const data = await readContent();
  const idx = data.images.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [img] = data.images.splice(idx, 1);
  if (USE_GITHUB_WRITE) {
    try {
      const prefix = `https://cdn.jsdelivr.net/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/`;
      let remotePath = '';
      if (img.url.startsWith(prefix)) {
        remotePath = img.url.slice(prefix.length);
      }
      if (remotePath) {
        const file = await githubGetFile(remotePath);
        await githubDeleteFile(remotePath, `delete ${remotePath}`, file.sha);
      }
    } catch {}
  } else {
    const filePath = path.join(rootDir, img.url.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }
  }
  await writeContent(data);
  res.json({ ok: true });
});

app.get('/api/works/images-list', async (req, res) => {
  try {
    if (USE_CLOUDINARY) {
      try {
        const r = await cloudinary.search.expression(`folder:${CLOUDINARY_FOLDER}`).max_results(500).execute();
        const list = (r.resources || []).map((res) => ({
          id: res.public_id,
          title: titleFromPublicId(res.public_id),
          url: res.secure_url,
          thumb: res.secure_url,
        }));
        return res.json(list);
      } catch (e) {
        return res.json([]);
      }
    } else if (USE_GITHUB_READ) {
      try {
        const url = GH_IMAGE_DIR ? `${GH_API_BASE}/${encodeURI(GH_IMAGE_DIR)}` : GH_API_BASE;
        const headers = { Accept: 'application/vnd.github+json' };
        if (GH_TOKEN) headers.Authorization = `Bearer ${GH_TOKEN}`;
        const resp = await axios.get(url, { headers, params: { ref: GH_BRANCH } });
        const files = Array.isArray(resp.data) ? resp.data : [];
        const list = files
          .filter((f) => f.type === 'file')
          .filter((f) => /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(f.name))
          .map((f) => {
            const title = sanitizeTitleFromFilename(f.name);
            const remotePath = GH_IMAGE_DIR ? `${GH_IMAGE_DIR}/${f.name}` : `${f.name}`;
            const url = toCdnUrl(remotePath);
            return { id: f.sha || f.name, title, url, thumb: url };
          });
        return res.json(list);
      } catch (e) {
        return res.json([]);
      }
    } else {
      const files = fs.readdirSync(rootDir);
      const list = files
        .filter((name) => /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(name))
        .map((name) => {
          const title = sanitizeTitleFromFilename(name);
          const url = `/${name}`;
          return { id: name, title, url, thumb: url };
        });
      return res.json(list);
    }
  } catch {
    res.json([]);
  }
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
