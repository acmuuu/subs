#!/usr/bin/env node
/**
 * One-shot: split inline <style>/<script> from HTML views into public/css & public/js.
 * Run from repo root: node scripts/extract-public-assets.mjs
 * (Do not re-run on already-extracted files unless you restore from git.)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const views = path.join(root, 'src', 'views');
const pubCss = path.join(root, 'public', 'css');
const pubJs = path.join(root, 'public', 'js');

fs.mkdirSync(pubCss, { recursive: true });
fs.mkdirSync(pubJs, { recursive: true });

function extractBodyScript(html) {
  const bodyIdx = html.indexOf('<body');
  if (bodyIdx === -1) throw new Error('no body');
  const s = html.indexOf('<script>', bodyIdx);
  const e = html.indexOf('</script>', s);
  if (s === -1 || e === -1) throw new Error('no body script');
  return {
    start: s,
    end: e + '</script>'.length,
    content: html.slice(s + '<script>'.length, e).replace(/\n$/, '')
  };
}

function extractHeadStyle(html) {
  const s = html.indexOf('<style>');
  const e = html.indexOf('</style>', s);
  if (s === -1 || e === -1) throw new Error('no head style');
  return {
    start: s,
    end: e + '</style>'.length,
    content: html.slice(s + '<style>'.length, e).replace(/\n$/, '')
  };
}

function transformPage(relPath, slug) {
  const full = path.join(root, relPath);
  let html = fs.readFileSync(full, 'utf8');
  if (html.includes(`href="/css/${slug}.css"`)) {
    console.warn(`skip (already extracted): ${relPath}`);
    return;
  }
  const st = extractHeadStyle(html);
  const sc = extractBodyScript(html);

  fs.writeFileSync(path.join(pubCss, `${slug}.css`), st.content.trimEnd() + '\n');
  fs.writeFileSync(path.join(pubJs, `${slug}.js`), sc.content.trimEnd() + '\n');

  const replacementStyle = `  <link rel="stylesheet" href="/css/${slug}.css">`;
  const replacementScript = `  <script src="/js/${slug}.js" defer></script>`;

  html = html.slice(0, st.start) + replacementStyle + html.slice(st.end, sc.start) + replacementScript + html.slice(sc.end);
  fs.writeFileSync(full, html);
  console.log(`ok: ${relPath} -> /css/${slug}.css, /js/${slug}.js`);
}

function extractTheme() {
  const full = path.join(views, 'theme-resources.html');
  let raw = fs.readFileSync(full, 'utf8');
  if (!raw.includes('<style>')) {
    console.warn('skip theme-resources (already extracted)');
    return;
  }
  const styleOpen = raw.indexOf('<style>');
  const styleClose = raw.indexOf('</style>', styleOpen);
  const scriptOpen = raw.indexOf('<script>', styleClose);
  const scriptClose = raw.indexOf('</script>', scriptOpen);

  const headLinks = raw.slice(0, styleOpen).trimEnd();
  const css = raw.slice(styleOpen + '<style>'.length, styleClose).trimEnd();
  const js = raw.slice(scriptOpen + '<script>'.length, scriptClose).trimEnd();

  fs.writeFileSync(path.join(pubCss, 'theme.css'), css + '\n');
  fs.writeFileSync(path.join(pubJs, 'theme.js'), js + '\n');

  const themeAssets = `${headLinks}

<link rel="stylesheet" href="/css/theme.css">
<script src="/js/theme.js"></script>
`;
  fs.writeFileSync(path.join(views, 'theme-assets.html'), themeAssets);
  console.log('ok: theme-resources.html -> theme.css, theme.js, theme-assets.html (remove theme-resources.html manually after updating pages.js)');
}

extractTheme();

transformPage('src/views/loginPage.html', 'login');
transformPage('src/views/adminPage.html', 'admin');
transformPage('src/views/configPage.html', 'config');
transformPage('src/views/dashboardPage.html', 'dashboard');
transformPage('src/views/newSubscriptionPage.html', 'new-subscription');
