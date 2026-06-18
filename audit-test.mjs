import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'https://cabinet-laatig-app-production.up.railway.app';
const OUTPUT = path.resolve('/tmp/opencode/audit-results');
fs.mkdirSync(OUTPUT, { recursive: true });

const results = [];

async function testPage(browser, label, url, { login } = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  page.on('response', resp => {
    if (resp.status() >= 400) {
      networkErrors.push(`${resp.status()} ${resp.url()}`);
    }
  });

  const result = { label, url, status: 'OK', errors: [], consoleErrors: [], networkErrors: [] };

  try {
    // Login first
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail"]').first();
    const passInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"], .login-btn, button:has-text("Se connecter")').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill(login?.email || 'mustapha@cabinetlaatig.ma');
      await passInput.fill(login?.password || 'Laatig2024!');
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }

    // Navigate to target URL
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const bodyHTML = await page.locator('body').innerHTML().catch(() => '');
    const hasSpinnerOnly = bodyHTML.includes('gold-spinner') && bodyText.trim().length < 20;
    const isEmpty = bodyText.trim() === '' || bodyHTML.trim() === '<div id="root"></div>';

    if (isEmpty || hasSpinnerOnly) {
      result.status = 'BLANK_PAGE';
    } else {
      result.status = 'OK';
    }

    await page.screenshot({
      path: path.join(OUTPUT, `${label.replace(/[^a-zA-Z0-9]/g, '_')}.png`),
      fullPage: true,
    });

    result.errors = errors;
    result.consoleErrors = consoleErrors;
    result.networkErrors = networkErrors;
  } catch (err) {
    result.status = 'CRASH';
    result.errors = [err.message];
  }

  results.push(result);

  const statusIcon = result.status === 'OK' ? '✅' : result.status === 'BLANK_PAGE' ? '⬜' : '💥';
  console.log(`  ${statusIcon} ${label}: ${result.status}${result.errors.length ? ` (${result.errors.length} js err)` : ''}${result.consoleErrors.length ? ` (${result.consoleErrors.length} console err)` : ''}${result.networkErrors.length ? ` (${result.networkErrors.length} net err)` : ''}`);

  await context.close();
  return result;
}

async function main() {
  console.log('🚀 Démarrage des tests navigateur...\n');

  const browser = await chromium.launch({ headless: true });

  // Get project IDs
  const tempContext = await browser.newContext();
  const tempPage = await tempContext.newPage();
  await tempPage.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await tempPage.locator('input[type="email"]').first().fill('mustapha@cabinetlaatig.ma');
  await tempPage.locator('input[type="password"]').first().fill('Laatig2024!');
  await tempPage.locator('button[type="submit"]').first().click();
  await tempPage.waitForTimeout(3000);
  const cookies = await tempContext.cookies();
  const tokenCookie = cookies.find(c => c.name === 'token');
  const token = tokenCookie ? tokenCookie.value : null;
  await tempContext.close();

  if (!token) { console.log('❌ Could not get auth token'); await browser.close(); return; }

  const projectsResp = await fetch(`${BASE}/api/projects`, {
    headers: { 'Cookie': `token=${token}` }
  });
  const projectsData = await projectsResp.json();
  const projects = projectsData.projects || [];
  const projectId = projects[0]?.id || 'test-id';

  console.log(`🔍 Found ${projects.length} projects. Using: ${projectId}\n`);

  // ===== OWNER =====
  console.log('═══ OWNER ═══\n');

  const ownerLogin = { email: 'mustapha@cabinetlaatig.ma', password: 'Laatig2024!' };

  // Login page first (to establish session)
  await testPage(browser, 'Login', '/login', { login: ownerLogin });
  const pages = [
    ['Dashboard', '/owner'],
    ['Clients', '/owner/clients'],
    ['Owner Projects', '/owner/projects'],
    ['Signatures', '/owner/signatures'],
    ['Projects List', '/projects'],
    ['Project Detail', `/projects/${projectId}`],
    ['Documents', `/projects/${projectId}/documents`],
    ['Transactions', `/projects/${projectId}/transactions`],
    ['Anomalies', `/projects/${projectId}/anomalies`],
    ['Bilan', `/projects/${projectId}/bilan`],
    ['CPC', `/projects/${projectId}/cpc`],
    ['Journal', `/projects/${projectId}/journal`],
    ['Grand Livre', `/projects/${projectId}/grand-livre`],
    ['Balance', `/projects/${projectId}/balance`],
    ['TVA', `/projects/${projectId}/tva`],
    ['SIG', `/projects/${projectId}/sig`],
    ['Liasse Fiscale', `/projects/${projectId}/liasse-fiscale`],
    ['Audit Report', `/projects/${projectId}/audit-report`],
    ['Synthèse', `/projects/${projectId}/synthese`],
    ['Cahier Travail', `/projects/${projectId}/cahier-travail`],
    ['Export Fiscal', `/projects/${projectId}/export`],
    ['Audit Trail', '/audit-trail'],
    ['Notifications', '/notifications'],
    ['Settings', '/settings'],
    ['Profile', '/profile'],
    ['About', '/about'],
  ];
  for (const [label, url] of pages) {
    await testPage(browser, label, url, { login: ownerLogin });
  }

  // ===== CLIENT =====
  console.log('\n═══ CLIENT ═══\n');

  // Register
  const clientEmail = `client_${Date.now()}@test.ma`;
  await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: clientEmail, password: 'Test1234!', fullName: 'Test Client' }),
  });

  const clientLogin = { email: clientEmail, password: 'Test1234!' };

  const clientPages = [
    ['Client Dashboard', '/client'],
    ['Client Profile', '/profile'],
    ['Client About', '/about'],
    ['Client Notifications', '/notifications'],
    ['Client Bilan (shared)', `/projects/${projectId}/bilan`],
    ['Client Transactions (shared)', `/projects/${projectId}/transactions`],
    ['Client Audit Trail', '/audit-trail'],
  ];
  for (const [label, url] of clientPages) {
    await testPage(browser, label, url, { login: clientLogin });
  }

  await browser.close();

  // ===== REPORT =====
  console.log('\n═══ RAPPORT ═══\n');

  const blanks = results.filter(r => r.status === 'BLANK_PAGE');
  const crashed = results.filter(r => r.status === 'CRASH');
  const jsErrors = results.filter(r => r.errors.length > 0);
  const consoleErrs = results.filter(r => r.consoleErrors.length > 0);
  const netErrs = results.filter(r => r.networkErrors.length > 0);

  if (blanks.length) console.log('⬜ PAGES BLANCHES:\n' + blanks.map(r => `  - ${r.label}`).join('\n'));
  if (crashed.length) console.log('💥 CRASH:\n' + crashed.map(r => `  - ${r.label}: ${r.errors[0]}`).join('\n'));
  if (jsErrors.length) console.log('⚠️ ERREURS JS:\n' + jsErrors.map(r => `  - ${r.label}: ${r.errors.slice(0,1)}`).join('\n'));
  if (consoleErrs.length) console.log('🔴 ERREURS CONSOLE:\n' + consoleErrs.map(r => `  - ${r.label}: ${r.consoleErrors.slice(0,1)}`).join('\n'));
  if (netErrs.length) console.log('🌐 ERREURS RÉSEAU:\n' + netErrs.map(r => `  - ${r.label}: ${r.networkErrors.slice(0,2).join('; ')}`).join('\n'));

  const total = results.length;
  const good = results.filter(r => r.status === 'OK' && r.errors.length === 0 && r.consoleErrors.length === 0 && r.networkErrors.length === 0).length;
  console.log(`\n📊 ${good}/${total} pages OK (${OUTPUT}/)`);
}

main().catch(console.error);
