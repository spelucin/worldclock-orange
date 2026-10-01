#!/usr/bin/env node
/**
 * Render Chrome Web Store listing images for WorkClock Orange.
 *
 * How this works:
 *  1. Serve the extension's own pages over HTTP. ES modules do not load from
 *     file:// URLs, so the real popup/options pages must be served, not copied.
 *  2. Inject a `chrome.*` shim ahead of the real module script, so the genuine
 *     UI code runs unmodified against seeded data.
 *  3. Drive headless Chrome over the DevTools Protocol, wait for the app to
 *     signal that it has rendered, and capture at 2x device scale.
 *  4. Composite each capture onto a 1280x800 branded canvas with PIL.
 *
 * The compositing step lives in Python because PIL is already available here.
 *
 * Usage: node scripts/render-screenshots.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const OUT = path.join(ROOT, "store", "screenshots");
const PROMO = path.join(ROOT, "store", "promo");
const WORK = path.join(ROOT, ".shots");
// The docs homepage wants the raw UI, not the store's marketing tile: the tile
// has its own headline baked in, which would duplicate the page copy.
const DOCS_OUT = path.join(ROOT, "docs", "assets");

const CHROME =
  "/home/spelucin/.cache/puppeteer/chrome/linux-150.0.7871.24/chrome-linux64/chrome";
const PORT = 8731;
const DEBUG_PORT = 9412;
const BASE = `http://127.0.0.1:${PORT}`;

const CANVAS_W = 1280;
const CANVAS_H = 800;

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

const SEED_LOCATIONS = [
  { id: "loc-berlin", label: "Berlin", timezone: "Europe/Berlin", country: "DE", isPrimary: true, workStart: "09:00", workEnd: "18:00", weekdaysOnly: true },
  { id: "loc-newyork", label: "New York", timezone: "America/New_York", country: "US", workStart: "09:00", workEnd: "18:00", weekdaysOnly: true },
  { id: "loc-tokyo", label: "Tokyo", timezone: "Asia/Tokyo", country: "JP", workStart: "09:00", workEnd: "18:00", weekdaysOnly: true },
  { id: "loc-sanfrancisco", label: "San Francisco", timezone: "America/Los_Angeles", country: "US", workStart: "09:00", workEnd: "18:00", weekdaysOnly: true },
  { id: "loc-bengaluru", label: "Bengaluru", timezone: "Asia/Kolkata", country: "IN", workStart: "09:00", workEnd: "18:00", weekdaysOnly: true },
];

/* ------------------------------------------------------------------ */
/* View definitions                                                    */
/* ------------------------------------------------------------------ */

const VIEWS = [
  {
    slug: "01-compare-cities",
    page: "popup",
    theme: { mode: "light", accent: "orange" },
    copy: {
      kicker: "One click from your toolbar",
      heading: "Every timezone\nat a glance",
      body: "Pick a city and read the time difference straight away. A green or red dot tells you whether it is inside working hours there.",
      footer: "No account · Works offline",
    },
  },
  {
    slug: "02-24h-overlap",
    page: "popup",
    theme: { mode: "light", accent: "orange" },
    expandCard: 1,
    copy: {
      kicker: "Full 24-hour timeline",
      heading: "Find the overlap\nbefore you call",
      body: "Expand any city to see its whole day against yours, with working hours shaded so the window that suits both is obvious.",
      footer: "Tap a city to expand its day",
    },
  },
  {
    slug: "03-search-cities",
    page: "popup",
    theme: { mode: "light", accent: "orange" },
    search: "san",
    copy: {
      kicker: "Search as you type",
      heading: "Add any city\nin a few keystrokes",
      body: "Type part of a city or country name and choose from the results. Each location you save keeps its own working hours.",
      footer: "City and timezone data built in",
    },
  },
  {
    slug: "04-options",
    page: "options",
    theme: { mode: "light", accent: "orange" },
    // Crop to the Theme, Language and Working hours cards: together they
    // represent the settings page without shrinking it to an unreadable strip.
    cropCards: 3,
    copy: {
      kicker: "Settings",
      heading: "Tune it to the\nway you work",
      body: "Follow the system theme or force light or dark, choose from eleven accent colours, switch between three languages, and set your working hours.",
      footer: "Applies to the popup instantly",
    },
  },
  {
    slug: "05-dark-mode",
    page: "popup",
    theme: { mode: "dark", accent: "violet" },
    copy: {
      kicker: "Dark mode and accents",
      heading: "Easy on the eyes,\nyour way",
      body: "WorkClock Orange follows your system theme and lets you pick the accent colour that suits you, so it fits the rest of your browser.",
      footer: "11 accent colours · 3 languages",
    },
  },
];

/* ------------------------------------------------------------------ */
/* Injected scripts                                                    */
/* ------------------------------------------------------------------ */

/** Minimal chrome.* surface: only what the extension actually calls. */
function shim(theme) {
  const seed = {
    locations: SEED_LOCATIONS,
    settings: {
      accent: theme.accent,
      mode: theme.mode,
      lang: "en",
      localWorkStart: "09:00",
      localWorkEnd: "18:00",
    },
  };
  return `<script>
(() => {
  let store = ${JSON.stringify(seed)};
  window.__wco = {
    storage: store,
  };
  window.chrome = {
    runtime: {
      id: "workclock-orange-screenshot",
      onStartup: { addListener() {} },
      onInstalled: { addListener() {} },
      openOptionsPage() {},
      getManifest: () => ({ version: "1.0.0" }),
    },
    storage: {
      local: {
        async get(keys) {
          const out = {};
          const list = Array.isArray(keys) ? keys : [keys];
          for (const k of list) if (k in store) out[k] = store[k];
          return out;
        },
        async set(obj) { Object.assign(store, obj); },
        async remove(keys) {
          for (const k of (Array.isArray(keys) ? keys : [keys])) delete store[k];
        },
      },
    },
    alarms: {
      create() {},
      clear() { return Promise.resolve(true); },
      onAlarm: { addListener() {} },
    },
    action: {
      setBadgeText() {},
      setBadgeTextColor() {},
      setBadgeBackgroundColor() {},
      setTitle() {},
    },
  };
})();
</script>`;
}

/**
 * Applied after the app renders: set the theme, open the search panel, expand
 * a card, then flag the document so the capture loop knows it is safe to shoot.
 */
function driver(theme, actions) {
  return `<script>
(() => {
  const theme = ${JSON.stringify(theme)};
  const actions = ${JSON.stringify(actions)};
  const html = document.documentElement;

  function markReady() { html.dataset.wcoReady = "1"; }

  function applyTheme() {
    html.dataset.mode = theme.mode;
    html.dataset.accent = theme.accent;
    html.lang = "en";
  }

  function applyActions() {
    if (actions.search != null) {
      const wrap = document.querySelector("#searchWrap");
      const addBtn = document.querySelector("#addBtn");
      if (wrap && wrap.hidden && addBtn) addBtn.click();
      const input = document.querySelector(".search-input");
      if (input) {
        input.value = actions.search;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    if (actions.expandCard != null) {
      const card = document.querySelectorAll(".loc-card")[actions.expandCard];
      if (card && !card.classList.contains("open")) card.click();
    }
  }

  function popupHasRendered() {
    const cards = document.querySelectorAll(".loc-card");
    const empty = document.querySelector("#emptyState");
    return cards.length > 0 || (empty && !empty.hidden);
  }

  function optionsHasRendered() {
    return document.querySelector("#swatches") &&
      document.querySelector("#swatches").children.length > 0;
  }

  applyTheme();

  let frames = 0;
  (function waitForRender() {
    const ready = actions.page === "popup" ? popupHasRendered() : optionsHasRendered();
    if (!ready && frames++ < 300) {
      requestAnimationFrame(waitForRender);
      return;
    }
    applyActions();
    // One more frame so the search results and expanded strip are laid out.
    requestAnimationFrame(() => requestAnimationFrame(markReady));
  })();
})();
</script>`;
}

/* ------------------------------------------------------------------ */
/* Static server                                                       */
/* ------------------------------------------------------------------ */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function serve() {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, BASE).pathname);
    const rel = pathname.replace(/^\/+/, "");

    // The extension pages must be served from their real paths: popup.js uses
    // relative imports such as ../lib/store.js, so serving it from any other
    // directory makes every module resolve to a 404.
    const PAGE_ROUTES = {
      "/popup/popup.html": { file: "popup/popup.html", page: "popup" },
      "/options/options.html": { file: "options/options.html", page: "options" },
    };

    if (PAGE_ROUTES[pathname]) {
      const { file, page } = PAGE_ROUTES[pathname];
      // ?v=<slug> selects which seeded view state to apply.
      const slug = new URL(req.url, BASE).searchParams.get("v");
      const view =
        VIEWS.find((v) => v.slug === slug) ||
        VIEWS.find((v) => v.page === page);

      const html = fs
        .readFileSync(path.join(ROOT, file), "utf8")
        .replace("</head>", `  ${shim(view.theme)}\n</head>`)
        .replace(
          "</body>",
          `  ${driver(view.theme, {
            page: view.page,
            search: view.search ?? null,
            expandCard: view.expandCard ?? null,
          })}\n</body>`
        );
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      return res.end(html);
    }

    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);
      return res.end("not found");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "text/plain" });
    res.end(fs.readFileSync(file));
  });

  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

/* ------------------------------------------------------------------ */
/* CDP client                                                          */
/* ------------------------------------------------------------------ */

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 0;
    this.pending = new Map();
    ws.addEventListener("message", (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      const entry = this.pending.get(msg.id);
      if (!entry) return;
      this.pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(`${entry.method}: ${msg.error.message}`));
      else entry.resolve(msg.result || {});
    });
  }

  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", () => reject(new Error("CDP websocket failed")), { once: true });
    });
    return new CDP(ws);
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      this.pending.set(id, { resolve, reject, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function launchChrome() {
  const profile = fs.mkdtempSync(path.join(WORK, "profile-"));
  const child = spawn(
    CHROME,
    [
      "--headless=new",
      // Required in this sandbox: the default zygote hangs on start, so the
      // renderer never comes up.
      "--no-zygote",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-gcm",
      "--disable-sync",
      "--disable-translate",
      "--disable-notifications",
      "--disable-breakpad",
      "--hide-scrollbars",
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profile}`,
      "--window-size=1280,900",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (res.ok) break;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }

  return {
    child,
    profile,
    async close() {
      child.kill("SIGKILL");
      await sleep(150);
      fs.rmSync(profile, { recursive: true, force: true });
    },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openPage() {
  const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
  const targets = await res.json();
  const page = targets.find((t) => t.type === "page" && t.url === "about:blank") ||
    targets.find((t) => t.type === "page");
  if (!page) throw new Error("no page target available");
  return CDP.connect(page.webSocketDebuggerUrl);
}

/* ------------------------------------------------------------------ */
/* Capture                                                             */
/* ------------------------------------------------------------------ */

async function captureView(cdp, view, outFile) {
  const isPopup = view.page === "popup";
  const cssWidth = isPopup ? 400 : 1240;
  const cssHeight = isPopup ? 620 : 900;
  const scale = 2;

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: cssWidth,
    height: cssHeight,
    deviceScaleFactor: scale,
    mobile: false,
  });
  await cdp.send("Page.enable");

  const url = `${BASE}/${isPopup ? "popup/popup.html" : "options/options.html"}?v=${view.slug}`;
  await cdp.send("Page.navigate", { url });

  // Wait for the app to flag that it has rendered and applied view state.
  const deadline = Date.now() + 20000;
  let ready = false;
  while (Date.now() < deadline) {
    try {
      const r = await cdp.send("Runtime.evaluate", {
        expression: "document.documentElement.dataset.wcoReady === '1'",
        returnByValue: true,
      });
      if (r.result && r.result.value === true) {
        ready = true;
        break;
      }
    } catch {
      /* navigation in flight */
    }
    await sleep(120);
  }
  if (!ready) throw new Error(`view ${view.slug} never signalled ready`);

  // Settle layout, then shoot.
  await sleep(250);

  // Fit the viewport to the real content height, otherwise long pages such as
  // options get silently cropped at the bottom.
  const measured = await cdp.send("Runtime.evaluate", {
    expression:
      "Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)",
    returnByValue: true,
  });
  const contentHeight = Math.min(
    3000,
    Math.max(320, Math.ceil(measured.result.value || cssHeight))
  );
  if (contentHeight !== cssHeight) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: cssWidth,
      height: contentHeight,
      deviceScaleFactor: scale,
      mobile: false,
    });
    await sleep(350);
  }

  // Guard: confirm the real app actually rendered seeded content, so a broken
  // route or shim fails the run instead of silently producing a blank panel.
  const probe = await cdp.send("Runtime.evaluate", {
    expression: `JSON.stringify({
      cards: document.querySelectorAll('.loc-card').length,
      open: document.querySelectorAll('.loc-card.open').length,
      results: document.querySelectorAll('.search-result').length,
      swatches: document.querySelector('#swatches') ? document.querySelector('#swatches').children.length : -1,
      text: document.body.innerText.replace(/\\s+/g, ' ').trim().slice(0, 150),
      mode: document.documentElement.dataset.mode,
    })`,
    returnByValue: true,
  });
  const dom = JSON.parse(probe.result.value);
  if (dom.cards < 5 && view.page === "popup") {
    throw new Error(`view ${view.slug} rendered only ${dom.cards} location cards`);
  }
  if (view.page === "options" && dom.swatches < 1) {
    throw new Error(`view ${view.slug} rendered no accent swatches`);
  }

  const shot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    fromSurface: true,
  });

  fs.writeFileSync(outFile, Buffer.from(shot.data, "base64"));

  // Optionally crop to the top N cards, measured from real element bounds.
  if (view.cropCards) {
    const box = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const cards = [...document.querySelectorAll('.card')].slice(0, ${view.cropCards});
        if (!cards.length) return null;
        const bottom = Math.max(...cards.map((c) => c.getBoundingClientRect().bottom + window.scrollY));
        return JSON.stringify({ height: Math.ceil(bottom + 40) });
      })()`,
      returnByValue: true,
    });
    const cropH = JSON.parse(box.result.value).height;
    const cropped = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      clip: {
        x: 0,
        y: 0,
        width: cssWidth,
        height: cropH,
        // The 2x device scale factor already applies; multiplying again here
        // would render at 4x.
        scale: 1,
      },
    });
    fs.writeFileSync(outFile, Buffer.from(cropped.data, "base64"));
    return { width: cssWidth * scale, height: cropH * scale, dom };
  }

  return { width: cssWidth * scale, height: contentHeight * scale, dom };
}

/* ------------------------------------------------------------------ */
/* Compose (Python + PIL)                                              */
/* ------------------------------------------------------------------ */

const COMPOSE_PY = `
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, sys

raw_path, out_path, theme_mode, accent, kicker, heading, body, footer = sys.argv[1:9]

W, H = 1280, 800
PAD = 72
COL_W = 424

DARK = theme_mode == 'dark'

ACCENTS = {
    'orange': (249, 115, 22),
    'violet': (139, 92, 246),
    'blue': (59, 130, 246),
    'teal': (20, 184, 166),
}
A = ACCENTS[accent]

INK = (248, 250, 252)
MUTED = (156, 172, 194)


def bg_color(light, dark):
    return dark if DARK else light


def canvas():
    top = bg_color((11, 16, 32), (8, 10, 20))
    bot = bg_color((20, 26, 48), (15, 18, 33))
    im = Image.new('RGB', (W, H), top)
    d = ImageDraw.Draw(im)
    for y in range(H):
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=tuple(
            int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    return im


def add_glow(im, cx, cy, radius, strength=0.5):
    """Screen-ish accent glow centred on the product panel."""
    glow = Image.new('RGB', im.size, (0, 0, 0))
    ImageDraw.Draw(glow).ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius],
        fill=tuple(int(c * strength) for c in A))
    glow = glow.filter(ImageFilter.GaussianBlur(radius * 0.55))
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius * 0.6))
    return Image.composite(Image.blend(im, glow, 0.85), im, mask)


def font(size, bold=False):
    name = 'DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf'
    path = '/usr/share/fonts/truetype/dejavu/' + name
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def wrap(draw, text, fnt, width):
    lines, cur = [], ''
    for word in text.split():
        trial = (cur + ' ' + word).strip()
        if draw.textlength(trial, font=fnt) <= width or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


shot = Image.open(raw_path).convert('RGB')

img = canvas()
img = add_glow(img, W - 330, H // 2, 380, 0.42)
d = ImageDraw.Draw(img)

f_kicker = font(19, True)
f_h1 = font(50, True)
f_body = font(21)
f_foot = font(18, True)

# ---- text column ----
y = 104
pill_text = kicker.upper()
pill_w = d.textlength(pill_text, font=f_kicker)
d.rounded_rectangle([PAD, y, PAD + pill_w + 34, y + 40], radius=20, fill=A)
d.text((PAD + 17, y + 10), pill_text, font=f_kicker, fill=(11, 16, 32))

y += 74
for line in heading.split('\\n'):
    d.text((PAD, y), line, font=f_h1, fill=INK)
    y += 60

y += 18
for line in wrap(d, body, f_body, COL_W):
    d.text((PAD, y), line, font=f_body, fill=MUTED)
    y += 32

fy = H - 118
d.ellipse([PAD, fy + 7, PAD + 11, fy + 18], fill=A)
d.text((PAD + 24, fy), footer, font=f_foot, fill=INK)

# ---- product panel ----
# A portrait popup and a landscape settings page need very different shapes, so
# the panel keeps a constant width and only its height follows the capture. The
# capture is centred inside it rather than stretched to fill.
PANEL_W = 660
INNER_MAX_W = PANEL_W - 56
INNER_MAX_H = 660

scale = min(1.0, INNER_MAX_W / shot.width, INNER_MAX_H / shot.height)
shot = shot.resize((max(1, round(shot.width * scale)), max(1, round(shot.height * scale))), Image.LANCZOS)
sw, sh = shot.size

panel_h = sh + 56
px = W - PANEL_W - PAD
py = (H - panel_h) // 2

# In dark mode lift the panel well above the UI's own background, otherwise a
# dark popup becomes an unreadable dark-on-dark rectangle.
panel_fill = bg_color((20, 26, 48), (34, 39, 60))
hairline = bg_color((58, 70, 104), (74, 84, 118))

shadow = Image.new('RGBA', (PANEL_W + 90, panel_h + 90), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle(
    [45, 50, PANEL_W + 45, panel_h + 50], radius=32, fill=(0, 0, 0, 170))
shadow = shadow.filter(ImageFilter.GaussianBlur(30))
img.paste(shadow, (px - 45, py - 45), shadow)

d = ImageDraw.Draw(img)
d.rounded_rectangle([px, py, px + PANEL_W, py + panel_h], radius=24,
                    fill=panel_fill, outline=hairline, width=1)
img.paste(shot, (px + (PANEL_W - sw) // 2, py + 28))

# wordmark along the bottom edge of the panel
d = ImageDraw.Draw(img)
icon = Image.open('icons/icon48.png').convert('RGBA').resize((30, 30), Image.LANCZOS)
mark = 'WorkClock Orange'
mark_font = font(15, True)
mark_w = d.textlength(mark, font=mark_font)
bar_y = py + panel_h - 28 - 15
img.paste(icon, (int(px + (PANEL_W - (mark_w + 40)) // 2), int(bar_y)), icon)
d.text((int(px + (PANEL_W - mark_w) // 2 + 10), int(bar_y)), mark,
       font=mark_font, fill=MUTED)

img.save(out_path, 'PNG', optimize=True)
print(os.path.getsize(out_path))
`;

function runPython(script, args) {
  const tmp = path.join(WORK, `${Math.abs(hash(script))}.py`);
  fs.writeFileSync(tmp, script);
  const r = spawnSync("python3", [tmp, ...args], { encoding: "utf8", cwd: ROOT });
  if (r.status !== 0) throw new Error(`python failed: ${r.stderr}`);
  return r.stdout.trim();
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function compose(view, rawPng) {
  const out = path.join(OUT, `${view.slug}.png`);
  const bytes = runPython(COMPOSE_PY, [
    rawPng,
    out,
    view.theme.mode,
    view.theme.accent,
    view.copy.kicker,
    view.copy.heading,
    view.copy.body,
    view.copy.footer,
  ]);
  return { out, bytes: Number(bytes) };
}

/* ------------------------------------------------------------------ */
/* Promo tiles                                                         */
/* ------------------------------------------------------------------ */

const PROMO_PY = `
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, sys

mode, accent, small_path, marquee_path = sys.argv[1:5]

ACCENTS = {
    'orange': (249, 115, 22),
    'violet': (139, 92, 246),
    'blue': (59, 130, 246),
    'teal': (20, 184, 166),
}
A = ACCENTS[accent]
DARK = mode == 'dark'
INK = (248, 250, 252)
MUTED = (156, 172, 194)


def font(size, bold=False):
    name = 'DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf'
    try:
        return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/' + name, size)
    except Exception:
        return ImageFont.load_default()


def gradient(w, h):
    top = (8, 10, 20) if DARK else (11, 16, 32)
    bot = (15, 18, 33) if DARK else (20, 26, 48)
    im = Image.new('RGB', (w, h), top)
    d = ImageDraw.Draw(im)
    for y in range(h):
        t = y / (h - 1)
        d.line([(0, y), (w, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    return im


def glow(im, cx, cy, r, strength=0.5):
    g = Image.new('RGB', im.size, (0, 0, 0))
    ImageDraw.Draw(g).ellipse([cx - r, cy - r, cx + r, cy + r],
                              fill=tuple(int(c * strength) for c in A))
    g = g.filter(ImageFilter.GaussianBlur(r * 0.55))
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(r * 0.6))
    return Image.composite(Image.blend(im, g, 0.85), im, m)


icon = Image.open('icons/icon128.png').convert('RGBA')


def stamp(im, cx, cy, size):
    ic = icon.resize((size, size), Image.LANCZOS)
    im.paste(ic, (int(cx - size / 2), int(cy - size / 2)), ic)


def text(im, x, y, s, fnt, fill):
    ImageDraw.Draw(im).text((x, y), s, font=fnt, fill=fill)


# --- small promo tile: 440x280, brand mark only ---
SW, SH = 440, 280
s = gradient(SW, SH)
s = glow(s, 60, 40, 210, 0.45)
stamp(s, SW / 2, SH / 2 - 30, 112)
f1, f2 = font(23, True), font(14)
w1 = ImageDraw.Draw(s).textlength('WorkClock Orange', font=f1)
text(s, (SW - w1) / 2, SH / 2 + 40, 'WorkClock Orange', f1, INK)
w2 = ImageDraw.Draw(s).textlength('World time, instantly', font=f2)
text(s, (SW - w2) / 2, SH / 2 + 72, 'World time, instantly', f2, MUTED)
s.save(small_path, 'PNG', optimize=True)

# --- marquee promo tile: 1400x560 ---
MW, MH = 1400, 560
m = gradient(MW, MH)
m = glow(m, 180, 120, 380, 0.45)
stamp(m, 128, 176, 104)
f3 = font(38, True)
f4 = font(22)
text(m, 196, 138, 'WorkClock Orange', f3, INK)
text(m, 196, 196, 'Compare your time with any city', f4, MUTED)

rows = [
    ('Time difference', 'the exact offset at a glance'),
    ('Working hours', 'know who is online before you call'),
    ('24-hour overlap', 'find the hour that suits both'),
]
fy, fh = font(22, True), font(19)
for i, (title, sub) in enumerate(rows):
    y = 300 + i * 62
    ImageDraw.Draw(m).rounded_rectangle([128, y, 156, y + 28], radius=8, fill=A)
    text(m, 178, y, title, fy, INK)
    text(m, 470, y + 3, sub, fh, MUTED)

# clock motif on the right
md = ImageDraw.Draw(m)
cx, cy = MW - 300, 280
for i, rr in enumerate([148, 116, 84]):
    alpha = 46 + i * 34
    md.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
               outline=(255, 255, 255, alpha), width=2)
md.line([cx, cy, cx, cy - 66], fill=A, width=7)
md.line([cx, cy, cx + 44, cy + 16], fill=INK, width=7)
md.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=INK)
m.save(marquee_path, 'PNG', optimize=True)

print(os.path.getsize(small_path), os.path.getsize(marquee_path))
`;

function makePromos() {
  const small = path.join(PROMO, "promo-small-440x280.png");
  const marquee = path.join(PROMO, "promo-marquee-1400x560.png");
  const sizes = runPython(PROMO_PY, ["light", "orange", small, marquee]);
  return { small, marquee, sizes };
}

/* ------------------------------------------------------------------ */

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(PROMO, { recursive: true });
  fs.mkdirSync(DOCS_OUT, { recursive: true });
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });

  const server = await serve();
  const chrome = await launchChrome();
  let cdp;

  try {
    cdp = await openPage();
    for (const view of VIEWS) {
      const raw = path.join(WORK, `${view.slug}-raw.png`);
      const size = await captureView(cdp, view, raw);
      const { out, bytes } = compose(view, raw);
      // Publish the un-composited capture for the docs site, where the UI
      // should appear on its own rather than inside a store banner.
      fs.copyFileSync(raw, path.join(DOCS_OUT, `ui-${view.slug.replace(/^\d+-/, "")}.png`));
      console.log(
        `${view.slug.padEnd(22)} raw ${size.width}x${size.height}  cards=${size.dom.cards}` +
          ` open=${size.dom.open} results=${size.dom.results}` +
          ` swatches=${size.dom.swatches} mode=${size.dom.mode}  ->  ` +
          `${path.relative(ROOT, out)}  ${Math.round(bytes / 1024)} KB`
      );
    }
  } finally {
    if (cdp) cdp.close();
    await chrome.close();
    server.close();
  }

  const promos = makePromos();
  console.log(
    `promo-small-440x280.png  ${path.relative(ROOT, promos.small)}  ` +
      `${Math.round(fs.statSync(promos.small).size / 1024)} KB`
  );
  console.log(
    `promo-marquee-1400x560.png  ${path.relative(ROOT, promos.marquee)}  ` +
      `${Math.round(fs.statSync(promos.marquee).size / 1024)} KB`
  );
}

main().catch((e) => {
  console.error("render failed:", e.message);
  process.exit(1);
});