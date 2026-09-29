/** Skip optional personalization through its server action, then visit Learn for curriculum regression tests. */
export async function finishOnboarding(page) {
  await page.waitForURL("**/onboarding");
  await page.getByRole("button", { name: "Přeskočit personalizaci", exact: true }).click();
  await page.waitForURL("**/learn");
  await page.goto(new URL("/learn", page.url()).href);
  await page.getByRole("region", { name: "Doporučeno pro tebe", exact: true }).waitFor();
}
