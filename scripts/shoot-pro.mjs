import { chromium } from "playwright";

const LOCALES = ["sw", "en"];

async function main() {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  for (const loc of LOCALES) {
    const url = `http://localhost:3111/${loc}/pro`;
    const resp = await pg.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await pg.screenshot({ path: `/tmp/pro-${loc}.png`, full_page: true });
    const txt = await pg.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
    console.log(`--- /${loc}/pro  http=${resp?.status()} chars=${txt.length}`);
    console.log("  download CTA:", /Pakua|Get the Android/.test(txt));
    console.log("  online CTA  :", /Anza mtandaoni|Start online/.test(txt));
    console.log("  designs     :", /Rift|rift/.test(txt), "| images:", await pg.evaluate(() => document.querySelectorAll("svg").length) + " svg");
    console.log("  head       :", txt.slice(0, 130));
  }
  await b.close();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
