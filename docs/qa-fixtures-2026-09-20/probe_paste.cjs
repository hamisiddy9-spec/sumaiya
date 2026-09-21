// PART 1 (paste half) — the composer/paste inputs on the live /assistant page:
//   * pasted plain text
//   * pasted HTML (rich clipboard -> what the app stores)
//   * an extremely long paste (127 KB)   -> schema max is 16,000 chars/message
//   * whitespace-only paste
//   * a paste shorter than the app's minimum readable length
// The AI request is intercepted (aborted) so the payload the app BUILT is the
// evidence and no model spend happens.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const STATE = path.join(__dirname, "testuser-state.json");
const OUTJSON = path.join(__dirname, "results-paste.json");
const EN = fs.readFileSync(path.join(__dirname, "cv.txt"), "utf8");
const HUGE = fs.readFileSync(path.join(__dirname, "cv-huge-paste.txt"), "utf8");

const CASES = [
  { key: "paste-plain-text", kind: "plain", text: EN, desc: "the whole 2.1 KB plain-text CV, pasted" },
  { key: "paste-html", kind: "html",
    html: "<h1>Amina Joseph Mwakasege</h1><p><b>Software Engineer</b></p><ul><li>TypeScript</li><li>PostgreSQL</li><li>AWS</li></ul><p>Summary: six years across East African payments &amp; logistics.</p>",
    text: "Amina Joseph Mwakasege Software Engineer TypeScript PostgreSQL AWS Summary: six years across East African payments & logistics.",
    desc: "rich HTML paste (h1/p/b/ul/li)" },
  { key: "paste-huge", kind: "plain", text: HUGE, desc: `extremely long paste — ${(HUGE.length / 1024).toFixed(0)} KB, ${HUGE.length} chars` },
  { key: "paste-whitespace", kind: "plain", text: "   \n\n\t  \n   ", desc: "whitespace-only paste" },
  { key: "paste-tiny", kind: "plain", text: "Hi", desc: "two-character paste" },
  { key: "paste-swahili", kind: "plain", text: fs.readFileSync(path.join(__dirname, "cv-sw.txt"), "utf8"), desc: "Swahili CV paste with ng' apostrophes" },
];

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1400, height: 1100 } });
  const captured = [];
  await ctx.route("**/api/ai/**", async (route) => {
    captured.push({ url: route.request().url(), body: (route.request().postData() || "").slice(0, 200000) });
    await route.abort("failed");
  });
  const page = await ctx.newPage();
  const out = [];

  for (const cs of CASES) {
    captured.length = 0;
    const rec = { key: cs.key, desc: cs.desc, chars: cs.text.length };
    try {
      await page.goto("https://sumaiya.app/assistant?lang=en", { waitUntil: "domcontentloaded", timeout: 90000 });
      await page.waitForTimeout(3500);

      const ta = page.locator("textarea").first();
      rec.textareaFound = (await ta.count()) > 0;
      if (!rec.textareaFound) { out.push(rec); console.log(JSON.stringify(rec)); continue; }
      rec.maxLength = await ta.getAttribute("maxlength");

      // paste (not type) so the app's real paste path is used
      await ta.click({ force: true });
      await ta.fill("");
      if (cs.kind === "html") {
        await ta.evaluate((el, html) => {
          el.focus();
          const dt = new DataTransfer();
          dt.setData("text/html", html);
          dt.setData("text/plain", el.ownerDocument.defaultView.__qaPlain || "");
          el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
        }, cs.html);
        await page.waitForTimeout(600);
        const v = await ta.inputValue();
        if (!v) { await ta.fill(cs.text); rec.clipboardHtmlRejected = true; }
      } else {
        await ta.evaluate((el, t) => {
          el.focus();
          const dt = new DataTransfer();
          dt.setData("text/plain", t);
          el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
        }, cs.text);
        await page.waitForTimeout(1200);
        let v = await ta.inputValue();
        if (!v && cs.text.trim()) { await ta.fill(cs.text); await page.waitForTimeout(800); rec.fillFallback = true; }
      }
      rec.textareaValueChars = (await ta.inputValue()).length;

      const btn = page.getByRole("button", { name: /^Tuma$|^Send$/ }).first();
      rec.sendFound = (await btn.count()) > 0;
      if (rec.sendFound) {
        await btn.click({ force: true });
        for (let k = 0; k < 30; k++) { await page.waitForTimeout(600); if (captured.length) break; }
      }
      rec.aiRequests = captured.length;
      if (captured.length) {
        rec.aiUrl = captured[0].url;
        let payload = null; try { payload = JSON.parse(captured[0].body); } catch { /* */ }
        const walk = (o) => { let b = ""; const f = (x) => { if (typeof x === "string") { if (x.length > b.length) b = x; } else if (x && typeof x === "object") Object.values(x).forEach(f); }; f(o); return b; };
        const longest = payload ? walk(payload) : "";
        rec.payloadChars = captured[0].body.length;
        rec.payloadLongestString = longest.length;
        rec.payloadFirstLine = longest.slice(0, 160);
      }
      rec.visibleAfter = (await page.evaluate(() => document.body.innerText)).slice(-400).replace(/\s+/g, " ");
    } catch (e) { rec.harnessError = String(e).slice(0, 250); }
    out.push(rec);
    console.log(JSON.stringify(rec));
  }
  fs.writeFileSync(OUTJSON, JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 500)); process.exit(1); });
