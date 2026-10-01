#!/usr/bin/env node
/**
 * Verify the docs/ GitHub Pages site in a real browser.
 *
 * The privacy policy URL is a hard requirement for the Chrome Web Store
 * listing: the dashboard rejects an unreachable URL. A link check on the HTML
 * proves the paths are correct, but it does not prove the page actually renders,
 * that images decode, or that the layout does not break on a phone. This drives
 * headless Chrome over the DevTools Protocol and checks the real thing.
 *
 * Checks, per page, at desktop and mobile widths:
 *   * the page loads with no console errors and no failed sub-resources
 *   * every <img> decoded (naturalWidth > 0), so no broken screenshot tiles
 *   * no horizontal overflow at either width
 *   * exactly one <h1>, and headings never empty
 *   * same-page anchors point at an element that exists
 *   * required content strings are present
 *
 * Usage: node scripts/verify-docs.mjs
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "docs");
const CHROME =
  process.env.CHROME_PATH ||
  "/home/spelucin/.cache/puppeteer/chrome/linux-150.0.7871.24/chrome-linux64/chrome";
const PORT = 9413;
const DEBUG_PORT = 9414;

const WIDTHS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const PAGES = [
  {
    file: "index.html",
    requires: ["Every timezone", "Features", "Privacy", "Support"],
    // The listing is not published yet, so the primary CTA is deliberately
    // inert. It must not be a dead link that looks like a mistake.
    expectDisabledCta: true,
  },
  {
    file: "privacy.html",
    requires: ["storage", "alarms", "no network requests", "chrome.storage.local"],
  },
  {
    file: "support.html",
    requires: ["alex@spelucin.pro"],
  },
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Serve docs/ over HTTP, the way GitHub Pages will. */
function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
    const file = path.join(DOCS, rel);
    if (!file.startsWith(DOCS) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

/* ---------------- minimal CDP client ---------------- */

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener("message", (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.id) {
        const entry = this.pending.get(msg.id);
        if (!entry) return;
        this.pending.delete(msg.id);
        if (msg.error) entry.reject(new Error(`${entry.method}: ${msg.error.message}`));
        else entry.resolve(msg.result || {});
      } else {
        this.events.push(msg);
      }
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
}

async function launchChrome() {
  const profile = fs.mkdtempSync(path.join("/tmp", "wco-docs-"));
  const child = spawn(
    CHROME,
    [
      "--headless=new",
      "--no-zygote",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`)).ok) break;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }

  return {
    async close() {
      child.kill("SIGKILL");
      await sleep(150);
      fs.rmSync(profile, { recursive: true, force: true });
    },
  };
}

/* ---------------- the probe ---------------- */

/**
 * Runs in the page. Returns layout and resource facts in one round trip.
 */
function probe() {
  const imgs = [...document.images].map((img) => ({
    src: img.getAttribute("src"),
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
  }));

  const anchors = [...document.querySelectorAll('a[href^="#"]')]
    .map((a) => a.getAttribute("href"))
    .filter((h) => h && h.length > 1);

  const deadAnchors = anchors.filter((h) => !document.getElementById(decodeURIComponent(h.slice(1))));

  const headings = [...document.querySelectorAll("h1,h2,h3")].map((h) => ({
    tag: h.tagName,
    text: h.textContent.trim(),
  }));

  const disabledCtas = [...document.querySelectorAll('[aria-disabled="true"]')];

  return {
    title: document.title,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    textLength: document.body.innerText.trim().length,
    imgs,
    deadAnchors,
    headings,
    h1Count: headings.filter((h) => h.tag === "H1").length,
    emptyHeadings: headings.filter((h) => !h.text).length,
    disabledCtaText: disabledCtas.map((a) => a.innerText.trim()).join(" | "),
    disabledCtaCount: disabledCtas.length,
  };
}

/* ---------------- checks ---------------- */

const failures = [];
const notes = [];

function check(ok, message) {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${message}`);
  if (!ok) failures.push(message);
}

/**
 * Wait for the document to finish loading.
 *
 * This polls rather than waiting on Page.loadEventFired: this Chrome build does
 * not emit that event reliably under --no-zygote, and an awaitPromise on image
 * decoding never settles, so both approaches hang instead of failing.
 */
async function waitForReady(cdp, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const r = await cdp.send("Runtime.evaluate", {
        expression: "document.readyState === 'complete'",
        returnByValue: true,
      });
      if (r.result && r.result.value === true) return true;
    } catch {
      /* navigation in flight */
    }
    await sleep(150);
  }
  return false;
}

/**
 * Force lazy images to load, then wait for every one to finish.
 *
 * The screenshot tiles use loading="lazy", so a page that has only ever been
 * viewed at the top will never fetch them. Scrolling alone is not reliable under
 * mobile emulation, where the scrolling element is not always the window, so
 * the images are also switched to eager. Either way the point is to check that
 * those assets are actually present rather than 404ing.
 */
async function loadAllImages(cdp, timeout = 15000) {
  await cdp.send("Runtime.evaluate", {
    expression:
      "document.querySelectorAll('img[loading=\"lazy\"]').forEach(i => { i.loading = 'eager'; })",
  });

  for (let i = 0; i < 12; i++) {
    await cdp.send("Runtime.evaluate", {
      expression: "window.scrollTo(0, document.documentElement.scrollHeight)",
    });
    await sleep(120);
  }
  await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });

  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const r = await cdp.send("Runtime.evaluate", {
      expression: "[...document.images].every(i => i.complete)",
      returnByValue: true,
    });
    if (r.result && r.result.value === true) return true;
    await sleep(150);
  }
  return false;
}

async function verifyPage(cdp, spec, width) {
  const url = `http://127.0.0.1:${PORT}/${spec.file}`;
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Network.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: width.width,
    height: width.height,
    deviceScaleFactor: 1,
    mobile: width.name === "mobile",
  });

  await cdp.send("Page.navigate", { url });
  const ready = await waitForReady(cdp);
  const imagesLoaded = await loadAllImages(cdp);
  // Settle layout before measuring.
  await sleep(200);

  const { result } = await cdp.send("Runtime.evaluate", {
    expression: `(${probe.toString()})()`,
    returnByValue: true,
  });
  const r = result.value;

  console.log(`\n${spec.file} @ ${width.name} (${width.width}px) — "${r.title}"`);

  check(ready, "document and images finished loading");
  check(imagesLoaded, "all images loaded");

  check(r.h1Count === 1, `exactly one h1 (found ${r.h1Count})`);
  check(r.emptyHeadings === 0, `no empty headings (found ${r.emptyHeadings})`);
  check(r.textLength > 400, `page has real content (${r.textLength} chars)`);

  const brokenImgs = r.imgs.filter((i) => !i.complete || i.naturalWidth === 0);
  check(brokenImgs.length === 0, `all ${r.imgs.length} images decoded`);
  for (const img of brokenImgs) {
    failures.push(`broken image: ${img.src}`);
    console.log(`       -> ${img.src}`);
  }

  check(
    r.scrollWidth <= r.clientWidth + 1,
    `no horizontal overflow (scroll ${r.scrollWidth} vs client ${r.clientWidth})`
  );

  check(r.deadAnchors.length === 0, `no dead same-page anchors`);
  for (const a of r.deadAnchors) failures.push(`dead anchor ${a} on ${spec.file}`);

  for (const needle of spec.requires) {
    const found = await cdp.send("Runtime.evaluate", {
      expression: `document.body.innerText.includes(${JSON.stringify(needle)})`,
      returnByValue: true,
    });
    check(found.result.value === true, `mentions ${JSON.stringify(needle)}`);
  }

  if (spec.expectDisabledCta) {
    check(r.disabledCtaCount > 0, "primary CTA is present and marked unavailable");
    if (r.disabledCtaCount === 0) {
      notes.push("index.html has no aria-disabled CTA; the listing may be published now");
    }
  }

  // Console and network errors, scoped to this navigation.
  const consoleErrors = cdp.events
    .filter((e) => e.method === "Log.entryAdded" && e.params.entry.level === "error")
    .map((e) => e.params.entry.text);
  const failedRequests = cdp.events
    .filter((e) => e.method === "Network.loadingFailed")
    .map((e) => e.params.errorText);
  const badResponses = cdp.events
    .filter((e) => e.method === "Network.responseReceived" && e.params.response.status >= 400)
    .map((e) => `${e.params.response.status} ${e.params.response.url}`);

  check(consoleErrors.length === 0, `no console errors`);
  for (const e of consoleErrors) console.log(`       -> ${e}`);
  check(badResponses.length === 0, `no 4xx/5xx sub-resources`);
  for (const e of badResponses) console.log(`       -> ${e}`);
  if (failedRequests.length) {
    // Aborted navigations are expected when we move to the next page.
    notes.push(`${spec.file}@${width.name}: ${failedRequests.length} cancelled request(s)`);
  }

  cdp.events.length = 0;
}

async function main() {
  if (!fs.existsSync(DOCS)) throw new Error("docs/ not found");

  const server = await serve();
  const chrome = await launchChrome();
  let cdp;
  try {
    const targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
    const page = targets.find((t) => t.type === "page");
    if (!page) throw new Error("no page target");
    cdp = await CDP.connect(page.webSocketDebuggerUrl);

    for (const spec of PAGES) {
      for (const width of WIDTHS) {
        await verifyPage(cdp, spec, width);
      }
    }
  } finally {
    cdp?.ws.close();
    await chrome.close();
    server.close();
  }

  if (notes.length) {
    console.log("\nnotes:");
    for (const n of notes) console.log(`  - ${n}`);
  }

  if (failures.length) {
    console.log(`\n${failures.length} problem(s) found.`);
    process.exit(1);
  }
  console.log(`\nDocs render cleanly at ${WIDTHS.map((w) => w.width + "px").join(" and ")}.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});