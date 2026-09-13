import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 1000 } });

  const errors = [];
  pg.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text().slice(0, 300)}`);
  });
  pg.on("pageerror", (e) => errors.push(`pageerror: ${String(e).slice(0, 400)}`));

  await pg.goto("http://localhost:3111/sw/pro", { waitUntil: "networkidle", timeout: 90000 });
  await pg.waitForTimeout(3000);

  const probe = await pg.evaluate(() => {
    const h1 = document.querySelector("h1");
    const heroSection = document.querySelector("main > section");
    const cards = document.querySelectorAll('a[href^="/templates/"]');
    const bodyH = document.body.scrollHeight;
    const sections = Array.from(document.querySelectorAll("main > section")).map((s) => {
      const r = s.getBoundingClientRect();
      const cs = getComputedStyle(s);
      return {
        h: Math.round(r.height),
        opacity: cs.opacity,
        display: cs.display,
        text: (s.innerText || "").replace(/\s+/g, " ").slice(0, 60),
      };
    });
    return {
      h1: h1?.innerText ?? null,
      h1Opacity: h1 ? getComputedStyle(h1.closest("div") ?? h1).opacity : null,
      heroOpacity: heroSection ? getComputedStyle(heroSection).opacity : null,
      heroHeight: heroSection ? Math.round(heroSection.getBoundingClientRect().height) : null,
      designLinks: cards.length,
      bodyHeight: bodyH,
      sections,
    };
  });

  console.log(JSON.stringify(probe, null, 2));
  console.log("\n--- console ---");
  for (const e of errors.slice(0, 15)) console.log(" ", e);

  await b.close();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
