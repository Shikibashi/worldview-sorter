import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'dist/pages');
const readJson = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const current = await readJson('data/current.json');
const catalog = await readJson(current.affinityCatalog.path);
const storageKey = 'worldview-sorter:quiz-experience:1';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const name = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).slice(1);
    assert.ok(/^[A-Za-z0-9_./-]+$/.test(name) && !name.split('/').includes('..'));
    const data = await readFile(path.join(site, name));
    res.writeHead(200, { 'Content-Type': types[path.extname(name)] ?? 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
let checks = 0;
const check = (label, condition) => { assert.ok(condition, label); checks++; };
try {
  browser = await chromium.launch(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {});
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [], writes = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url()); });
  await page.goto(base);
  await page.waitForSelector('body[data-ready="true"]');
  await page.locator('#choose-route').click();
  await page.locator('.route[data-size]').first().click();
  await page.locator('#quiz').waitFor();
  await page.locator('#auto').uncheck();
  let answered = 0;
  while (await page.locator('#quiz').isVisible()) {
    assert.ok(answered++ < 400, 'Questionnaire must terminate');
    if (await page.locator('#quiz').getAttribute('data-scale') === 'ranking_all') {
      const selects = page.locator('#answer-options select');
      for (let i = 0; i < await selects.count(); i++) await selects.nth(i).selectOption(String(i + 1));
      await page.locator('#confirm-ranking').click();
    } else await page.locator('#answer-options .answer').first().click();
    await page.locator('#next').click();
  }
  await page.locator('#results').waitFor();
  check('The compiled app contains the tradition explorer', await page.locator('#tradition-explorer').count() === 1);
  const original = await page.evaluate(key => localStorage.getItem(key), storageKey);
  const originalQuiz = JSON.parse(original).quiz;
  check('No tradition is automatically chosen as a match', await page.locator('#explorer-tradition').inputValue() === '');
  check('No comparison appears before an explicit selection', await page.locator('#tradition-evidence').count() === 0);
  const ids = await page.locator('#explorer-tradition option').evaluateAll(options => options.map(o => o.value).filter(Boolean));
  assert.deepEqual(ids, catalog.traditions.map(t => t.id)); checks++;
  await page.locator('#explorer-search').fill('NO_MATCH_SYNTHETIC_6d770d2');
  check('Unmatched search reports absence rather than inventing a profile', await page.locator('#explorer-search-status').innerText().then(text => text.includes('No public tradition')));
  await page.locator('#explorer-search').fill('');
  await page.locator('#explorer-tradition').selectOption(ids[0]);
  check('Selected criteria come from the active public catalog', await page.locator('.wvs-explorer-criterion').count() === catalog.traditions[0].commitments.length);
  check('The selected tradition is explicit', await page.locator('#tradition-evidence').getAttribute('data-tradition-id') === ids[0]);
  if (ids.length > 1) {
    await page.locator('#explorer-tradition').selectOption(ids[1]);
    check('Changing selection does not retain stale comparison content', await page.locator('#tradition-evidence').getAttribute('data-tradition-id') === ids[1]);
  }
  await page.locator('#explorer-search').fill(catalog.traditions[0].name);
  check('Searching clears the previous selection', await page.locator('#tradition-evidence').count() === 0);
  await page.locator('#explorer-search').fill('');
  let offered = false;
  for (const id of ids) {
    await page.locator('#explorer-tradition').selectOption(id);
    const domainSelect = page.locator('#explorer-gap-domain');
    if (!(await domainSelect.count())) continue;
    const domains = await domainSelect.locator('option').evaluateAll(options => options.map(o => o.value).filter(Boolean));
    for (const domain of domains) {
      await domainSelect.selectOption(domain);
      if (await page.locator('#explorer-clarify').count()) { offered = true; break; }
    }
    if (offered) break;
  }
  check('A real Quick-route evidence gap can offer existing reviewed follow-ups', offered);
  check('Browsing leaves the saved questionnaire and answers byte-identical', await page.evaluate(key => localStorage.getItem(key), storageKey) === original);
  check('The view displays no compatibility percentage or winner', !/\d+(?:\.\d+)?%|best match|you are an? /i.test(await page.locator('#tradition-explorer').innerText()));
  check('Doctrine links use secure external-link attributes', await page.locator('#tradition-explorer a[target="_blank"]').evaluateAll(links => links.every(a => a.href.startsWith('https:') && a.rel.includes('noopener') && a.rel.includes('noreferrer'))));
  const evidence = page.locator('.wvs-explorer-criterion details').first();
  if (await evidence.count()) await evidence.locator(':scope > summary').click();
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(accessibility.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), []); checks++;
  await page.setViewportSize({ width: 320, height: 640 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  check('Expanded comparison reflows at 320 pixels with doubled text', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mkdir(path.join(root, 'artifacts/quiz'), { recursive: true });
  await page.locator('#tradition-explorer').screenshot({ path: path.join(root, 'artifacts/quiz/tradition-explorer.png') });
  await page.locator('#explorer-clarify').click();
  await page.locator('#quiz').waitFor();
  const extended = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).quiz, storageKey);
  assert.deepEqual(extended.session.responses, originalQuiz.session.responses); checks++;
  check('Explicit continuation adds questions rather than rewriting the completed route', extended.packet.size > originalQuiz.packet.size);
  check('No automatic uploads or browser errors occurred', writes.length === 0 && errors.length === 0);
  console.log(`Tradition explorer production browser: ${checks} checks passed.`);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
