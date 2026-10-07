const { launch } = require("./harness.cjs");

(async () => {
  const { browser, ctx, logs } = await launch();
  const page = await ctx.newPage();
  const r = await page.goto("https://sumaiya.app/assistant", { waitUntil: "domcontentloaded", timeout: 60000 });
  console.log("status:", r.status(), "final url:", page.url());
  await page.waitForTimeout(4000);
  console.log("title:", await page.title());
  const inputs = await page.$$eval("input[type=file]", (els) =>
    els.map((e) => ({ accept: e.accept, multiple: e.multiple, hidden: e.offsetParent === null })));
  console.log("file inputs:", JSON.stringify(inputs));
  const buttons = await page.$$eval("button", (els) => els.map((e) => (e.innerText || e.getAttribute("aria-label") || "").trim()).filter(Boolean).slice(0, 40));
  console.log("buttons:", JSON.stringify(buttons));
  const bodyHead = (await page.innerText("body")).slice(0, 1200);
  console.log("--- BODY ---\n" + bodyHead);

  // /tools page
  const p2 = await ctx.newPage();
  const r2 = await p2.goto("https://sumaiya.app/tools", { waitUntil: "domcontentloaded", timeout: 60000 });
  console.log("\n/tools status:", r2.status(), "url:", p2.url());
  await p2.waitForTimeout(4000);
  const t2 = (await p2.innerText("body")).slice(0, 1500);
  console.log("--- /tools BODY ---\n" + t2);

  console.log("\n--- console ---");
  for (const l of logs.slice(0, 30)) console.log(l.type, "|", l.text.slice(0, 200));
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
