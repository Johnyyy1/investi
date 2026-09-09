/** Complete the actual funnel for older lesson/product regression suites. */
export async function finishOnboarding(page) {
  await page.waitForURL("**/onboarding");
  await page.getByRole("button", { name: "Get started", exact: true }).click();
  for (const label of ["I know the basics", "Start investing confidently", "Stocks", "10 minutes"]) {
    await page.getByLabel(label, { exact: true }).check();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  await page.getByRole("heading", { name: "Your recommended path", exact: true }).waitFor();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Start learning", exact: true }).click();
  await page.waitForURL("**/dashboard");
}
