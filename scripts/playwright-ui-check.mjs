import { chromium } from 'playwright';

const baseUrl = 'http://localhost:3000';
const results = {
  registerHasGithubButton: false,
  signInHasGithubButton: false,
  loginSucceeded: false,
  dashboardUrl: null,
  sidebarHasAriaCurrent: false,
  sidebarActiveLikeClasses: [],
  navLinks: [],
  notes: [],
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(`${baseUrl}/register`, { waitUntil: 'networkidle', timeout: 30000 });
  const registerGithubCount = await page.getByRole('button', { name: /github/i }).count();
  const registerGithubLinkCount = await page.getByRole('link', { name: /github/i }).count();
  results.registerHasGithubButton = registerGithubCount + registerGithubLinkCount > 0;
  await page.screenshot({ path: 'context/screenshots/ui-review-register.png', fullPage: true });

  await page.goto(`${baseUrl}/sign-in`, { waitUntil: 'networkidle', timeout: 30000 });
  const signInGithubCount = await page.getByRole('button', { name: /github/i }).count();
  const signInGithubLinkCount = await page.getByRole('link', { name: /github/i }).count();
  results.signInHasGithubButton = signInGithubCount + signInGithubLinkCount > 0;
  await page.screenshot({ path: 'context/screenshots/ui-review-signin.png', fullPage: true });

  const email = page.locator('input[name="email"], input[type="email"]').first();
  const password = page.locator('input[name="password"], input[type="password"]').first();
  await email.fill('demo@devstash.io');
  await password.fill('12345678');

  const submit = page.getByRole('button', { name: /sign in|signin|continue/i }).first();
  await Promise.all([
    page.waitForURL(/\/dashboard|\/items|\/collections|\/favorites|\/settings/, { timeout: 20000 }).catch(() => null),
    submit.click(),
  ]);

  results.dashboardUrl = page.url();
  results.loginSucceeded = /\/dashboard|\/items|\/collections|\/favorites|\/settings/.test(results.dashboardUrl);

  if (results.loginSucceeded) {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'context/screenshots/ui-review-dashboard.png', fullPage: true });

    const navData = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]')).map((a) => {
        const text = (a.textContent || '').trim().replace(/\s+/g, ' ');
        const href = a.getAttribute('href') || '';
        const ariaCurrent = a.getAttribute('aria-current') || '';
        const className = a.className || '';
        return { text, href, ariaCurrent, className };
      });
      return links.filter((l) => /dashboard|items|collections|favorites|settings/i.test(`${l.text} ${l.href}`));
    });

    results.navLinks = navData;
    results.sidebarHasAriaCurrent = navData.some((l) => l.ariaCurrent === 'page');
    results.sidebarActiveLikeClasses = navData
      .filter((l) => /(active|selected|current|bg-|text-foreground|font-semibold)/i.test(l.className))
      .map((l) => `${l.text} -> ${l.className}`)
      .slice(0, 10);
  } else {
    await page.screenshot({ path: 'context/screenshots/ui-review-post-login.png', fullPage: true });
    results.notes.push('Login did not navigate to an authenticated dashboard route.');
  }
} catch (error) {
  results.notes.push(`Playwright run error: ${error instanceof Error ? error.message : String(error)}`);
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
