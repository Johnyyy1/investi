// Progress presentation QA. Fixtures belong only to this run's disposable local learner.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import postgres from "postgres";
import { chromium } from "playwright";
import { finishOnboarding } from "./onboarding-helper.mjs";

const baseURL = process.env.PROGRESS_TEST_URL ?? "http://localhost:3000";
const local = (hostname) => ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
assert.ok(local(new URL(baseURL).hostname) && local(new URL(process.env.DATABASE_URL).hostname), "Requires a local app and disposable local database.");
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || "chrome" });
const screenshotDir = process.env.PROGRESS_SCREENSHOT_DIR ?? "/tmp/investi-progress-qa";
await mkdir(screenshotDir, { recursive: true });
let userId;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1024 }, timezoneId: "Europe/Prague" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const email = `progress-visual-${randomUUID()}@example.com`;
  await page.goto(`${baseURL}/sign-up`);
  await page.getByLabel("Jméno", { exact: true }).fill("Progress QA");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Heslo", { exact: true }).fill(randomUUID());
  await page.getByRole("button", { name: "Vytvořit účet", exact: true }).click();
  await finishOnboarding(page);
  [{ id: userId }] = await sql`select id from "user" where email = ${email}`;
  await sql`update learning_profile set time_zone = 'Europe/Prague', daily_goal_minutes = 10 where user_id = ${userId}`;
  const lessons = await sql`select l.id, l.title, m.slug as module_slug from lesson l join learning_module m on m.id = l.module_id where l.is_published = true order by m.position, l.position`;
  assert.equal(lessons.length, 12);

  async function render(label, xp, count, unlocked) {
    await page.goto(`${baseURL}/progress`);
    await page.getByRole("heading", { name: "Podívej se, jak daleko jsi došel.", exact: true }).waitFor();
    assert.equal(await page.getByTestId("total-xp").textContent(), `${xp} XP`);
    assert.match(await page.getByTestId("available-progress").textContent(), new RegExp(`${count} z 12`));
    assert.equal(await page.getByTestId("weekly-completed").textContent(), String(count));
    assert.equal(await page.getByRole("link", { name: unlocked ? "Otevřít Lab" : "Zobrazit podmínky", exact: true }).count(), 1);
    assert.equal(await page.getByRole("list", { name: "Dokončené lekce tento týden" }).getByRole("listitem").count(), 7);
    assert.equal(await page.getByText("Připravujeme", { exact: true }).count(), 3);
    for (const width of [1440, 1280, 1024, 768, 430, 390, 375, 320]) {
      await page.setViewportSize({ width, height: 1024 });
      await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); });
      const overflow = await page.evaluate(() => [...document.querySelectorAll("main *")].filter((el) => el.getBoundingClientRect().width && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX === "visible").map((el) => ({ tag: el.tagName, text: el.textContent?.slice(0, 60) })));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label}: page overflow at ${width}`);
      assert.deepEqual(overflow, [], `${label}: clipped text at ${width}`);
      assert.equal(await page.locator("main h1").count(), 1);
      const stats = page.getByRole("region", { name: "Přehled učení" }).locator(":scope > div");
      const boxes = await Promise.all((await stats.all()).map((stat) => stat.boundingBox()));
      if (width >= 1280) {
        assert.equal(new Set(boxes.map((box) => Math.round(box.y))).size, 1, "four equal desktop stats in one row");
        assert.equal(new Set(boxes.map((box) => Math.round(box.height))).size, 1, "equal desktop stat heights");
      }
      await page.screenshot({ path: `${screenshotDir}/${label}-${width}.png`, fullPage: true, animations: "disabled" });
    }
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 1024 });
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      await page.screenshot({ path: `${screenshotDir}/${label}-${width}-text-200.png`, fullPage: true, animations: "disabled" });
      const wide = await page.evaluate(() => [...document.querySelectorAll("main *")].filter((el) => el.getBoundingClientRect().right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 1).map((el) => ({ tag: el.tagName, text: el.textContent?.slice(0, 50), width: el.clientWidth, scroll: el.scrollWidth, right: el.getBoundingClientRect().right })));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label}: 200% text overflow at ${width}: ${JSON.stringify(wide)}`);
      await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
    }
    await page.setViewportSize({ width: 1440, height: 1024 });
    for (const link of await page.locator("main a").all()) {
      await link.focus();
      assert.equal(await link.evaluate((el) => el === document.activeElement && getComputedStyle(el).outlineStyle !== "none"), true, "visible keyboard focus");
      assert.ok((await link.boundingBox()).height >= 44, "44px link target");
    }
    const details = page.getByText("Jak funguje pokrok", { exact: true });
    await details.focus();
    await details.press("Enter");
    assert.equal(await details.evaluate((el) => el.parentElement.open), true);
    await details.press("Enter");
    const action = page.getByRole("link", { name: count === 12 ? "Prozkoumat Lab" : "Pokračovat v učení", exact: true });
    assert.ok(await action.getAttribute("href"));
    assert.equal(await action.evaluate((el) => getComputedStyle(el).transitionDuration), "0s");
  }

  async function complete(items) {
    for (const item of items) {
      await sql`insert into lesson_progress (user_id, lesson_id, status, last_position, completed_at, updated_at) values (${userId}, ${item.id}, 'completed', 0, now(), now()) on conflict (user_id, lesson_id) do nothing`;
      await sql`insert into lesson_award (user_id, lesson_id, xp, practice_capital_minor, reward_policy_version, learning_date, time_zone, awarded_at) values (${userId}, ${item.id}, 60, 0, 2, (now() at time zone 'Europe/Prague')::date, 'Europe/Prague', now()) on conflict (user_id, lesson_id) do nothing`;
    }
  }
  await render("zero", 0, 0, false);
  assert.equal(await page.getByText("Zatím nemáš žádnou lekci.", { exact: true }).count(), 1);
  await complete(lessons.filter((lesson) => lesson.module_slug === "returns").slice(0, 3));
  await render("partial", 180, 3, false);
  const recent = await sql`select l.title from lesson_progress p join lesson l on p.lesson_id = l.id where p.user_id = ${userId} order by p.completed_at desc limit 1`;
  assert.equal(await page.getByRole("region", { name: "Nedávno probráno" }).getByRole("link").textContent(), recent[0].title);
  await complete([...lessons.filter((lesson) => lesson.module_slug === "returns"), ...lessons.filter((lesson) => lesson.module_slug === "investing-foundations").slice(0, 2)]);
  await render("xp-without-prerequisites", 420, 7, false);
  assert.equal(await page.getByText("XP už máš. Dokonči všechny lekce Základů investování.", { exact: true }).count(), 1);
  await complete(lessons);
  // Raw fixture insertion bypasses completion transactions; let the existing unlock repair run before reading the grant.
  await page.goto(`${baseURL}/lab`);
  await render("completed", 720, 12, true);
  assert.match(await page.getByTestId("total-practice-capital").textContent(), /5\s000\sKč/);
  assert.equal(await page.getByRole("progressbar", { name: "Dokončené lekce modulu Základy investování" }).getAttribute("aria-valuenow"), "7");
  assert.equal(await page.getByRole("progressbar", { name: "XP potřebné k odemčení Portfolio Labu" }).getAttribute("aria-valuenow"), "420");
  await page.getByRole("link", { name: "Otevřít Lab", exact: true }).click();
  await page.waitForURL("**/lab/portfolio");
  await page.getByTestId("portfolio-cash").waitFor();
  assert.deepEqual(errors, []);
  console.log(`PASS: real loader presentation for zero, partial, XP without prerequisites, completed/unlocked; eight widths, 200% text, keyboard focus/targets, reduced motion, links, and no browser errors. Screenshots: ${screenshotDir}`);
} finally {
  await browser.close();
  if (userId) await sql`delete from "user" where id = ${userId}`;
  await sql.end();
}
