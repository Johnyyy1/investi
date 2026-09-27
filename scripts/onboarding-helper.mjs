/** Complete the minimal funnel, then visit Learn for curriculum regression tests. */
export async function finishOnboarding(page) {
  await page.waitForURL("**/onboarding");
  await page.getByRole("button", { name: "Začít se učit", exact: true }).click();
  await page.waitForURL("**/learn/investing-foundations/why-invest");
  await page.goto(new URL("/learn", page.url()).href);
  await page.getByRole("heading", { name: "Pokračovat v učení", exact: true }).waitFor();
}
